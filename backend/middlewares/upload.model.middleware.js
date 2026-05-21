const multer = require("multer");
const path   = require("path");

const storage = multer.memoryStorage();

const allowedExtensions = [".glb", ".gltf"];
const allowedMimeTypes  = [
  "model/gltf-binary",      // .glb
  "model/gltf+json",        // .gltf
  "application/octet-stream" // fallback (some browsers send this)
];

const fileFilter = (req, file, cb) => {
  const ext  = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  if (!allowedExtensions.includes(ext)) {
    return cb(new Error("Invalid file extension. Only .glb and .gltf allowed."));
  }

  if (!allowedMimeTypes.includes(mime)) {
    return cb(new Error("Invalid file type."));
  }

  cb(null, true);
};

const uploadModel = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

module.exports = uploadModel;