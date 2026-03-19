const express = require("express");
const router = express.Router();

const {
  createProduct,
  getProducts,
  getProductById,
  getProductBySlug,
  updateProduct,
  deleteProduct
} = require("../controllers/product.controller");

const protect = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");

/* ================= PUBLIC ROUTES ================= */
router.get("/", getProducts);
router.get("/slug/:slug", getProductBySlug);
router.get("/:id", getProductById);

/* ================= ADMIN ROUTES ================= */
router.post("/", protect(["admin"]), upload.array("images", 5), createProduct);
router.put("/:id", protect(["admin"]), upload.array("images", 5), updateProduct);
router.delete("/:id", protect(["admin"]), deleteProduct);

module.exports = router;