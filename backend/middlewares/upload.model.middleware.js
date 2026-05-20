const multer = require("multer");
const path   = require("path");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext     = path.extname(file.originalname).toLowerCase();
  const allowed = [".glb", ".gltf"];

  if (allowed.includes(ext)) {
    return cb(null, true);
  }

  cb(new Error("Only .glb and .gltf files are allowed."));
};

const uploadModel = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024
  }
});

module.exports = uploadModel;