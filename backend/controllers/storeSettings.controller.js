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
      whatsapp
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