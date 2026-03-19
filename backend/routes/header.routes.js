const express = require("express");
const router = express.Router();

const { getHeader, updateHeader } = require("../controllers/header.controller");
const protect = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");

// Public route
router.get("/", getHeader);

// Admin route
router.put("/", protect(["admin"]), upload.single("logo"), updateHeader);

module.exports = router;