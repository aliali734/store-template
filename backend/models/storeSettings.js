const mongoose = require("mongoose");

const socialLinksSchema = new mongoose.Schema(
  {
    facebook: { type: String, default: "", trim: true },
    instagram: { type: String, default: "", trim: true },
    tiktok: { type: String, default: "", trim: true },
    twitter: { type: String, default: "", trim: true },
    whatsapp: { type: String, default: "", trim: true }
  },
  { _id: false }
);

const homepageSchema = new mongoose.Schema(
  {
    heroTitle: {
      type: String,
      default: "Discover Your Next Favorite Style",
      trim: true
    },
    heroSubtitle: {
      type: String,
      default:
        "Shop fashion for men, women, and kids in one place. Explore modern clothing, stylish shoes, and everyday accessories designed for comfort, confidence, and style.",
      trim: true
    },
    supportHeadline: {
      type: String,
      default: "We’re Here to Help",
      trim: true
    },
    supportText: {
      type: String,
      default:
        "If you have questions about products, orders, or your shopping experience, feel free to contact our support team.",
      trim: true
    },
    supportEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true
    },
    supportInstagram: {
      type: String,
      default: "",
      trim: true
    },
    supportTwitter: {
      type: String,
      default: "",
      trim: true
    }
  },
  { _id: false }
);

const storeSettingsSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      default: "Clothing Store",
      trim: true
    },

    supportEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true
    },

    phone: {
      type: String,
      default: "",
      trim: true
    },

    address: {
      type: String,
      default: "",
      trim: true
    },

    currency: {
      type: String,
      default: "USD",
      trim: true,
      uppercase: true
    },

    footerText: {
      type: String,
      default: "",
      trim: true
    },

    socialLinks: {
      type: socialLinksSchema,
      default: () => ({})
    },

    homepage: {
      type: homepageSchema,
      default: () => ({})
    }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.StoreSettings ||
  mongoose.model("StoreSettings", storeSettingsSchema);