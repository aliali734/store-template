const express = require("express");
const router = express.Router();

const StoreSettings = require("../models/storeSettings");

// ============================
// CHECK SETUP STATUS
// ============================
router.get("/status", async (req, res) => {
  try {
    const settings = await StoreSettings.findOne();

    const isConfigured = !!(
      settings &&
      settings.storeName &&
      settings.storeName.trim() &&
      settings.storeName.trim().toLowerCase() !== "clothing store"
    );

    return res.json({
      success: true,
      isConfigured
    });
  } catch (error) {
    console.error("Setup status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to check setup status"
    });
  }
});

module.exports = router;