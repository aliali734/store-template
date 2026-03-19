const express = require("express");
const router = express.Router();

const { sendEmail } = require("../config/email");

router.get("/", async (req, res) => {
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
    return res.status(500).json({
      success: false,
      message: "Email failed",
      error: err.message
    });
  }
});

module.exports = router;