const express = require("express");
const router = express.Router();

const protect = require("../middlewares/auth.middleware");
const { verifyCsrf } = require("../middlewares/csrf.middleware");

const {
  getPaymentById,
  getPaymentByOrderId,
  createPayment,
  updatePaymentStatus
} = require("../controllers/payment");

// Create payment record (user)
router.post("/", protect(), verifyCsrf, createPayment);

// Get payment by ID (user/admin)
router.get("/:id", protect(), getPaymentById);

// Get payment by order ID (user/admin)
router.get("/order/:orderId", protect(), getPaymentByOrderId);

// Update payment status (admin for now)
router.patch("/:id/status", protect(["admin"]), verifyCsrf, updatePaymentStatus);

module.exports = router;