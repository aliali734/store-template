const express    = require("express");
const router     = express.Router();
const multer     = require("multer");
const path       = require("path");
const fs         = require("fs");
const uploadRaw  = require("../middleware/uploadRaw");

// Where the GLB will be stored on disk
const MODEL_DIR  = path.join(__dirname, "../public/models");
const MODEL_PATH = path.join(MODEL_DIR, "hero.glb");
const MODEL_URL  = "/models/hero.glb"; // served as static

// Ensure directory exists
if (!fs.existsSync(MODEL_DIR)) fs.mkdirSync(MODEL_DIR, { recursive: true });

// =====================
// GET  /api/model
// Returns the URL of the current hero model
// =====================
router.get("/", (req, res) => {
  if (!fs.existsSync(MODEL_PATH)) {
    return res.status(404).json({ success: false, message: "No model uploaded yet." });
  }
  res.json({ success: true, modelUrl: MODEL_URL });
});

// =====================
// PUT  /api/model
// Admin only — upload / replace the hero GLB
// =====================
router.put("/", requireAdmin, uploadRaw.single("model"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded." });
    }

    // Write buffer to disk, replacing any previous model
    fs.writeFileSync(MODEL_PATH, req.file.buffer);

    res.json({ success: true, modelUrl: MODEL_URL });
  } catch (err) {
    console.error("Model upload error:", err);
    res.status(500).json({ success: false, message: "Failed to save model." });
  }
});

// =====================
// DELETE  /api/model
// Admin only — remove the hero model
// =====================
router.delete("/", requireAdmin, (req, res) => {
  try {
    if (fs.existsSync(MODEL_PATH)) fs.unlinkSync(MODEL_PATH);
    res.json({ success: true, message: "Model removed." });
  } catch (err) {
    console.error("Model delete error:", err);
    res.status(500).json({ success: false, message: "Failed to delete model." });
  }
});

// =====================
// HELPER — inline admin guard
// Replace with your real auth middleware if you have one
// =====================
function requireAdmin(req, res, next) {
  if (req.session?.user?.role === "admin") return next();
  res.status(403).json({ success: false, message: "Admins only." });
}

module.exports = router;