const mongoose = require("mongoose");
const Order = require("../models/order");

// ============================
// GET ALL ORDERS
// ============================
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      orders
    });
  } catch (err) {
    console.error("Get all admin orders error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders"
    });
  }
};

// ============================
// GET ORDER BY ID
// ============================
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID"
      });
    }

    const order = await Order.findById(id)
      .populate("user", "name email")
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    return res.json({
      success: true,
      order
    });
  } catch (err) {
    console.error("Get admin order by ID error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch order"
    });
  }
};