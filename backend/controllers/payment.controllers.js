const crypto = require("crypto");
const mongoose = require("mongoose");
const Payment = require("../models/payment");
const Order = require("../models/order");
const {
  axios,
  MOYASAR_API_URL,
  getMoyasarAuthHeader
} = require("../config/moyasar");
const stripe = require("../config/stripe");

// ============================
// GET PAYMENT BY ID
// ============================
const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment ID"
      });
    }

    const payment = await Payment.findById(id)
      .populate("order")
      .populate("user", "name email");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    return res.json({
      success: true,
      payment
    });
  } catch (error) {
    console.error("Get payment by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment"
    });
  }
};

// ============================
// GET PAYMENT BY ORDER ID
// ============================
const getPaymentByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID"
      });
    }

    const payment = await Payment.findOne({ order: orderId })
      .populate("order")
      .populate("user", "name email");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found for this order"
      });
    }

    return res.json({
      success: true,
      payment
    });
  } catch (error) {
    console.error("Get payment by order ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment"
    });
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
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Valid orderId is required"
      });
    }

    const normalizedMethod = String(method || "cash").toLowerCase();
    const normalizedProvider = String(
      provider || (normalizedMethod === "cash" ? "cod" : "")
    ).toLowerCase();

    const allowedMethods = ["cash", "card", "wallet", "bnpl"];
    const allowedProviders = ["cod", "stripe", "moyasar", "paytabs", "tabby", "tamara", ""];

    if (!allowedMethods.includes(normalizedMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method"
      });
    }

    if (!allowedProviders.includes(normalizedProvider)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment provider"
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (order.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized for this order"
      });
    }

    const existingPayment = await Payment.findOne({ order: orderId });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: "Payment already exists for this order"
      });
    }

    const payment = await Payment.create({
      order: order._id,
      user: userId,
      amount: order.totalPrice,
      currency: String(currency || "SAR").toUpperCase(),
      method: normalizedMethod,
      provider: normalizedProvider,
      status: "pending"
    });

    order.paymentMethod = normalizedMethod;
    order.paymentStatus = payment.status;
    order.paymentProvider = normalizedProvider;
    await order.save();

    return res.status(201).json({
      success: true,
      message: "Payment record created successfully",
      payment
    });
  } catch (error) {
    console.error("Create payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create payment"
    });
  }
};

// ============================
// CREATE MOYASAR PAYMENT
//
// Correct hosted-page flow:
// 1. Server sends amount + callback_url to Moyasar — NO card data.
// 2. Moyasar returns a payment object whose source.transaction_url
//    points to its secure hosted payment page.
// 3. This URL is returned to the frontend, which redirects the user
//    there to enter card details safely on Moyasar's own page.
// 4. After payment, Moyasar redirects the user to callback_url and
//    also fires a server-side webhook (handled by handleMoyasarWebhook).
// ============================
const createMoyasarPayment = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { paymentId, callbackUrl, description } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    if (!paymentId || !mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({
        success: false,
        message: "Valid paymentId is required"
      });
    }

    if (!callbackUrl) {
      return res.status(400).json({
        success: false,
        message: "callbackUrl is required"
      });
    }

    const payment = await Payment.findById(paymentId).populate("order");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    if (payment.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized for this payment"
      });
    }

    if (payment.provider !== "moyasar") {
      return res.status(400).json({
        success: false,
        message: "This payment is not configured for Moyasar"
      });
    }

    // Convert to the smallest currency unit (halalas for SAR)
    const amountHalalas = Math.round(Number(payment.amount) * 100);

    // No card details sent — Moyasar returns a hosted page URL in
    // source.transaction_url that the frontend redirects the user to.
    const payload = {
      amount: amountHalalas,
      currency: payment.currency || "SAR",
      description: description || `Order #${payment.order?._id || payment.order}`,
      callback_url: callbackUrl,
      source: {
        type: "creditcard"
      }
    };

    const response = await axios.post(MOYASAR_API_URL, payload, {
      headers: {
        ...getMoyasarAuthHeader(),
        "Content-Type": "application/json"
      }
    });

    const moyasarData = response.data;

    // Store Moyasar's own payment ID as our reference so the webhook
    // handler and return handler can look up this payment record by it.
    payment.reference = moyasarData.id || payment.reference;
    payment.providerResponse = moyasarData;
    await payment.save();

    // Extract the hosted-page redirect URL from the response.
    const transactionUrl = moyasarData.source?.transaction_url || null;

    if (!transactionUrl) {
      console.error("Moyasar did not return a transaction_url:", moyasarData);
      return res.status(502).json({
        success: false,
        message: "Moyasar did not return a payment URL. Check your API credentials and payload."
      });
    }

    return res.json({
      success: true,
      message: "Moyasar payment session created. Redirect the user to paymentUrl.",
      paymentUrl: transactionUrl,
      payment
    });
  } catch (error) {
    console.error("Create Moyasar payment error:", error.response?.data || error.message);

    return res.status(500).json({
      success: false,
      message: error.response?.data?.message || "Failed to create Moyasar payment"
    });
  }
};

// ============================
// CREATE STRIPE CHECKOUT SESSION
// ============================
const createStripeCheckoutSession = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { paymentId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    if (!paymentId || !mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({
        success: false,
        message: "Valid paymentId is required"
      });
    }

    const payment = await Payment.findById(paymentId).populate("order");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    if (payment.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized for this payment"
      });
    }

    if (payment.provider !== "stripe") {
      return res.status(400).json({
        success: false,
        message: "This payment is not configured for Stripe"
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://127.0.0.1:5500";
    console.log("Stripe success/cancel FRONTEND_URL:", frontendUrl);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: (payment.currency || "SAR").toLowerCase(),
            product_data: {
              name: `Order #${payment.order?._id || payment.order}`
            },
            unit_amount: Math.round(Number(payment.amount) * 100)
          },
          quantity: 1
        }
      ],
      metadata: {
        paymentId: payment._id.toString(),
        orderId: payment.order?._id
          ? payment.order._id.toString()
          : payment.order.toString(),
        userId: payment.user.toString()
      },
      success_url: `${frontendUrl}/confirmation.html?orderId=${
        payment.order?._id || payment.order
      }`,
      cancel_url: `${frontendUrl}/payment-failed.html?orderId=${
        payment.order?._id || payment.order
      }`
    });

    payment.reference = session.id;
    payment.providerResponse = session;
    await payment.save();

    return res.json({
      success: true,
      message: "Stripe checkout session created successfully",
      sessionId: session.id,
      url: session.url,
      payment
    });
  } catch (error) {
    console.error("Create Stripe checkout session error:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create Stripe checkout session"
    });
  }
};

// ============================
// UPDATE PAYMENT STATUS
// ============================
const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reference, providerResponse } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment ID"
      });
    }

    const allowedStatuses = ["pending", "paid", "failed", "cancelled", "refunded"];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status"
      });
    }

    const payment = await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    payment.status = status;

    if (reference !== undefined) {
      payment.reference = String(reference).trim();
    }

    if (providerResponse !== undefined) {
      payment.providerResponse = providerResponse;
    }

    if (status === "paid") {
      payment.paidAt = new Date();
    }

    await payment.save();

    const order = await Order.findById(payment.order);
    if (order) {
      order.paymentStatus    = payment.status;
      order.paymentReference = payment.reference || order.paymentReference || "";
      order.paymentProvider  = payment.provider  || order.paymentProvider  || "";
      order.isPaid           = payment.status === "paid";
      order.paidAt           = payment.status === "paid" ? payment.paidAt : undefined;
      await order.save();
    }

    return res.json({
      success: true,
      message: "Payment status updated successfully",
      payment
    });
  } catch (error) {
    console.error("Update payment status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update payment status"
    });
  }
};

// ============================
// HANDLE MOYASAR RETURN
// ============================
const handleMoyasarReturn = async (req, res) => {
  try {
    const paymentId = req.query.id || req.query.payment_id || "";
    const status    = String(req.query.status || "").toLowerCase();

    if (!paymentId) {
      return res.status(400).send("Missing payment reference");
    }

    const payment = await Payment.findOne({ reference: paymentId });

    if (!payment) {
      return res.status(404).send("Payment not found");
    }

    const order = await Order.findById(payment.order);

    if (!order) {
      return res.status(404).send("Order not found");
    }

    if (status === "paid" || status === "succeeded" || status === "success") {
      payment.status = "paid";
      payment.paidAt = new Date();

      order.paymentStatus    = "paid";
      order.isPaid           = true;
      order.paidAt           = payment.paidAt;
      order.paymentReference = payment.reference;
      order.paymentProvider  = payment.provider || "moyasar";

      await payment.save();
      await order.save();

      return res.redirect(
        `${process.env.FRONTEND_URL || "http://127.0.0.1:5500"}/confirmation.html`
      );
    }

    payment.status      = "failed";
    order.paymentStatus = "failed";
    order.isPaid        = false;
    order.paidAt        = undefined;

    await payment.save();
    await order.save();

    return res.redirect(
      `${process.env.FRONTEND_URL || "http://127.0.0.1:5500"}/payment-failed.html?orderId=${order._id}`
    );
  } catch (error) {
    console.error("Moyasar return handler error:", error);

    return res.status(500).send("Payment callback handling failed");
  }
};

// ============================
// HANDLE MOYASAR WEBHOOK
// Mounted in server.js with express.raw() before body parsers,
// so req.body is a raw Buffer here — same pattern as Stripe.
// ============================
const handleMoyasarWebhook = async (req, res) => {
  try {
    // ── Signature verification ──────────────────────────────────────
    const webhookSecret = process.env.MOYASAR_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("MOYASAR_WEBHOOK_SECRET is not set");
      return res.status(500).json({
        success: false,
        message: "Webhook secret not configured"
      });
    }

    const sig = req.headers["x-moyasar-signature"];

    if (!sig) {
      return res.status(400).json({
        success: false,
        message: "Missing Moyasar webhook signature"
      });
    }

    const expectedSig = crypto
      .createHmac("sha256", webhookSecret)
      .update(req.body) // req.body is a raw Buffer from express.raw()
      .digest("hex");

    // Constant-time comparison to prevent timing attacks
    let signaturesMatch = false;
    try {
      const sigBuffer      = Buffer.from(sig,         "hex");
      const expectedBuffer = Buffer.from(expectedSig, "hex");

      signaturesMatch =
        sigBuffer.length === expectedBuffer.length &&
        crypto.timingSafeEqual(sigBuffer, expectedBuffer);
    } catch {
      signaturesMatch = false;
    }

    if (!signaturesMatch) {
      console.warn("Moyasar webhook signature mismatch");
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature"
      });
    }

    // ── Parse body (now that signature is verified) ─────────────────
    let payload;
    try {
      payload = JSON.parse(req.body.toString());
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid JSON payload"
      });
    }

    // ── Process event ───────────────────────────────────────────────
    const paymentReference = payload.id || payload.payment_id || "";
    const externalStatus   = String(payload.status || "").toLowerCase();

    if (!paymentReference) {
      return res.status(400).json({
        success: false,
        message: "Missing payment reference"
      });
    }

    const payment = await Payment.findOne({ reference: paymentReference });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    const order = await Order.findById(payment.order);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    payment.providerResponse = payload;

    if (
      externalStatus === "paid" ||
      externalStatus === "success" ||
      externalStatus === "succeeded"
    ) {
      payment.status = "paid";
      payment.paidAt = new Date();

      order.paymentStatus    = "paid";
      order.isPaid           = true;
      order.paidAt           = payment.paidAt;
      order.paymentReference = payment.reference;
      order.paymentProvider  = payment.provider || "moyasar";
    } else if (
      externalStatus === "failed" ||
      externalStatus === "cancelled" ||
      externalStatus === "canceled"
    ) {
      payment.status = "failed";

      order.paymentStatus = "failed";
      order.isPaid        = false;
      order.paidAt        = undefined;
    }

    await payment.save();
    await order.save();

    return res.json({
      success: true,
      message: "Webhook processed successfully"
    });
  } catch (error) {
    console.error("Moyasar webhook handler error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to process webhook"
    });
  }
};

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

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const paymentId = session.metadata?.paymentId;
      const orderId   = session.metadata?.orderId;

      if (paymentId && mongoose.Types.ObjectId.isValid(paymentId)) {
        const payment = await Payment.findById(paymentId);

        if (payment) {
          payment.status           = "paid";
          payment.paidAt           = new Date();
          payment.reference        = session.id || payment.reference;
          payment.providerResponse = session;
          await payment.save();
        }
      }

      if (orderId && mongoose.Types.ObjectId.isValid(orderId)) {
        const order = await Order.findById(orderId);

        if (order) {
          order.paymentStatus    = "paid";
          order.paymentProvider  = "stripe";
          order.paymentReference = session.id || order.paymentReference || "";
          order.isPaid           = true;
          order.paidAt           = new Date();
          await order.save();
        }
      }
    }

    return res.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook handler error:", error.message);
    return res.status(500).send("Webhook handling failed");
  }
};

module.exports = {
  getPaymentById,
  getPaymentByOrderId,
  createPayment,
  createMoyasarPayment,
  createStripeCheckoutSession,
  updatePaymentStatus,
  handleMoyasarReturn,
  handleMoyasarWebhook,
  handleStripeWebhook
};