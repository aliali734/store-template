const express     = require("express");
const router      = express.Router();
const path        = require("path");
const fs          = require("fs");
const uploadModel = require("../middlewares/upload.model.middleware");

// ── IMPORTANT ──────────────────────────────────────────────────────────────
// Replace the two lines below with your actual auth middleware require path
// and exported function names once you share your auth middleware file.
// Examples:
//   const { protect }      = require("../middlewares/auth.middleware");
//   const { requireAdmin } = require("../middlewares/admin.middleware");
// ──────────────────────────────────────────────────────────────────────────
const { protect }      = require("../middlewares/auth.middleware");
const { requireAdmin } = require("../middlewares/admin.middleware");

// ── Paths ──────────────────────────────────────────────────────────────────
const MODEL_DIR  = path.join(__dirname, "../public/models");
const MODEL_PATH = path.join(MODEL_DIR, "hero.glb");
const MODEL_URL  = "/models/hero.glb";

// Safety net — ensure folder exists when route file is first loaded
if (!fs.existsSync(MODEL_DIR)) {
  fs.mkdirSync(MODEL_DIR, { recursive: true });
}

// ── GET /api/model ─────────────────────────────────────────────────────────
// Public — the homepage calls this to check if a model exists
router.get("/", (req, res) => {
  if (!fs.existsSync(MODEL_PATH)) {
    return res.status(404).json({
      success: false,
      message: "No model uploaded yet."
    });
  }

  res.json({
    success:  true,
    modelUrl: MODEL_URL
  });
});

// ── PUT /api/model ─────────────────────────────────────────────────────────
// Admin only — upload or replace the hero GLB file
router.put(
  "/",
  protect,
  requireAdmin,
  (req, res, next) => {
    // Run multer manually so we can catch its errors (wrong type / too large)
    // and return them as clean JSON instead of crashing the request
    uploadModel.single("model")(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || "File upload error."
        });
      }
      next();
    });
  },
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file received. Please select a .glb or .gltf file."
        });
      }

      // Write the in-memory buffer to disk, replacing any existing model
      fs.writeFileSync(MODEL_PATH, req.file.buffer);

      res.json({
        success:  true,
        modelUrl: MODEL_URL
      });
    } catch (err) {
      console.error("Model save error:", err);
      res.status(500).json({
        success: false,
        message: "Failed to save model file."
      });
    }
  }
);

// ── DELETE /api/model ──────────────────────────────────────────────────────
// Admin only — remove the current hero model
router.delete("/", protect, requireAdmin, (req, res) => {
  try {
    if (!fs.existsSync(MODEL_PATH)) {
      return res.status(404).json({
        success: false,
        message: "No model file found to delete."
      });
    }

    fs.unlinkSync(MODEL_PATH);

    res.json({
      success: true,
      message: "Model removed successfully."
    });
  } catch (err) {
    console.error("Model delete error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete model file."
    });
  }
});

module.exports = router;