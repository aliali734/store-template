const crypto        = require("crypto");
const mongoose      = require("mongoose");
const Payment       = require("../models/payment");
const Order         = require("../models/order");
const StoreSettings = require("../models/storeSettings");
const stripe        = require("../config/stripe");

// Resolve the currency to use for a payment. Priority:
//   1. Currency configured in StoreSettings (set by the admin in setup wizard)
//   2. Currency supplied in the request body
//   3. Hard fallback to "USD"
// Stripe rejects sessions whose currency the connected account doesn't
// support, so reading from settings prevents the hard-coded "SAR" bug.
async function resolvePaymentCurrency(requestedCurrency) {
  try {
    const settings = await StoreSettings.findOne();
    const fromSettings = settings?.currency?.trim();
    if (fromSettings) return fromSettings.toUpperCase();
  } catch (e) {
    console.warn("resolvePaymentCurrency: settings lookup failed:", e.message);
  }
  return String(requestedCurrency || "USD").toUpperCase();
}

// ============================
// GET PAYMENT BY ID
// ============================
const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid payment ID" });
    }

    const payment = await Payment.findById(id)
      .populate("order")
      .populate("user", "name email");

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    return res.json({ success: true, payment });
  } catch (error) {
    console.error("Get payment by ID error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch payment" });
  }
};

// ============================
// GET PAYMENT BY ORDER ID
// ============================
const getPaymentByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }

    const payment = await Payment.findOne({ order: orderId })
      .populate("order")
      .populate("user", "name email");

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found for this order" });
    }

    return res.json({ success: true, payment });
  } catch (error) {
    console.error("Get payment by order ID error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch payment" });
  }
};

// ============================
// CREATE PAYMENT RECORD
// ============================
const createPayment = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { orderId, method, provider, currency } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: "Valid orderId is required" });
    }

    const normalizedMethod   = String(method   || "cash").toLowerCase();
    const normalizedProvider = String(provider || (normalizedMethod === "cash" ? "cod" : "")).toLowerCase();

    const allowedMethods   = ["cash", "card", "wallet", "bnpl"];
    const allowedProviders = ["cod", "stripe", "paytabs", "tabby", "tamara", ""];

    if (!allowedMethods.includes(normalizedMethod)) {
      return res.status(400).json({ success: false, message: "Invalid payment method" });
    }

    if (!allowedProviders.includes(normalizedProvider)) {
      return res.status(400).json({ success: false, message: "Invalid payment provider" });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.user.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized for this order" });
    }

    // Manual guard (unique index is the authoritative race-condition guard)
    const existingPayment = await Payment.findOne({ order: orderId });
    if (existingPayment) {
      return res.status(400).json({ success: false, message: "Payment already exists for this order" });
    }

    const resolvedCurrency = await resolvePaymentCurrency(currency);

    const payment = await Payment.create({
      order:    order._id,
      user:     userId,
      amount:   order.totalPrice,
      currency: resolvedCurrency,
      method:   normalizedMethod,
      provider: normalizedProvider,
      status:   "pending"
    });

    order.paymentMethod   = normalizedMethod;
    order.paymentStatus   = payment.status;
    order.paymentProvider = normalizedProvider;
    await order.save();

    return res.status(201).json({
      success: true,
      message: "Payment record created successfully",
      payment
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Payment already exists for this order" });
    }
    console.error("Create payment error:", error);
    return res.status(500).json({ success: false, message: "Failed to create payment" });
  }
};

// ============================
// CREATE STRIPE CHECKOUT SESSION
// ============================
const createStripeCheckoutSession = async (req, res) => {
  try {
    const userId    = req.user?.id || req.user?._id;
    const { paymentId } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!paymentId || !mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({ success: false, message: "Valid paymentId is required" });
    }

    const payment = await Payment.findById(paymentId).populate("order");

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    if (payment.user.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized for this payment" });
    }

    const order = payment.order;

    if (!order) {
      return res.status(404).json({ success: false, message: "Associated order not found" });
    }

    // ── Look up the admin's connected Stripe account ──
    // With Stripe Connect, the funds flow to the admin's account, not
    // our platform. We must reject the payment cleanly if the admin
    // hasn't completed Connect onboarding (otherwise Stripe would
    // accept the charge but the admin would never receive the money).
    const settings = await StoreSettings.findOne();
    const connect  = settings?.stripe;

    if (!connect?.accountId) {
      return res.status(503).json({
        success: false,
        message: "This store hasn't finished setting up payments yet. Please try again later."
      });
    }
    if (!connect.chargesEnabled) {
      return res.status(503).json({
        success: false,
        message: "This store can't accept card payments yet. Please try again later."
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5500";

    const lineItems = (order.products || []).map((item) => ({
      price_data: {
        currency:     (payment.currency || "usd").toLowerCase(),
        product_data: { name: item.name || "Product" },
        unit_amount:  Math.round(Number(item.price || 0) * 100)
      },
      quantity: item.quantity || 1
    }));

    if (!lineItems.length) {
      return res.status(400).json({ success: false, message: "Order has no items" });
    }

    const sessionMetadata = {
      paymentId: payment._id.toString(),
      orderId:   order._id.toString()
    };

    // ── Platform fee (currently 0 = the admin keeps 100%) ──
    // To enable a platform fee in the future, set PLATFORM_FEE_BPS in
    // env (e.g. "100" for 1%) or change the constant below. Stripe
    // expects an integer in the smallest currency unit.
    const PLATFORM_FEE_BPS = Number(process.env.PLATFORM_FEE_BPS || 0);
    const orderTotalMinor  = lineItems.reduce(
      (sum, li) => sum + li.price_data.unit_amount * li.quantity,
      0
    );
    const applicationFeeAmount = PLATFORM_FEE_BPS > 0
      ? Math.floor((orderTotalMinor * PLATFORM_FEE_BPS) / 10000)
      : 0;

    const paymentIntentData = {
      metadata: sessionMetadata
    };

    // Only set application_fee_amount when it's > 0; Stripe rejects 0.
    if (applicationFeeAmount > 0) {
      paymentIntentData.application_fee_amount = applicationFeeAmount;
    }

    // The session itself is created on YOUR platform account, but the
    // charge is automatically transferred to the connected account.
    // This is the "Direct charges" pattern using `stripeAccount` header:
    // we pass it via the SDK's second argument so the session lives on
    // the connected account's books. The admin sees the payment in
    // their own Stripe Express Dashboard.
    const session = await stripe.checkout.sessions.create(
      {
        payment_method_types: ["card"],
        mode:                 "payment",
        line_items:           lineItems,
        success_url:          `${frontendUrl}/confirmation.html`,
        cancel_url:           `${frontendUrl}/payment-failed.html`,
        metadata:             sessionMetadata,
        payment_intent_data:  paymentIntentData
      },
      {
        // ⬇️ THE KEY LINE — routes the charge to the admin's account.
        stripeAccount: connect.accountId
      }
    );

    return res.json({ success: true, url: session.url, sessionId: session.id });
  } catch (error) {
    console.error("Create Stripe checkout session error:", error);
    return res.status(500).json({ success: false, message: "Failed to create Stripe checkout session" });
  }
};

// ============================
// UPDATE PAYMENT STATUS (ADMIN)
// ============================
const updatePaymentStatus = async (req, res) => {
  try {
    const { id }     = req.params;
    const { status } = req.body;

    const allowedStatuses = ["pending", "paid", "failed", "cancelled", "refunded"];

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid payment ID" });
    }

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    const payment = await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    payment.status = status;

    if (status === "paid" && !payment.paidAt) {
      payment.paidAt = new Date();
    }

    await payment.save();

    return res.json({ success: true, message: "Payment status updated", payment });
  } catch (error) {
    console.error("Update payment status error:", error);
    return res.status(500).json({ success: false, message: "Failed to update payment status" });
  }
};

// ============================
// HELPERS
// ============================

// Slim down a Stripe Checkout Session before storing it.
// The full object is ~5-10 KB and includes PII (email, billing address).
// We only keep what's useful for support, refunds, and reconciliation.
function slimStripeSession(session) {
  if (!session || typeof session !== "object") return {};
  return {
    id:              session.id,
    object:          session.object,
    payment_status:  session.payment_status,
    amount_total:    session.amount_total,
    amount_subtotal: session.amount_subtotal,
    currency:        session.currency,
    customer_email:  session.customer_details?.email || session.customer_email || null,
    payment_intent:  typeof session.payment_intent === "string"
                       ? session.payment_intent
                       : session.payment_intent?.id || null,
    mode:            session.mode,
    created:         session.created,
    metadata:        session.metadata || {}
  };
}

// Find a Payment record from a Stripe Session or PaymentIntent.
// Tries metadata.paymentId first; falls back to looking up by the
// payment_intent ID stored in providerResponse (useful for refund events).
async function findPaymentForStripeObject(stripeObj) {
  const meta = stripeObj?.metadata || {};

  if (meta.paymentId && mongoose.Types.ObjectId.isValid(meta.paymentId)) {
    const p = await Payment.findById(meta.paymentId);
    if (p) return p;
  }

  // Fallback: charge.refunded / payment_intent.* events don't carry our
  // metadata directly — look up by the stored payment_intent reference.
  const piId = typeof stripeObj?.payment_intent === "string"
                 ? stripeObj.payment_intent
                 : stripeObj?.payment_intent?.id || stripeObj?.id || null;

  if (piId) {
    const p = await Payment.findOne({ "providerResponse.payment_intent": piId });
    if (p) return p;
  }

  return null;
}

// ============================
// HANDLE STRIPE WEBHOOK
// ============================
const handleStripeWebhook = async (req, res) => {
  try {
    const sig = req.headers["stripe-signature"];

    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(400).send("Missing Stripe webhook signature or secret");
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Stripe webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // ── Dispatch ──
    switch (event.type) {

      // ----- Connected account capability changed (Stripe Connect) -----
      // Fired when the admin completes onboarding or when Stripe later
      // revokes/grants capabilities. We refresh the cached flags so the
      // admin panel and `createStripeCheckoutSession` reflect reality.
      case "account.updated": {
        const account = event.data.object;
        if (account?.id) {
          const settings = await StoreSettings.findOne({
            "stripe.accountId": account.id
          });
          if (settings) {
            settings.stripe = {
              ...(settings.stripe?.toObject?.() || settings.stripe || {}),
              accountId:        account.id,
              chargesEnabled:   !!account.charges_enabled,
              payoutsEnabled:   !!account.payouts_enabled,
              detailsSubmitted: !!account.details_submitted,
              lastCheckedAt:    new Date()
            };
            await settings.save();
          }
        }
        break;
      }

      // ----- Successful Checkout -----
      case "checkout.session.completed": {
        const session = event.data.object;
        const payment = await findPaymentForStripeObject(session);

        // IDEMPOTENCY: skip if we've already processed this exact event
        if (payment?.lastWebhookEventId === event.id) {
          return res.json({ received: true, deduped: true });
        }

        if (payment) {
          payment.status             = "paid";
          payment.paidAt             = payment.paidAt || new Date();
          payment.reference          = session.id || payment.reference;
          payment.providerResponse   = slimStripeSession(session);
          payment.lastWebhookEventId = event.id;
          await payment.save();
        }

        const orderId = session.metadata?.orderId;
        if (orderId && mongoose.Types.ObjectId.isValid(orderId)) {
          const order = await Order.findById(orderId);
          if (order && !order.isPaid) {
            order.paymentStatus    = "paid";
            order.paymentProvider  = "stripe";
            order.paymentReference = session.id || order.paymentReference || "";
            order.isPaid           = true;
            order.paidAt           = new Date();
            await order.save();
          }
        }
        break;
      }

      // ----- Customer abandoned Checkout (24h timeout) -----
      case "checkout.session.expired": {
        const session = event.data.object;
        const payment = await findPaymentForStripeObject(session);

        if (payment?.lastWebhookEventId === event.id) {
          return res.json({ received: true, deduped: true });
        }

        if (payment && payment.status === "pending") {
          payment.status             = "cancelled";
          payment.providerResponse   = slimStripeSession(session);
          payment.lastWebhookEventId = event.id;
          await payment.save();
        }

        const orderId = session.metadata?.orderId;
        if (orderId && mongoose.Types.ObjectId.isValid(orderId)) {
          const order = await Order.findById(orderId);
          if (order && order.paymentStatus !== "paid") {
            order.paymentStatus = "cancelled";
            await order.save();
          }
        }
        break;
      }

      // ----- Delayed payment (SEPA, Klarna, etc.) ultimately failed -----
      case "checkout.session.async_payment_failed":
      case "payment_intent.payment_failed": {
        const obj     = event.data.object;
        const payment = await findPaymentForStripeObject(obj);

        if (payment?.lastWebhookEventId === event.id) {
          return res.json({ received: true, deduped: true });
        }

        if (payment) {
          payment.status             = "failed";
          payment.providerResponse   = slimStripeSession(obj);
          payment.lastWebhookEventId = event.id;
          await payment.save();
        }

        const orderId = obj?.metadata?.orderId;
        if (orderId && mongoose.Types.ObjectId.isValid(orderId)) {
          const order = await Order.findById(orderId);
          if (order && order.paymentStatus !== "paid") {
            order.paymentStatus = "failed";
            await order.save();
          }
        }
        break;
      }

      // ----- Refund issued via Stripe Dashboard or API -----
      case "charge.refunded": {
        const charge  = event.data.object;
        const payment = await findPaymentForStripeObject(charge);

        if (payment?.lastWebhookEventId === event.id) {
          return res.json({ received: true, deduped: true });
        }

        if (payment) {
          payment.status             = "refunded";
          payment.providerResponse   = slimStripeSession(charge);
          payment.lastWebhookEventId = event.id;
          await payment.save();

          if (payment.order && mongoose.Types.ObjectId.isValid(payment.order)) {
            const order = await Order.findById(payment.order);
            if (order) {
              order.paymentStatus = "refunded";
              await order.save();
            }
          }
        }
        break;
      }

      default:
        // Acknowledge but don't process unknown event types — Stripe
        // sends many events, and we must return 2xx or it'll retry.
        console.log(`[stripe-webhook] Unhandled event type: ${event.type}`);
    }

    return res.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook handler error:", error.message);
    return res.status(500).send("Webhook handling failed");
  }
};

// ============================================================
// STRIPE CONNECT — onboard admin's account
// ============================================================
//
// We use Stripe Connect EXPRESS. The admin clicks "Connect Stripe"
// in the admin panel; we either:
//   - create a brand-new Express account for them (first call), OR
//   - re-use the one we created last time (if onboarding wasn't
//     finished, or they need to update info).
//
// We then generate a one-time Account Link and return its URL to the
// frontend, which redirects the browser. The admin completes (or
// resumes) onboarding on Stripe's hosted UI, then Stripe sends them
// back to our `return_url`. We never see or store their secret key —
// we just remember their account ID.
// ============================================================
const createConnectOnboardingLink = async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({
        success: false,
        message: "Platform Stripe key is not configured on the server."
      });
    }

    let settings = await StoreSettings.findOne();
    if (!settings) settings = await StoreSettings.create({});

    // 1. Re-use an existing Express account if we already created one.
    //    Otherwise create a fresh one.
    let accountId = settings.stripe?.accountId;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        // capabilities tell Stripe what the account will be used for.
        // card_payments + transfers is the standard pair for accepting
        // card payments and receiving the resulting funds.
        capabilities: {
          card_payments: { requested: true },
          transfers:     { requested: true }
        },
        // Tag the account with our internal settings id so we can map
        // webhook events back to the right StoreSettings document.
        metadata: {
          storeSettingsId: settings._id.toString()
        }
      });

      accountId = account.id;
      settings.stripe = {
        ...(settings.stripe?.toObject?.() || settings.stripe || {}),
        accountId,
        chargesEnabled:   !!account.charges_enabled,
        payoutsEnabled:   !!account.payouts_enabled,
        detailsSubmitted: !!account.details_submitted,
        lastCheckedAt:    new Date()
      };
      await settings.save();
    }

    // 2. Generate a single-use Account Link for onboarding/refresh.
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5500";

    const link = await stripe.accountLinks.create({
      account:     accountId,
      // If the link expires or the user hits "back", Stripe sends them
      // to refresh_url; our admin page should detect this and re-call
      // /onboard to mint a fresh link.
      refresh_url: `${frontendUrl}/admin.html?stripe=refresh`,
      return_url:  `${frontendUrl}/admin.html?stripe=return`,
      type:        "account_onboarding"
    });

    return res.json({ success: true, url: link.url, accountId });
  } catch (error) {
    console.error("Create Connect onboarding link error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create Stripe onboarding link"
    });
  }
};

// ============================================================
// STRIPE CONNECT — refresh + return the connected account status
// ============================================================
const getConnectStatus = async (req, res) => {
  try {
    const settings = await StoreSettings.findOne();
    const accountId = settings?.stripe?.accountId;

    if (!accountId) {
      return res.json({
        success: true,
        connected: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false
      });
    }

    // Always re-fetch from Stripe so the admin sees the truth, not
    // a stale cached flag.
    const account = await stripe.accounts.retrieve(accountId);

    settings.stripe = {
      ...(settings.stripe?.toObject?.() || settings.stripe || {}),
      accountId,
      chargesEnabled:   !!account.charges_enabled,
      payoutsEnabled:   !!account.payouts_enabled,
      detailsSubmitted: !!account.details_submitted,
      lastCheckedAt:    new Date()
    };
    await settings.save();

    return res.json({
      success:          true,
      connected:        true,
      accountId,
      chargesEnabled:   !!account.charges_enabled,
      payoutsEnabled:   !!account.payouts_enabled,
      detailsSubmitted: !!account.details_submitted,
      // Useful for showing "Continue onboarding" instead of "Connected"
      // when the admin started but didn't finish.
      requirements:     account.requirements || null
    });
  } catch (error) {
    console.error("Get Connect status error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch Stripe Connect status"
    });
  }
};

// ============================================================
// STRIPE CONNECT — admin disconnects their account
// ============================================================
// Doesn't delete the Stripe account itself (the admin owns it on
// Stripe's side); just severs the link from this store.
// ============================================================
const disconnectStripe = async (req, res) => {
  try {
    const settings = await StoreSettings.findOne();
    if (!settings) {
      return res.json({ success: true, message: "Nothing to disconnect" });
    }

    settings.stripe = {
      accountId:        "",
      chargesEnabled:   false,
      payoutsEnabled:   false,
      detailsSubmitted: false,
      lastCheckedAt:    new Date()
    };
    await settings.save();

    return res.json({ success: true, message: "Stripe account disconnected" });
  } catch (error) {
    console.error("Disconnect Stripe error:", error);
    return res.status(500).json({ success: false, message: "Failed to disconnect" });
  }
};

module.exports = {
  getPaymentById,
  getPaymentByOrderId,
  createPayment,
  createStripeCheckoutSession,
  updatePaymentStatus,
  handleStripeWebhook,
  createConnectOnboardingLink,
  getConnectStatus,
  disconnectStripe
};