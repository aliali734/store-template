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

// ✅ CSRF protect all state-changing auth routes
router.post("/register", verifyCsrf, register);
router.post("/login", verifyCsrf, loginLimiter, login);
router.post("/logout", verifyCsrf, logout);
router.post("/forgot-password", verifyCsrf, forgotLimiter, forgotPassword);
router.post("/reset-password", verifyCsrf, resetLimiter, resetPassword);

module.exports = router;
