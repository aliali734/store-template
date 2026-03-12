// controllers/order.controller.js
const Order = require("../models/order");
const Product = require("../models/product");

/**
 * Helper: support both req.user._id and req.user.id (depending on middleware)
 */
const getUserId = (req) => req.user?._id || req.user?.id;

/**
 * CREATE ORDER (Cash on Delivery)
 * - paymentMethod forced to "cash"
 * - totalPrice calculated server-side from Product prices
 * - stores snapshot of product name/price inside the order
 */
exports.createOrder = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { products } = req.body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: "No order items" });
    }

    // Validate items (must include product + quantity)
    for (const item of products) {
      if (!item?.product) {
        return res.status(400).json({ message: "Each item must have a product id" });
      }
      if (!item?.quantity || Number(item.quantity) < 1) {
        return res.status(400).json({ message: "Invalid quantity" });
      }
    }

    // Fetch unique product IDs in one query (handles duplicates)
    const uniqueProductIds = [...new Set(products.map((i) => i.product))];
    const dbProducts = await Product.find({ _id: { $in: uniqueProductIds } });

    // Map for O(1) lookup
    const productMap = new Map(dbProducts.map((p) => [p._id.toString(), p]));

    // Ensure every product exists
    for (const pid of uniqueProductIds) {
      if (!productMap.has(pid.toString())) {
        return res.status(404).json({ message: "One or more products not found" });
      }
    }

    // Build items + calculate total
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

    return res.status(201).json({ success: true, order });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create order",
      error: error.message
    });
  }
};

/**
 * GET MY ORDERS (User)
 * GET /api/orders/my
 */
exports.getMyOrders = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
    return res.json({ success: true, orders });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * GET ORDER BY ID (User)
 * GET /api/orders/:id
 * - Owner-only (or admin can see it)
 */
exports.getOrderById = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const order = await Order.findById(req.params.id).populate("user", "name email");
    if (!order) return res.status(404).json({ message: "Order not found" });

    const isOwner = order.user?._id
      ? order.user._id.toString() === userId.toString()
      : order.user.toString() === userId.toString();

    const isAdmin = req.user?.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized" });
    }

    return res.json({ success: true, order });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * UPDATE ORDER (User)
 * For COD: allow only cancellation while pending.
 * - Owner-only
 * - Only allowed change: status -> "cancelled"
 */
exports.updateOrder = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (order.status !== "pending") {
      return res.status(400).json({ message: "Order cannot be modified now" });
    }

    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    if (status !== "cancelled") {
      return res.status(400).json({ message: "Only cancellation is allowed" });
    }

    order.status = "cancelled";
    await order.save();

    return res.json({ success: true, order });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * DELETE ORDER (User)
 * - Owner-only
 * - Allow delete only while pending
 */
exports.deleteOrder = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (order.status !== "pending") {
      return res.status(400).json({ message: "Order cannot be deleted now" });
    }

    await order.deleteOne();
    return res.json({ success: true, message: "Order deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * GET ALL ORDERS (Admin)
 * (Used by admin dashboard)
 */
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    return res.json({ success: true, orders });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * UPDATE ORDER STATUS (Admin)
 * PATCH /api/orders/admin/:id/status
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "pending",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled"
    ];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const order = await Order.findById(req.params.id).populate("user", "name email");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Optional: block changes after delivered/cancelled
    if (order.status === "delivered" || order.status === "cancelled") {
      return res.status(400).json({
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
    return res.status(500).json({ message: error.message });
  }
};