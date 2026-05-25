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

// First-run setup (no auth) OR admin update (auth required).
// Uses the explicit isConfigured flag on the document — not a store name
// comparison — so admins who name their store "Clothing Store" don't
// accidentally re-open the unauthenticated write endpoint.
router.put("/", verifyCsrf, async (req, res, next) => {
  try {
    const settings = await StoreSettings.findOne();
    const isConfigured = !!(settings && settings.isConfigured);

    if (!isConfigured) {
      // First run: allow unauthenticated write, then mark as configured.
      return next();
    }

    // Already configured: require admin auth for all future updates.
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