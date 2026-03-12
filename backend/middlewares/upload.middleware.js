const multer = require("multer");
const path = require("path");

// =====================
// STORAGE
// =====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "logo") {
      cb(null, "uploads/header");
    } else {
      cb(null, "uploads/products");
    }
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(null, uniqueName + path.extname(file.originalname));
  }
});

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
    cb(null, true);
  } else {
    cb(new Error("Images only"));
  }
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