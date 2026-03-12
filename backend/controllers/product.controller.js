const Product = require("../models/product");

// simple slug generator
function makeSlug(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// CREATE product (admin)
const createProduct = async (req, res) => {
  try {
    const imageUrls = req.files
      ? req.files.map((file) => `/uploads/products/${file.filename}`)
      : [];

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

    const slug = req.body.slug
      ? makeSlug(req.body.slug)
      : makeSlug(req.body.name);

    const existingSlug = await Product.findOne({ slug });
    if (existingSlug) {
      return res.status(400).json({ message: "Slug already exists" });
    }

    const product = await Product.create({
      name: req.body.name,
      slug,
      description: req.body.description || "",
      brand: req.body.brand || "",
      category: req.body.category,
      audience: req.body.audience || "unisex",
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

    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET all products with pagination, filters, and sorting
const getProducts = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 12, 100);
    const skip = (page - 1) * limit;

    const {
      search,
      category,
      audience,
      size,
      color,
      priceMin,
      priceMax,
      inStock,
      featured,
      sort
    } = req.query;

    const filter = { isActive: true };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } }
      ];
    }

    if (category) filter.category = category;
    if (audience) filter.audience = audience;
    if (size) filter.sizes = size;
    if (color) filter.colors = color;

    if (priceMin || priceMax) {
      filter.price = {};
      if (priceMin) filter.price.$gte = Number(priceMin);
      if (priceMax) filter.price.$lte = Number(priceMax);
    }

    if (inStock === "true") {
      filter.stock = { $gt: 0 };
    }

    if (featured === "true") {
      filter.featured = true;
    }

    let sortOption = { createdAt: -1 };

    switch (sort) {
      case "price_asc":
        sortOption = { price: 1 };
        break;
      case "price_desc":
        sortOption = { price: -1 };
        break;
      case "oldest":
        sortOption = { createdAt: 1 };
        break;
      case "newest":
        sortOption = { createdAt: -1 };
        break;
      case "name_asc":
        sortOption = { name: 1 };
        break;
      case "name_desc":
        sortOption = { name: -1 };
        break;
    }

    const total = await Product.countDocuments(filter);

    const products = await Product.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      page,
      totalPages: Math.ceil(total / limit),
      totalProducts: total,
      products
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET single product by slug
const getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({
      slug: req.params.slug,
      isActive: true
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET single product by ID
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE product (admin)
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (req.body.name !== undefined) product.name = req.body.name;
    if (req.body.description !== undefined) product.description = req.body.description;
    if (req.body.brand !== undefined) product.brand = req.body.brand;
    if (req.body.category !== undefined) product.category = req.body.category;
    if (req.body.audience !== undefined) product.audience = req.body.audience;
    if (req.body.price !== undefined) product.price = Number(req.body.price);
    if (req.body.compareAtPrice !== undefined) {
      product.compareAtPrice = Number(req.body.compareAtPrice);
    }
    if (req.body.stock !== undefined) product.stock = Number(req.body.stock);

    if (req.body.slug) {
      const newSlug = makeSlug(req.body.slug);
      const existingSlug = await Product.findOne({
        slug: newSlug,
        _id: { $ne: product._id }
      });

      if (existingSlug) {
        return res.status(400).json({ message: "Slug already exists" });
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
      product.images = req.files.map(
        (file) => `/uploads/products/${file.filename}`
      );
    }

    await product.save();
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE product (admin)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductBySlug,
  getProductById,
  updateProduct,
  deleteProduct
};