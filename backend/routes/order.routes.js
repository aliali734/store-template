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
// ADMIN ROUTES
// Must be before "/:id"
// =======================
router.get("/admin/all", protect(["admin"]), getAllOrders);
router.patch("/admin/:id/status", protect(["admin"]), verifyCsrf, updateOrderStatus);

// =======================
// USER ROUTES
// =======================
router.post("/", protect(), verifyCsrf, createOrder);
router.get("/my", protect(), getMyOrders);
router.get("/:id", protect(), getOrderById);
router.put("/:id", protect(), verifyCsrf, updateOrder);
router.delete("/:id", protect(), verifyCsrf, deleteOrder);

module.exports = router;