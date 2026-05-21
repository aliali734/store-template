const multer = require("multer");
const path   = require("path");

// ── Memory storage ─────────────────────────────────────────────────────────
// Files are held as Buffer objects in req.file.buffer / req.files[].buffer
// and piped directly to Cloudinary — never written to disk.
const storage = multer.memoryStorage();

// ── File filter ────────────────────────────────────────────────────────────
// Allows only web-safe image formats. Checks BOTH the file extension AND
// the MIME type so a renamed non-image file cannot slip through.
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;

  const ext  = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mime = allowedTypes.test(file.mimetype);

  if (ext && mime) {
    return cb(null, true);
  }

  return cb(new Error("Only image files are allowed (jpeg, jpg, png, webp)."));
};

// ── Multer instance ────────────────────────────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2 MB per image
  }
});

module.exports = upload;