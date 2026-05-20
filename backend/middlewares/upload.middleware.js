const multer = require("multer");
const path   = require("path");

// =====================
// MEMORY STORAGE
// =====================
const storage = multer.memoryStorage();
// =====================
// FILE FILTER
// =====================

const fileFilter = (req, file, cb) => {
  const ext      = path.extname(file.originalname).toLowerCase();
  const allowed  = [".glb", ".gltf"];

  if (allowed.includes(ext)) {
    return cb(null, true);
  }

  cb(new Error("Only .glb and .gltf files are allowed."));
};
// =====================
// MULTER CONFIG
// =====================
const uploadRaw = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB — 3D models can be large
  }
});

module.exports = uploadRaw;