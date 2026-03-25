const express = require("express");
const router = express.Router();

const protect = require("../middlewares/auth.middleware");
const { verifyCsrf } = require("../middlewares/csrf.middleware");
const StoreSettings = require("../models/storeSettings");

const {
  getStoreSettings,
  updateStoreSettings
} = require("../controllers/storeSettings.controller");

// Public read
router.get("/", getStoreSettings);

// First-run setup OR admin update
router.put("/", verifyCsrf, async (req, res, next) => {
  try {
    const settings = await StoreSettings.findOne();

    const isConfigured = !!(
      settings &&
      settings.storeName &&
      settings.storeName.trim() &&
      settings.storeName.trim().toLowerCase() !== "clothing store"
    );

    if (!isConfigured) {
      return next();
    }

    return protect(["admin"])(req, res, next);
  } catch (error) {
    console.error("Store settings route error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to verify setup state"
    });
  }
}, updateStoreSettings);

module.exports = router;