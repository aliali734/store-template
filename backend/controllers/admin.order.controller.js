const Order = require("../models/order");
const mongoose = require("mongoose");

// ============================
// GET ALL ORDERS
// ============================

exports.getAllOrders = async (req, res) => {
  try {

    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      orders
    });

  } catch (err) {

    console.error("Get orders error:", err);

    res.status(500).json({
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

    res.json({
      success: true,
      order
    });

  } catch (err) {

    console.error("Get order error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to fetch order"
    });

  }

};