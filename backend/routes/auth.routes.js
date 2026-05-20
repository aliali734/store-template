const express = require("express");
const router  = express.Router();

const {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword
} = require("../controllers/auth.controller");

const {
  registerLimiter,
  loginLimiter,
  forgotLimiter,
  resetLimiter
} = require("../middlewares/rateLimit.middleware");

const { verifyCsrf } = require("../middlewares/csrf.middleware");
const protect         = require("../middlewares/auth.middleware");

// ============================
// SESSION CHECK
// Lightweight endpoint used by frontend pages to verify that the JWT
// cookie is valid and read the user's role. Always mounted — not gated
// behind NODE_ENV — so it works in production unlike /api/test/user.
// ============================
router.get("/me", protect(), (req, res) => {
  return res.json({
    success: true,
    userId:  req.user.id,
    role:    req.user.role
  });
});

// ============================
// AUTH ROUTES
// ============================
router.post("/register",        registerLimiter, verifyCsrf, register);
router.post("/login",           loginLimiter,    verifyCsrf, login);
router.post("/logout",                           verifyCsrf, logout);
router.post("/forgot-password", forgotLimiter,   verifyCsrf, forgotPassword);
router.post("/reset-password",  resetLimiter,    verifyCsrf, resetPassword);

module.exports = router;