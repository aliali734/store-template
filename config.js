function getSavedAppConfig() {
  try {
    const raw = localStorage.getItem("storeTemplateConfig");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

const savedConfig = getSavedAppConfig();

const API_BASE =
  savedConfig.API_BASE ||
  window.APP_CONFIG?.API_BASE ||
  "http://localhost:5000/api";

const SERVER_BASE =
  savedConfig.SERVER_BASE ||
  window.APP_CONFIG?.SERVER_BASE ||
  "http://localhost:5000";

// =====================
// GET COOKIE
// =====================
function getCookie(name) {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="));

  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

// =====================
// CSRF HEADERS
// =====================
function csrfHeaders() {
  const csrfToken = getCookie("csrfToken");
  return csrfToken ? { "x-csrf-token": csrfToken } : {};
}

// =====================
// ENSURE CSRF COOKIE
// =====================
async function ensureCsrf() {
  try {
    await fetch(`${API_BASE}/csrf`, {
      method: "GET",
      credentials: "include"
    });
  } catch (err) {
    console.error("Failed to initialize CSRF:", err);
  }
}

// =====================
// GET CSRF TOKEN
// Single shared implementation used by every page script.
// Fetches a fresh token from the server on every call so the token
// is always current — important after login rotates the cookie.
// Previously each file had its own identical copy of this function.
// =====================
async function getCsrfToken() {
  try {
    const res = await fetch(`${API_BASE}/csrf`, {
      method: "GET",
      credentials: "include"
    });

    const data = await res.json().catch(() => ({}));
    return data.csrfToken || null;
  } catch (err) {
    console.error("Failed to initialize CSRF:", err);
    return null;
  }
}

// =====================
// API FETCH
// =====================
async function apiFetch(endpoint, options = {}) {
  const isFormData = options.body instanceof FormData;

  await ensureCsrf();

  const config = {
    method: options.method || "GET",
    credentials: "include",
    headers: {
      ...(!isFormData ? { "Content-Type": "application/json" } : {}),
      ...csrfHeaders(),
      ...(options.headers || {})
    },
    body: options.body
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);

    if (res.status === 401) {
      throw new Error("Unauthorized");
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.message || "Request failed");
    }

    return data;
  } catch (err) {
    console.error("API Error:", err.message);
    throw err;
  }
}

// =====================
// STORE SETTINGS FETCHER
// =====================
async function getStoreSettings() {
  return apiFetch("/settings");
}

// =====================
// APPLY STORE SETTINGS TO UI
// =====================
function applyStoreSettingsToUI(settings) {
  if (!settings) return;

  if (settings.storeName) {
    document.title = settings.storeName;
  }

  const footerTextEl = document.getElementById("footer-text");
  if (footerTextEl) {
    footerTextEl.textContent =
      settings.footerText?.trim() ||
      `© ${settings.storeName || "Clothing Store"}. All rights reserved.`;
  }

  const socialMap = {
    facebook:  document.getElementById("social-facebook"),
    instagram: document.getElementById("social-instagram"),
    tiktok:    document.getElementById("social-tiktok"),
    twitter:   document.getElementById("social-twitter"),
    whatsapp:  document.getElementById("social-whatsapp")
  };

  Object.entries(socialMap).forEach(([key, el]) => {
    const url = settings.socialLinks?.[key];

    if (el && url) {
      el.href = url;
      el.style.display = "inline-block";
    }
  });

  const logoText = document.getElementById("site-logo-text");
  if (logoText && !logoText.querySelector("img")) {
    logoText.textContent = settings.storeName || "Clothing Store";
  }
}

// =====================
// OPTIONAL CONFIG CHECK
// =====================
function hasSavedConnectionConfig() {
  return Boolean(savedConfig.API_BASE && savedConfig.SERVER_BASE);
}

// Expose everything needed by page scripts globally.
window.getCsrfToken            = getCsrfToken;
window.getStoreSettings        = getStoreSettings;
window.applyStoreSettingsToUI  = applyStoreSettingsToUI;
window.hasSavedConnectionConfig = hasSavedConnectionConfig;