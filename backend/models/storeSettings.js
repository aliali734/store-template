const mongoose = require("mongoose");

const socialLinksSchema = new mongoose.Schema(
  {
    facebook:  { type: String, default: "", trim: true },
    instagram: { type: String, default: "", trim: true },
    tiktok:    { type: String, default: "", trim: true },
    twitter:   { type: String, default: "", trim: true },
    whatsapp:  { type: String, default: "", trim: true }
  },
  { _id: false }
);

const homepageSchema = new mongoose.Schema(
  {
    heroTitle:        { type: String, default: "Discover Your Next Favorite Style", trim: true },
    heroSubtitle:     { type: String, default: "Shop fashion for men, women, and kids in one place.", trim: true },
    supportHeadline:  { type: String, default: "We're Here to Help", trim: true },
    supportText:      { type: String, default: "If you have questions, feel free to contact our support team.", trim: true },
    supportEmail:     { type: String, default: "", trim: true, lowercase: true },
    supportInstagram: { type: String, default: "", trim: true },
    supportTwitter:   { type: String, default: "", trim: true }
  },
  { _id: false }
);

// SMTP settings — stored in DB so the client fills them via the
// setup wizard instead of touching Render environment variables.
const smtpSchema = new mongoose.Schema(
  {
    host: { type: String, default: "smtp.gmail.com", trim: true },
    port: { type: Number, default: 587 },
    user: { type: String, default: "", trim: true },
    // NOTE: stored as plain text — acceptable for a single-tenant store
    // run by the owner. For multi-tenant SaaS, encrypt at rest.
    pass: { type: String, default: "", trim: true },
    from: { type: String, default: "", trim: true }
  },
  { _id: false }
);

// Cloudinary credentials — stored in DB for the same reason.
const cloudinarySchema = new mongoose.Schema(
  {
    cloudName: { type: String, default: "", trim: true },
    apiKey:    { type: String, default: "", trim: true },
    apiSecret: { type: String, default: "", trim: true }
  },
  { _id: false }
);

const storeSettingsSchema = new mongoose.Schema(
  {
    storeName:    { type: String, default: "Clothing Store", trim: true },
    supportEmail: { type: String, default: "", trim: true, lowercase: true },
    phone:        { type: String, default: "", trim: true },
    address:      { type: String, default: "", trim: true },
    currency:     { type: String, default: "USD", trim: true, uppercase: true },
    footerText:   { type: String, default: "", trim: true },

    socialLinks: { type: socialLinksSchema,  default: () => ({}) },
    homepage:    { type: homepageSchema,     default: () => ({}) },
    smtp:        { type: smtpSchema,         default: () => ({}) },
    cloudinary:  { type: cloudinarySchema,   default: () => ({}) },

    // Cloudinary URL for the 3D GLB model shown in the homepage hero.
    heroModelUrl: { type: String, default: "", trim: true },

    // Set to true the first time the admin saves settings via the setup wizard.
    isConfigured: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.StoreSettings ||
  mongoose.model("StoreSettings", storeSettingsSchema);