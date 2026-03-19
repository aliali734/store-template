const express = require("express");
const router = express.Router();

const protect = require("../middlewares/auth.middleware");

router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend structure is working 🚀"
  });
});

router.get("/user", protect(), (req, res) => {
  res.status(200).json({
    success: true,
    userId: req.user.id,
    role: req.user.role
  });
});

router.get("/admin", protect(["admin"]), (req, res) => {
  res.status(200).json({
    success: true,
    message: "Admin authorized",
    userId: req.user.id,
    role: req.user.role
  });
});

module.exports = router;