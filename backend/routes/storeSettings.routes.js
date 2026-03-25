const express = require("express");
const router = express.Router();

const protect = require("../middlewares/auth.middleware");
const { verifyCsrf } = require("../middlewares/csrf.middleware");

const {
  getStoreSettings,
  updateStoreSettings
} = require("../controllers/storeSettings.controller");

// Public read
router.get("/", getStoreSettings);

// Admin update
router.put("/", protect(["admin"]), verifyCsrf, updateStoreSettings);

module.exports = router;