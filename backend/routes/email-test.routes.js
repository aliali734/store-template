const express = require("express");
const router = express.Router();
const { sendEmail } = require("../config/email");

router.get("/", async (req, res) => {
  try {
    const to = req.query.to;
    if (!to) return res.status(400).json({ message: "Missing ?to=email" });

    await sendEmail({
      to,
      subject: "Test email ✅",
      html: "<h3>Email is working 🎉</h3><p>If you see this, Nodemailer is configured.</p>"
    });

    res.json({ success: true, message: "Email sent" });
  } catch (err) {
    res.status(500).json({ message: "Email failed", error: err.message });
  }
});

module.exports = router;