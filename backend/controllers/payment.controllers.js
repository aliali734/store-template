const crypto = require("crypto");
const mongoose = require("mongoose");
const Payment = require("../models/payment");
const Order = require("../models/order");
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

    const allowedMethods   = ["cash", "card", "wallet", "bnpl"];
    const allowedProviders = ["cod", "stripe", "paytabs", "tabby", "tamara", ""];

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

    // Manual check as a fast first line of defence. The unique index on
    // Payment.order is the authoritative guard against race conditions —
    // the E11000 duplicate-key error it throws is caught below.
    const existingPayment = await Payment.findOne({ order: orderId });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: "Payment already exists for this order"
      });
    }

    const payment = await Payment.create({
      order:    order._id,
      user:     userId,
      amount:   order.totalPrice,
      currency: String(currency || "SAR").toUpperCase(),
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
    // E11000 is MongoDB's duplicate-key error code. It fires when two
    // concurrent requests both pass the manual findOne check and then race
    // to insert — the unique index on `order` catches the second write.
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Payment already exists for this order"
      });
    }

    console.error("Create payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create payment"
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
  createStripeCheckoutSession,
  updatePaymentStatus,
  handleStripeWebhook
};