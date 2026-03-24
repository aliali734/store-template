const mongoose = require("mongoose");
const streamifier = require("streamifier");
const cloudinary = require("../config/cloudinary");
const Product = require("../models/product");
const {
  buildProductFilter,
  buildSortOption,
  buildPagination
} = require("../utils/productFilter");
const {
  CATALOG_TAXONOMY,
  normalizeCatalogValue,
  isValidDepartment,
  isValidCategoryForDepartment,
  getAllowedDepartments,
  getAllowedCategories
} = require("../utils/catalogTaxonomy");

// ============================
// SLUG GENERATOR
// ============================
function makeSlug(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ============================
// CLOUDINARY UPLOAD HELPER
// ============================
function uploadBufferToCloudinary(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
}

// ============================
// GET PRODUCT TAXONOMY
// ============================
const getProductTaxonomy = async (req, res) => {
  try {
    return res.json({
      success: true,
      taxonomy: CATALOG_TAXONOMY,
      departments: getAllowedDepartments()
    });
  } catch (error) {
    console.error("Get product taxonomy error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load product taxonomy"
    });
  }
};

// ============================
// CREATE PRODUCT
// ============================
const createProduct = async (req, res) => {
  try {
    let imageUrls = [];

    if (req.files && req.files.length > 0) {
      const uploadedImages = await Promise.all(
        req.files.map((file) =>
          uploadBufferToCloudinary(file.buffer, "store-template/products")
        )
      );

      imageUrls = uploadedImages.map((img) => img.secure_url);
    }

    const sizes = req.body.sizes
      ? req.body.sizes
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const colors = req.body.colors
      ? req.body.colors
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean)
      : [];

    const department = normalizeCatalogValue(req.body.department || "clothing");
    const category = normalizeCatalogValue(req.body.category);

    if (!isValidDepartment(department)) {
      return res.status(400).json({
        success: false,
        message: "Invalid department",
        allowedCategories: []
      });
    }

    if (!isValidCategoryForDepartment(department, category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category for department "${department}"`,
        allowedCategories: getAllowedCategories(department)
      });
    }

    const slug = req.body.slug
      ? makeSlug(req.body.slug)
      : makeSlug(req.body.name);

    const existingSlug = await Product.findOne({ slug });

    if (existingSlug) {
      return res.status(400).json({
        success: false,
        message: "Slug already exists"
      });
    }

    const product = await Product.create({
      name: req.body.name,
      slug,
      description: req.body.description || "",
      brand: req.body.brand || "",
      department,
      category,
      audience: normalizeCatalogValue(req.body.audience || "unisex"),
      price: Number(req.body.price),
      compareAtPrice: Number(req.body.compareAtPrice || 0),
      stock: Number(req.body.stock || 0),
      sizes,
      colors,
      images: imageUrls,
      featured: req.body.featured === "true" || req.body.featured === true,
      isActive:
        req.body.isActive === undefined
          ? true
          : req.body.isActive === "true" || req.body.isActive === true
    });

    return res.status(201).json({
      success: true,
      product
    });
  } catch (error) {
    console.error("Create product error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create product"
    });
  }
};

// ============================
// GET PRODUCTS
// ============================
const getProducts = async (req, res) => {
  try {
    const filter = buildProductFilter(req.query);
    const sortOption = buildSortOption(req.query.sort);
    const { page, limit, skip } = buildPagination(req.query);

    const total = await Product.countDocuments(filter);

    const products = await Product.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean();

    return res.json({
      success: true,
      page,
      totalPages: Math.ceil(total / limit),
      totalProducts: total,
      products
    });
  } catch (error) {
    console.error("Get products error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch products"
    });
  }
};

// ============================
// GET PRODUCT BY SLUG
// ============================
const getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({
      slug: req.params.slug,
      isActive: true
    }).lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    return res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error("Get product by slug error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch product"
    });
  }
};

// ============================
// GET PRODUCT BY ID
// ============================
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    const product = await Product.findById(id).lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    return res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error("Get product by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch product"
    });
  }
};

// ============================
// UPDATE PRODUCT
// ============================
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const nextDepartment =
      req.body.department !== undefined
        ? normalizeCatalogValue(req.body.department)
        : product.department;

    const nextCategory =
      req.body.category !== undefined
        ? normalizeCatalogValue(req.body.category)
        : product.category;

    if (!isValidDepartment(nextDepartment)) {
      return res.status(400).json({
        success: false,
        message: "Invalid department",
        allowedCategories: []
      });
    }

    if (!isValidCategoryForDepartment(nextDepartment, nextCategory)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category for department "${nextDepartment}"`,
        allowedCategories: getAllowedCategories(nextDepartment)
      });
    }

    if (req.body.name !== undefined) product.name = req.body.name;
    if (req.body.description !== undefined) product.description = req.body.description;
    if (req.body.brand !== undefined) product.brand = req.body.brand;
    if (req.body.department !== undefined) product.department = nextDepartment;
    if (req.body.category !== undefined) product.category = nextCategory;
    if (req.body.audience !== undefined) {
      product.audience = normalizeCatalogValue(req.body.audience);
    }
    if (req.body.price !== undefined) product.price = Number(req.body.price);

    if (req.body.compareAtPrice !== undefined) {
      product.compareAtPrice = Number(req.body.compareAtPrice);
    }

    if (req.body.stock !== undefined) {
      product.stock = Number(req.body.stock);
    }

    if (req.body.slug) {
      const newSlug = makeSlug(req.body.slug);

      const existingSlug = await Product.findOne({
        slug: newSlug,
        _id: { $ne: product._id }
      });

      if (existingSlug) {
        return res.status(400).json({
          success: false,
          message: "Slug already exists"
        });
      }

      product.slug = newSlug;
    }

    if (req.body.sizes) {
      product.sizes = req.body.sizes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    if (req.body.colors) {
      product.colors = req.body.colors
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
    }

    if (req.body.featured !== undefined) {
      product.featured =
        req.body.featured === "true" || req.body.featured === true;
    }

    if (req.body.isActive !== undefined) {
      product.isActive =
        req.body.isActive === "true" || req.body.isActive === true;
    }

    if (req.files && req.files.length > 0) {
      const uploadedImages = await Promise.all(
        req.files.map((file) =>
          uploadBufferToCloudinary(file.buffer, "store-template/products")
        )
      );

      product.images = uploadedImages.map((img) => img.secure_url);
    }

    await product.save();

    return res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error("Update product error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update product"
    });
  }
};

// ============================
// DELETE PRODUCT
// ============================
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    return res.json({
      success: true,
      message: "Product deleted successfully"
    });
  } catch (error) {
    console.error("Delete product error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete product"
    });
  }
};

module.exports = {
  getProductTaxonomy,
  createProduct,
  getProducts,
  getProductBySlug,
  getProductById,
  updateProduct,
  deleteProduct
};