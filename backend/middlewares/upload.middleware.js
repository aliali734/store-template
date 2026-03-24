const multer = require("multer");
const path = require("path");

// =====================
// MEMORY STORAGE
// =====================
const storage = multer.memoryStorage();

// =====================
// FILE FILTER
// =====================
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;

  const ext = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );

  const mime = allowedTypes.test(file.mimetype);

  if (ext && mime) {
    return cb(null, true);
  }

  return cb(new Error("Only image files are allowed (jpeg, jpg, png, webp)."));
};

// =====================
// MULTER CONFIG
// =====================
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024
  }
});

module.exports = upload;