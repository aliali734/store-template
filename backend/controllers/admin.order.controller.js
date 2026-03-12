const Order = require("../models/order");

exports.getAllOrders = async (req, res) => {
  const orders = await Order.find()
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  res.json({ success: true, orders });
};

exports.getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "name email");

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  res.json({ success: true, order });
};
