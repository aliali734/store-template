const express = require("express");
const router = express.Router();

const StoreSettings = require("../models/storeSettings");

// ============================
// CHECK SETUP STATUS
// ============================
router.get("/status", async (req, res) => {
  try {
    const settings = await StoreSettings.findOne();

    // Use the explicit isConfigured flag. Previously this inferred setup
    // state from the store name, which broke when the admin legitimately
    // named their store "Clothing Store".
    const isConfigured = !!(settings && settings.isConfigured);

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