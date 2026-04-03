const express = require("express");
const router = express.Router();

const protect = require("../middlewares/auth.middleware");
const { verifyCsrf } = require("../middlewares/csrf.middleware");

const {
  getPaymentById,
  getPaymentByOrderId,
  createPayment,
  createMoyasarPayment,
  handleMoyasarReturn,
  handleMoyasarWebhook,
  createStripeCheckoutSession,
  handleStripeWebhook,
  updatePaymentStatus
} = require("../controllers/payment.controllers");

// Create payment record
router.post("/", protect(), verifyCsrf, createPayment);

// Moyasar routes
router.post("/moyasar", protect(), verifyCsrf, createMoyasarPayment);
router.get("/moyasar/return", handleMoyasarReturn);
router.post("/moyasar/webhook", express.json(), handleMoyasarWebhook);

// Stripe routes
router.post("/stripe/create-session", protect(), verifyCsrf, createStripeCheckoutSession);
router.post(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

// Get payment by ID
router.get("/:id", protect(), getPaymentById);

// Get payment by order ID
router.get("/order/:orderId", protect(), getPaymentByOrderId);

// Update payment status
router.patch("/:id/status", protect(["admin"]), verifyCsrf, updatePaymentStatus);

module.exports = router;