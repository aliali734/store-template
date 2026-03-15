const express = require("express");
const router = express.Router();

const {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword
} = require("../controllers/auth.controller");

const {
  loginLimiter,
  forgotLimiter,
  resetLimiter
} = require("../middlewares/rateLimit.middleware");

const { verifyCsrf } = require("../middlewares/csrf.middleware");

// ============================
// AUTH ROUTES (CSRF PROTECTED)
// ============================

// Register
router.post(
  "/register",
  verifyCsrf,
  register
);

// Login
router.post(
  "/login",
  loginLimiter,
  verifyCsrf,
  login
);

// Logout
router.post(
  "/logout",
  verifyCsrf,
  logout
);

// Forgot password
router.post(
  "/forgot-password",
  forgotLimiter,
  verifyCsrf,
  forgotPassword
);

// Reset password
router.post(
  "/reset-password",
  resetLimiter,
  verifyCsrf,
  resetPassword
);

module.exports = router;