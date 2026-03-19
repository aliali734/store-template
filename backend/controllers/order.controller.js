const mongoose = require("mongoose");
const Order = require("../models/order");
const Product = require("../models/product");

// ============================
// HELPER
// ============================
const getUserId = (req) => req.user?._id || req.user?.id;

// ============================
// CREATE ORDER
// ============================
exports.createOrder = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const { products } = req.body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No order items"
      });
    }

    for (const item of products) {
      if (!item?.product) {
        return res.status(400).json({
          success: false,
          message: "Each item must have a product id"
        });
      }

      if (!item?.quantity || Number(item.quantity) < 1) {
        return res.status(400).json({
          success: false,
          message: "Invalid quantity"
        });
      }
    }

    const uniqueProductIds = [...new Set(products.map((i) => i.product))];
    const dbProducts = await Product.find({ _id: { $in: uniqueProductIds } });

    const productMap = new Map(dbProducts.map((p) => [p._id.toString(), p]));

    for (const pid of uniqueProductIds) {
      if (!productMap.has(pid.toString())) {
        return res.status(404).json({
          success: false,
          message: "One or more products not found"
        });
      }
    }

    let totalPrice = 0;
    const items = [];

    for (const item of products) {
      const product = productMap.get(item.product.toString());
      const qty = Number(item.quantity);

      const itemTotal = Number(product.price) * qty;
      totalPrice += itemTotal;

      items.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: qty
      });
    }

    const order = await Order.create({
      user: userId,
      products: items,
      totalPrice,
      paymentMethod: "cash",
      status: "pending"
    });

    return res.status(201).json({
      success: true,
      order
    });
  } catch (error) {
    console.error("Create order error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create order"
    });
  }
};

// ============================
// GET MY ORDERS
// ============================
exports.getMyOrders = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error("Get my orders error:", error);

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
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID"
      });
    }

    const order = await Order.findById(id)
      .populate("user", "name email");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    const isOwner = order.user?._id
      ? order.user._id.toString() === userId.toString()
      : order.user.toString() === userId.toString();

    const isAdmin = req.user?.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized"
      });
    }

    return res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error("Get order by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch order"
    });
  }
};

// ============================
// UPDATE ORDER
// ============================
exports.updateOrder = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID"
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (order.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized"
      });
    }

    if (order.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Order cannot be modified now"
      });
    }

    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Nothing to update"
      });
    }

    if (status !== "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Only cancellation is allowed"
      });
    }

    order.status = "cancelled";
    await order.save();

    return res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error("Update order error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update order"
    });
  }
};

// ============================
// DELETE ORDER
// ============================
exports.deleteOrder = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID"
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (order.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized"
      });
    }

    if (order.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Order cannot be deleted now"
      });
    }

    await order.deleteOne();

    return res.json({
      success: true,
      message: "Order deleted"
    });
  } catch (error) {
    console.error("Delete order error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete order"
    });
  }
};

// ============================
// GET ALL ORDERS (ADMIN)
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
  } catch (error) {
    console.error("Get all orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders"
    });
  }
};

// ============================
// UPDATE ORDER STATUS (ADMIN)
// ============================
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    const allowedStatuses = [
      "pending",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled"
    ];

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID"
      });
    }

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value"
      });
    }

    const order = await Order.findById(id).populate("user", "name email");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (order.status === "delivered" || order.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: `Order is already ${order.status} and cannot be changed`
      });
    }

    order.status = status;

    if (status === "delivered") {
      order.isPaid = true;
      order.paidAt = new Date();
    }

    if (status === "cancelled") {
      order.isPaid = false;
      order.paidAt = undefined;
    }

    await order.save();

    return res.json({
      success: true,
      message: "Order status updated successfully",
      order
    });
  } catch (error) {
    console.error("Update order status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update order status"
    });
  }
};