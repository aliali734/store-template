const express = require("express");
const router = express.Router();

const protect = require("../middlewares/auth.middleware");
const { verifyCsrf } = require("../middlewares/csrf.middleware");

const {
  getPaymentById,
  getPaymentByOrderId,
  createPayment,
  createStripeCheckoutSession,
  updatePaymentStatus,
  createConnectOnboardingLink,
  getConnectStatus,
  disconnectStripe
} = require("../controllers/payment.controllers");

// Create payment record
router.post("/", protect(), verifyCsrf, createPayment);

// Stripe checkout (customer)
router.post("/stripe/create-session", protect(), verifyCsrf, createStripeCheckoutSession);

// ── Stripe Connect (admin-only) ──
// Onboarding: returns a one-time URL the admin's browser redirects to.
router.post("/connect/onboard", protect(["admin"]), verifyCsrf, createConnectOnboardingLink);

// Status check: refreshes capability flags from Stripe + returns them.
router.get("/connect/status",  protect(["admin"]),             getConnectStatus);

// Disconnect: clears the local accountId (doesn't delete the Stripe acct).
router.post("/connect/disconnect", protect(["admin"]), verifyCsrf, disconnectStripe);

// Get payment by order ID — must be declared BEFORE /:id to avoid
// Express matching "order" as the :id param.
router.get("/order/:orderId", protect(), getPaymentByOrderId);

// Get payment by ID
router.get("/:id", protect(), getPaymentById);

// Update payment status (admin)
router.patch("/:id/status", protect(["admin"]), verifyCsrf, updatePaymentStatus);

module.exports = router;