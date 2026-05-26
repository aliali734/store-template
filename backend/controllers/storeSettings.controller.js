const StoreSettings = require("../models/storeSettings");
const { resetCloudinaryCache } = require("../config/cloudinary");

// ============================
// DEFAULT SETTINGS
// ============================
const defaultSettings = {
  storeName: "Clothing Store",
  supportEmail: "",
  phone: "",
  address: "",
  currency: "USD",
  footerText: "",
  socialLinks: { facebook: "", instagram: "", tiktok: "", twitter: "", whatsapp: "" },
  homepage: {
    heroTitle: "Discover Your Next Favorite Style",
    heroSubtitle:
      "Shop fashion for men, women, and kids in one place. Explore modern clothing, stylish shoes, and everyday accessories designed for comfort, confidence, and style.",
    supportHeadline: "We're Here to Help",
    supportText:
      "If you have questions about products, orders, or your shopping experience, feel free to contact our support team.",
    supportEmail: "",
    supportInstagram: "",
    supportTwitter: ""
  },
  smtp: {
    host: "smtp.gmail.com",
    port: 587,
    user: "",
    pass: "",
    from: ""
  },
  cloudinary: {
    cloudName: "",
    apiKey: "",
    apiSecret: ""
  }
};

// ============================
// GET SETTINGS
// ============================
const getStoreSettings = async (req, res) => {
  try {
    let settings = await StoreSettings.findOne();

    if (!settings) {
      settings = await StoreSettings.create(defaultSettings);
    }

    // Never expose cloudinary apiSecret or smtp pass to the public.
    // The GET endpoint is public (used by the frontend to load store UI),
    // so we strip sensitive fields before sending.
    const safe = settings.toObject();
    if (safe.smtp) {
      safe.smtp = {
        host: safe.smtp.host,
        port: safe.smtp.port,
        user: safe.smtp.user,
        from: safe.smtp.from
        // pass intentionally omitted
      };
    }
    if (safe.cloudinary) {
      safe.cloudinary = {
        cloudName: safe.cloudinary.cloudName
        // apiKey and apiSecret intentionally omitted
      };
    }

    return res.json({ success: true, settings: safe });
  } catch (error) {
    console.error("Get store settings error:", error);
    return res.status(500).json({ success: false, message: "Failed to load store settings" });
  }
};

// ============================
// GET SETTINGS FOR ADMIN
// Returns the full document including sensitive fields.
// This route must be protected with protect(["admin"]).
// ============================
const getStoreSettingsAdmin = async (req, res) => {
  try {
    let settings = await StoreSettings.findOne();
    if (!settings) {
      settings = await StoreSettings.create(defaultSettings);
    }
    return res.json({ success: true, settings });
  } catch (error) {
    console.error("Get admin store settings error:", error);
    return res.status(500).json({ success: false, message: "Failed to load store settings" });
  }
};

// ============================
// UPDATE SETTINGS
// ============================
const updateStoreSettings = async (req, res) => {
  try {
    let settings = await StoreSettings.findOne();
    if (!settings) {
      settings = await StoreSettings.create(defaultSettings);
    }

    const {
      // Store info
      storeName, supportEmail, phone, address, currency, footerText,
      // Social
      facebook, instagram, tiktok, twitter, whatsapp,
      // Homepage
      heroTitle, heroSubtitle, supportHeadline, supportText,
      homepageSupportEmail, supportInstagram, supportTwitter,
      // SMTP
      smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom,
      // Cloudinary
      cloudinaryCloudName, cloudinaryApiKey, cloudinaryApiSecret
    } = req.body;

    // Store info
    if (storeName     !== undefined) settings.storeName     = String(storeName).trim();
    if (supportEmail  !== undefined) settings.supportEmail  = String(supportEmail).trim().toLowerCase();
    if (phone         !== undefined) settings.phone         = String(phone).trim();
    if (address       !== undefined) settings.address       = String(address).trim();
    if (currency      !== undefined) settings.currency      = String(currency).trim().toUpperCase();
    if (footerText    !== undefined) settings.footerText    = String(footerText).trim();

    // Social links
    settings.socialLinks = {
      facebook:  facebook  !== undefined ? String(facebook).trim()  : settings.socialLinks?.facebook  || "",
      instagram: instagram !== undefined ? String(instagram).trim() : settings.socialLinks?.instagram || "",
      tiktok:    tiktok    !== undefined ? String(tiktok).trim()    : settings.socialLinks?.tiktok    || "",
      twitter:   twitter   !== undefined ? String(twitter).trim()   : settings.socialLinks?.twitter   || "",
      whatsapp:  whatsapp  !== undefined ? String(whatsapp).trim()  : settings.socialLinks?.whatsapp  || ""
    };

    // Homepage
    settings.homepage = {
      heroTitle:        heroTitle        !== undefined ? String(heroTitle).trim()        : settings.homepage?.heroTitle        || defaultSettings.homepage.heroTitle,
      heroSubtitle:     heroSubtitle     !== undefined ? String(heroSubtitle).trim()     : settings.homepage?.heroSubtitle     || defaultSettings.homepage.heroSubtitle,
      supportHeadline:  supportHeadline  !== undefined ? String(supportHeadline).trim()  : settings.homepage?.supportHeadline  || defaultSettings.homepage.supportHeadline,
      supportText:      supportText      !== undefined ? String(supportText).trim()      : settings.homepage?.supportText      || defaultSettings.homepage.supportText,
      supportEmail:     homepageSupportEmail !== undefined ? String(homepageSupportEmail).trim().toLowerCase() : settings.homepage?.supportEmail || "",
      supportInstagram: supportInstagram !== undefined ? String(supportInstagram).trim() : settings.homepage?.supportInstagram || "",
      supportTwitter:   supportTwitter   !== undefined ? String(supportTwitter).trim()   : settings.homepage?.supportTwitter   || ""
    };

    // SMTP — only update fields that were actually provided.
    // If smtpPass is empty string, keep the existing password (don't wipe it).
    settings.smtp = {
      host: smtpHost !== undefined ? String(smtpHost).trim() || "smtp.gmail.com" : settings.smtp?.host || "smtp.gmail.com",
      port: smtpPort !== undefined ? Number(smtpPort) || 587                    : settings.smtp?.port || 587,
      user: smtpUser !== undefined ? String(smtpUser).trim()                    : settings.smtp?.user || "",
      pass: (smtpPass !== undefined && smtpPass !== "")
              ? String(smtpPass).trim()
              : settings.smtp?.pass || "",
      from: smtpFrom !== undefined ? String(smtpFrom).trim() : settings.smtp?.from || ""
    };

    // Cloudinary — same pattern: don't wipe existing secret if not re-provided
    settings.cloudinary = {
      cloudName: cloudinaryCloudName !== undefined ? String(cloudinaryCloudName).trim() : settings.cloudinary?.cloudName || "",
      apiKey:    cloudinaryApiKey    !== undefined ? String(cloudinaryApiKey).trim()    : settings.cloudinary?.apiKey    || "",
      apiSecret: (cloudinaryApiSecret !== undefined && cloudinaryApiSecret !== "")
                   ? String(cloudinaryApiSecret).trim()
                   : settings.cloudinary?.apiSecret || ""
    };

    // Mark store as configured so the setup wizard locks after first save.
    settings.isConfigured = true;

    await settings.save();

    // If Cloudinary credentials changed, reset the cached config so the
    // next upload request picks up the new values.
    resetCloudinaryCache();

    return res.json({ success: true, settings });
  } catch (error) {
    console.error("Update store settings error:", error);
    return res.status(500).json({ success: false, message: "Failed to update store settings" });
  }
};

module.exports = { getStoreSettings, getStoreSettingsAdmin, updateStoreSettings };