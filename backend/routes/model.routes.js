const express       = require("express");
const router        = express.Router();
const streamifier   = require("streamifier");
const cloudinary    = require("../config/cloudinary");
const StoreSettings = require("../models/storeSettings");
const protect       = require("../middlewares/auth.middleware");
const uploadModel   = require("../middlewares/upload.model.middleware");

// ── Admin guard ────────────────────────────────────────────────────────────
function requireAdmin(req, res, next) {
  if (req.user?.role === "admin") return next();
  return res.status(403).json({ success: false, message: "Access denied." });
}

// ── Cloudinary GLB uploader ────────────────────────────────────────────────
// resource_type: "raw" is required for non-image files (GLB/GLTF).
// Cloudinary serves raw files with Access-Control-Allow-Origin: * so
// Three.js can fetch them cross-origin from any frontend domain.
function uploadGlbToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder:          "store-template/models",
        resource_type:   "raw",
        use_filename:    true,
        unique_filename: true
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

// ── GET /api/model ─────────────────────────────────────────────────────────
// Public — no auth needed; the homepage hero fetches this for every visitor.
router.get("/", async (req, res) => {
  try {
    const settings = await StoreSettings.findOne();
    const modelUrl = settings?.heroModelUrl?.trim();

    if (!modelUrl) {
      return res.status(404).json({
        success: false,
        message: "No 3D model uploaded yet."
      });
    }

    return res.json({ success: true, modelUrl });
  } catch (err) {
    console.error("Get model error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch model info."
    });
  }
});

// ── PUT /api/model ─────────────────────────────────────────────────────────
// Admin only — upload or replace the hero GLB. Stored on Cloudinary so
// the URL persists across Render restarts (unlike the local filesystem).
router.put(
  "/",
  protect(),
  requireAdmin,
  // Run Multer manually so file-type / size errors return clean JSON.
  (req, res, next) => {
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
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file received. Please select a .glb or .gltf file."
        });
      }

      // Upload buffer to Cloudinary
      const result = await uploadGlbToCloudinary(req.file.buffer);

      // Persist the public URL in MongoDB so it survives server restarts
      let settings = await StoreSettings.findOne();
      if (!settings) settings = new StoreSettings();
      settings.heroModelUrl = result.secure_url;
      await settings.save();

      return res.json({ success: true, modelUrl: result.secure_url });
    } catch (err) {
      console.error("Model upload error:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to upload model to Cloudinary."
      });
    }
  }
);

// ── DELETE /api/model ──────────────────────────────────────────────────────
// Admin only — clears the stored URL. The Cloudinary asset is kept
// in case it needs to be restored; only the reference is removed here.
router.delete("/", protect(), requireAdmin, async (req, res) => {
  try {
    const settings = await StoreSettings.findOne();

    if (!settings?.heroModelUrl?.trim()) {
      return res.status(404).json({
        success: false,
        message: "No model to remove."
      });
    }

    settings.heroModelUrl = "";
    await settings.save();

    return res.json({ success: true, message: "Model removed successfully." });
  } catch (err) {
    console.error("Model delete error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to remove model."
    });
  }
});

module.exports = router;