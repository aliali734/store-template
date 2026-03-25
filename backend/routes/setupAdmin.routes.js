const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();

const User = require("../models/User");
const { verifyCsrf } = require("../middlewares/csrf.middleware");
const { isValidEmail, passwordPolicy } = require("../utils/validators");

// ============================
// SETUP ADMIN STATUS
// ============================
router.get("/status", async (req, res) => {
  try {
    const adminExists = await User.exists({ role: "admin" });

    return res.json({
      success: true,
      adminExists: !!adminExists
    });
  } catch (error) {
    console.error("Setup admin status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to check admin status"
    });
  }
});

// ============================
// CREATE FIRST ADMIN
// ============================
router.post("/", verifyCsrf, async (req, res) => {
  try {
    const adminExists = await User.exists({ role: "admin" });

    if (adminExists) {
      return res.status(403).json({
        success: false,
        message: "Admin setup is already complete"
      });
    }

    let { name, email, password } = req.body;

    name = (name || "").trim();
    email = (email || "").trim().toLowerCase();
    password = (password || "").trim();

    if (!name || name.length < 2 || name.length > 60) {
      return res.status(400).json({
        success: false,
        message: "Name must be 2-60 characters"
      });
    }

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
    }

    if (!passwordPolicy(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, number, and special character"
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists"
      });
    }

    const hash = await bcrypt.hash(password, 10);

    const admin = await User.create({
      name,
      email,
      password: hash,
      role: "admin"
    });

    return res.status(201).json({
      success: true,
      message: "Admin account created successfully",
      adminId: admin._id
    });
  } catch (error) {
    console.error("Create first admin error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create admin account"
    });
  }
});

module.exports = router;