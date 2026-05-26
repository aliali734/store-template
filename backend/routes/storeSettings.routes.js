const express = require("express");
const router  = express.Router();

const protect = require("../middlewares/auth.middleware");
const { verifyCsrf } = require("../middlewares/csrf.middleware");
const StoreSettings = require("../models/storeSettings");

const {
  getStoreSettings,
  getStoreSettingsAdmin,
  updateStoreSettings
} = require("../controllers/storeSettings.controller");

// Public read — sensitive fields (smtp.pass, cloudinary keys) are stripped
router.get("/", getStoreSettings);

// Admin read — full document including sensitive fields
router.get("/admin", protect(["admin"]), getStoreSettingsAdmin);

// First-run setup (no auth) OR admin update (auth required).
// Uses the explicit isConfigured flag so it can't be bypassed by
// naming the store "Clothing Store".
router.put("/", verifyCsrf, async (req, res, next) => {
  try {
    const settings = await StoreSettings.findOne();
    const isConfigured = !!(settings && settings.isConfigured);

    if (!isConfigured) {
      // First run — allow unauthenticated write
      return next();
    }

    // Already configured — require admin auth
    return protect(["admin"])(req, res, next);
  } catch (error) {
    console.error("Store settings route error:", error);
    return res.status(500).json({ success: false, message: "Failed to verify setup state" });
  }
}, updateStoreSettings);

module.exports = router;