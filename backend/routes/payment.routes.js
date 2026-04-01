const express = require("express");
const router = express.Router();

const protect = require("../middlewares/auth.middleware");
const { verifyCsrf } = require("../middlewares/csrf.middleware");

const {
  getPaymentById,
  getPaymentByOrderId,
  createPayment,
  createMoyasarPayment,
  updatePaymentStatus
} = require("../controllers/payment.controllers");

// Create payment record
router.post("/", protect(), verifyCsrf, createPayment);

// Create Moyasar payment
router.post("/moyasar", protect(), verifyCsrf, createMoyasarPayment);

// Get payment by ID
router.get("/:id", protect(), getPaymentById);

// Get payment by order ID
router.get("/order/:orderId", protect(), getPaymentByOrderId);

// Update payment status
router.patch("/:id/status", protect(["admin"]), verifyCsrf, updatePaymentStatus);

module.exports = router;