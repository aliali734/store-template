const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();

const { sendEmail } = require("../config/email");
const protect = require("../middlewares/auth.middleware");

// Tight rate limit: 3 test emails per 15 minutes per IP.
// This is a debug tool — there is no legitimate reason to send more than a
// handful of test emails in any short window.
const emailTestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many test email requests. Try again later."
  }
});

router.get(
  "/",
  protect(["admin"]),   // only authenticated admins may send test emails
  emailTestLimiter,     // hard cap on volume
  async (req, res) => {
    try {
      const to = (req.query.to || "").trim().toLowerCase();

      if (!to) {
        return res.status(400).json({
          success: false,
          message: "Missing ?to=email"
        });
      }

      await sendEmail({
        to,
        subject: "Test email ✅",
        html: "<h3>Email is working 🎉</h3><p>If you see this, Nodemailer is configured.</p>",
        text: "Email is working. If you see this, Nodemailer is configured."
      });

      return res.json({
        success: true,
        message: "Email sent"
      });
    } catch (err) {
      // Do not expose err.message — it may contain SMTP credentials or
      // internal server details. Log it server-side only.
      console.error("Email test error:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to send email. Check server logs for details."
      });
    }
  }
);

module.exports = router;