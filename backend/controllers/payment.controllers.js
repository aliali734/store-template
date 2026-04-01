const mongoose = require("mongoose");
const Payment = require("../models/payment");
const Order = require("../models/order");
const {
  axios,
  MOYASAR_API_URL,
  getMoyasarAuthHeader
} = require("../config/moyasar");

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

    const amountHalalas = Math.round(Number(payment.amount) * 100);

    const payload = {
      amount: amountHalalas,
      currency: payment.currency || "SAR",
      description: description || `Order #${payment.order?._id || payment.order}`,
      callback_url: callbackUrl,
      source: {
        type: "creditcard",
        name: payment.order?.user?.name || "Customer",
        number: "4111111111111111",
        month: 12,
        year: 2029,
        cvc: "123"
      }
    };

    // NOTE:
    // This is scaffold-level integration.
    // In production, card details should never be sent from your backend like this.
    // You would use Moyasar hosted fields / secure frontend collection flow.

    const response = await axios.post(MOYASAR_API_URL, payload, {
      headers: {
        ...getMoyasarAuthHeader(),
        "Content-Type": "application/json"
      }
    });

    const moyasarData = response.data;

    payment.reference = moyasarData.id || payment.reference;
    payment.providerResponse = moyasarData;

    if (moyasarData.status === "paid") {
      payment.status = "paid";
      payment.paidAt = new Date();

      const order = await Order.findById(payment.order);
      if (order) {
        order.paymentStatus = "paid";
        order.paymentReference = payment.reference;
        order.paymentProvider = "moyasar";
        order.isPaid = true;
        order.paidAt = payment.paidAt;
        await order.save();
      }
    }

    await payment.save();

    return res.json({
      success: true,
      message: "Moyasar payment created",
      payment,
      gatewayResponse: moyasarData
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
      order.paymentStatus = payment.status;
      order.paymentReference = payment.reference || order.paymentReference || "";
      order.paymentProvider = payment.provider || order.paymentProvider || "";
      order.isPaid = payment.status === "paid";
      order.paidAt = payment.status === "paid" ? payment.paidAt : undefined;
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

module.exports = {
  getPaymentById,
  getPaymentByOrderId,
  createPayment,
  createMoyasarPayment,
  updatePaymentStatus
};