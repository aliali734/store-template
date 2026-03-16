const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const crypto = require("crypto");
const { sendEmail } = require("../config/email");
const { isValidEmail, passwordPolicy } = require("../utils/validators");

// ============================
// COOKIE CONFIG
// ============================

function tokenCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    sameSite: isProd ? "none" : "lax", // cross-site for production
    secure: isProd,                    // required for SameSite=None
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  };
}

// ============================
// REGISTER
// ============================

exports.register = async (req, res) => {
  try {
    let { name, email, password } = req.body;

    name = (name || "").trim();
    email = (email || "").trim().toLowerCase();
    password = (password || "").trim();

    if (!name || name.length < 2 || name.length > 40) {
      return res.status(400).json({ message: "Name must be 2-40 characters" });
    }

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (!passwordPolicy(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, number, and special character"
      });
    }

    const exists = await User.findOne({ email });

    if (exists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hash = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hash
    });

    res.status(201).json({
      success: true,
      message: "Registered successfully"
    });

  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Register failed" });
  }
};

// ============================
// LOGIN
// ============================

exports.login = async (req, res) => {
  try {

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET missing");
      return res.status(500).json({ message: "Server configuration error" });
    }

    let { email, password } = req.body;

    email = (email || "").trim().toLowerCase();
    password = (password || "").trim();

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials"
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({
        message: "Invalid credentials"
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, tokenCookieOptions());

    res.json({
      success: true,
      message: "Logged in"
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed" });
  }
};

// ============================
// FORGOT PASSWORD
// ============================

exports.forgotPassword = async (req, res) => {
  try {

    let { email } = req.body;
    email = (email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        success: true,
        message: "If that email exists, we sent a reset link."
      });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);

    await user.save();

    const resetLink =
      `${process.env.FRONTEND_URL}/reset-password.html?token=${rawToken}&email=${encodeURIComponent(email)}`;

    await sendEmail({
      to: email,
      subject: "Reset your password",
      html: `
        <h3>Password Reset</h3>
        <p>Click the link below to reset your password (valid for 15 minutes):</p>
        <p><a href="${resetLink}">Reset Password</a></p>
        <p>If you didn’t request this, ignore this email.</p>
      `
    });

    res.json({
      success: true,
      message: "If that email exists, we sent a reset link."
    });

  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Forgot password failed" });
  }
};

// ============================
// RESET PASSWORD
// ============================

exports.resetPassword = async (req, res) => {
  try {

    let { token, email, newPassword } = req.body;

    token = (token || "").trim();
    email = (email || "").trim().toLowerCase();
    newPassword = (newPassword || "").trim();

    if (!token || !email || !newPassword) {
      return res.status(400).json({
        message: "token, email, newPassword are required"
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: "Invalid email format"
      });
    }

    if (!passwordPolicy(newPassword)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, number, and special character"
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      email,
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired reset token"
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({
      success: true,
      message: "Password reset successful"
    });

  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Reset password failed" });
  }
};

// ============================
// LOGOUT
// ============================

exports.logout = (req, res) => {

  res.clearCookie("token", tokenCookieOptions());

  res.json({
    success: true,
    message: "Logged out"
  });

};