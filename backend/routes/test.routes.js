const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

// Verify logged-in user
router.get("/user", (req, res) => {

  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    res.json({
      success: true,
      userId: decoded.userId,
      role: decoded.role
    });

  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }

});

module.exports = router;