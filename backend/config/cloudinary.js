const cloudinaryLib = require("cloudinary").v2;
const StoreSettings = require("../models/storeSettings");

// ============================
// DYNAMIC CLOUDINARY CONFIG
// Returns a configured cloudinary instance using credentials stored
// in MongoDB (StoreSettings) rather than process.env, so the client
// can provide their own keys through the setup wizard.
//
// Caches the configured instance until the server restarts.
// If you need to support live credential updates without a restart,
// remove the cache and always re-read from the DB.
// ============================
let _configured = false;

async function getCloudinary() {
  if (!_configured) {
    const settings = await StoreSettings.findOne();
    const creds    = settings?.cloudinary;

    if (!creds?.cloudName || !creds?.apiKey || !creds?.apiSecret) {
      throw new Error(
        "Cloudinary is not configured. Please fill in the Cloudinary settings in the store setup wizard."
      );
    }

    cloudinaryLib.config({
      cloud_name: creds.cloudName,
      api_key:    creds.apiKey,
      api_secret: creds.apiSecret
    });

    _configured = true;
  }

  return cloudinaryLib;
}

// Call this after the admin updates Cloudinary credentials so the
// cached config is refreshed on the next upload request.
function resetCloudinaryCache() {
  _configured = false;
}

module.exports = { getCloudinary, resetCloudinaryCache };