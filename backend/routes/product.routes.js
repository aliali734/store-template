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

// Get all products
router.get("/", getProducts);

// Get product by slug (SEO URL)
router.get("/slug/:slug", getProductBySlug);

// Get product by ID
router.get("/:id", getProductById);

/* ================= ADMIN ROUTES ================= */

// Create product
router.post(
  "/",
  protect(["admin"]),
  upload.array("images", 5),
  createProduct
);

// Update product
router.put(
  "/:id",
  protect(["admin"]),
  upload.array("images", 5),
  updateProduct
);

// Delete product
router.delete(
  "/:id",
  protect(["admin"]),
  deleteProduct
);

module.exports = router;