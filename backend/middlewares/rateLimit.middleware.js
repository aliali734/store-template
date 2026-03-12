const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10, // 10 attempts per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Try again later." }
});

const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 reset requests per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many reset requests. Try again later." }
});

const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many reset attempts. Try again later." }
});

module.exports = { loginLimiter, forgotLimiter, resetLimiter };