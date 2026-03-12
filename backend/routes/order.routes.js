const express = require("express");
const router = express.Router();

const protect = require("../middlewares/auth.middleware");
const { verifyCsrf } = require("../middlewares/csrf.middleware");

const {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  getAllOrders,
  updateOrderStatus
} = require("../controllers/order.controller");

// =======================
// ADMIN ROUTES (must be BEFORE "/:id")
// =======================
router.get("/admin/all", protect(["admin"]), getAllOrders);
router.patch("/admin/:id/status", verifyCsrf, protect(["admin"]), updateOrderStatus);

// =======================
// USER ROUTES
// =======================

// create order (COD)
router.post("/", verifyCsrf, protect(), createOrder);

// user orders
router.get("/my", protect(), getMyOrders);

// get single order
router.get("/:id", protect(), getOrderById);

// update order
router.put("/:id", verifyCsrf, protect(), updateOrder);

// delete order
router.delete("/:id", verifyCsrf, protect(), deleteOrder);

module.exports = router;