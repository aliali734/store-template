const StoreSettings = require("../models/storeSettings");

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
  socialLinks: {
    facebook: "",
    instagram: "",
    tiktok: "",
    twitter: "",
    whatsapp: ""
  },
  homepage: {
    heroTitle: "Discover Your Next Favorite Style",
    heroSubtitle:
      "Shop fashion for men, women, and kids in one place. Explore modern clothing, stylish shoes, and everyday accessories designed for comfort, confidence, and style.",
    supportHeadline: "We’re Here to Help",
    supportText:
      "If you have questions about products, orders, or your shopping experience, feel free to contact our support team.",
    supportEmail: "",
    supportInstagram: "",
    supportTwitter: ""
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

    return res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error("Get store settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load store settings"
    });
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
      storeName,
      supportEmail,
      phone,
      address,
      currency,
      footerText,
      facebook,
      instagram,
      tiktok,
      twitter,
      whatsapp,
      heroTitle,
      heroSubtitle,
      supportHeadline,
      supportText,
      homepageSupportEmail,
      supportInstagram,
      supportTwitter
    } = req.body;

    if (storeName !== undefined) settings.storeName = String(storeName).trim();
    if (supportEmail !== undefined) {
      settings.supportEmail = String(supportEmail).trim().toLowerCase();
    }
    if (phone !== undefined) settings.phone = String(phone).trim();
    if (address !== undefined) settings.address = String(address).trim();
    if (currency !== undefined) {
      settings.currency = String(currency).trim().toUpperCase();
    }
    if (footerText !== undefined) settings.footerText = String(footerText).trim();

    settings.socialLinks = {
      facebook:
        facebook !== undefined
          ? String(facebook).trim()
          : settings.socialLinks?.facebook || "",
      instagram:
        instagram !== undefined
          ? String(instagram).trim()
          : settings.socialLinks?.instagram || "",
      tiktok:
        tiktok !== undefined
          ? String(tiktok).trim()
          : settings.socialLinks?.tiktok || "",
      twitter:
        twitter !== undefined
          ? String(twitter).trim()
          : settings.socialLinks?.twitter || "",
      whatsapp:
        whatsapp !== undefined
          ? String(whatsapp).trim()
          : settings.socialLinks?.whatsapp || ""
    };

    settings.homepage = {
      heroTitle:
        heroTitle !== undefined
          ? String(heroTitle).trim()
          : settings.homepage?.heroTitle || defaultSettings.homepage.heroTitle,

      heroSubtitle:
        heroSubtitle !== undefined
          ? String(heroSubtitle).trim()
          : settings.homepage?.heroSubtitle || defaultSettings.homepage.heroSubtitle,

      supportHeadline:
        supportHeadline !== undefined
          ? String(supportHeadline).trim()
          : settings.homepage?.supportHeadline || defaultSettings.homepage.supportHeadline,

      supportText:
        supportText !== undefined
          ? String(supportText).trim()
          : settings.homepage?.supportText || defaultSettings.homepage.supportText,

      supportEmail:
        homepageSupportEmail !== undefined
          ? String(homepageSupportEmail).trim().toLowerCase()
          : settings.homepage?.supportEmail || "",

      supportInstagram:
        supportInstagram !== undefined
          ? String(supportInstagram).trim()
          : settings.homepage?.supportInstagram || "",

      supportTwitter:
        supportTwitter !== undefined
          ? String(supportTwitter).trim()
          : settings.homepage?.supportTwitter || ""
    };

    await settings.save();

    return res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error("Update store settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update store settings"
    });
  }
};

module.exports = {
  getStoreSettings,
  updateStoreSettings
};