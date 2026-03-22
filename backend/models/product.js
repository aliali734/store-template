const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120
    },

    slug: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 5000
    },

    brand: {
      type: String,
      default: "",
      trim: true,
      maxlength: 60
    },

    department: {
      type: String,
      trim: true,
      lowercase: true,
      enum: ["shoes", "clothing", "accessories"],
      default: "clothing"
    },

    category: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },

    audience: {
      type: String,
      enum: ["men", "women", "kids", "unisex"],
      default: "unisex"
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    compareAtPrice: {
      type: Number,
      default: 0,
      min: 0
    },

    stock: {
      type: Number,
      default: 0,
      min: 0
    },

    sizes: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "At least one size is required"
      }
    },

    colors: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "At least one color is required"
      }
    },

    images: {
      type: [String],
      default: []
    },

    featured: {
      type: Boolean,
      default: false
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

productSchema.index({
  name: "text",
  description: "text",
  brand: "text"
});

productSchema.index({
  audience: 1,
  department: 1,
  category: 1,
  featured: 1,
  isActive: 1
});

module.exports =
  mongoose.models.Product || mongoose.model("Product", productSchema);