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
// AUTH ROUTES
// ============================
router.post("/register", verifyCsrf, register);
router.post("/login", loginLimiter, verifyCsrf, login);
router.post("/logout", verifyCsrf, logout);
router.post("/forgot-password", forgotLimiter, verifyCsrf, forgotPassword);
router.post("/reset-password", resetLimiter, verifyCsrf, resetPassword);

module.exports = router;