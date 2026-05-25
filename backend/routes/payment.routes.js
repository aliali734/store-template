const express = require("express");
const router = express.Router();

const protect = require("../middlewares/auth.middleware");
const { verifyCsrf } = require("../middlewares/csrf.middleware");

const {
  getPaymentById,
  getPaymentByOrderId,
  createPayment,
  createStripeCheckoutSession,
  updatePaymentStatus
} = require("../controllers/payment.controllers");

// Create payment record
router.post("/", protect(), verifyCsrf, createPayment);

// Stripe routes
router.post("/stripe/create-session", protect(), verifyCsrf, createStripeCheckoutSession);

// Get payment by order ID — must be declared BEFORE /:id to avoid
// Express matching "order" as the :id param.
router.get("/order/:orderId", protect(), getPaymentByOrderId);

// Get payment by ID
router.get("/:id", protect(), getPaymentById);

// Update payment status (admin)
router.patch("/:id/status", protect(["admin"]), verifyCsrf, updatePaymentStatus);

module.exports = router;