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
    }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.StoreSettings ||
  mongoose.model("StoreSettings", storeSettingsSchema);