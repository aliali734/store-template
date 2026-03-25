const API_BASE = window.APP_CONFIG?.API_BASE || "http://localhost:5000/api";
const SERVER_BASE = window.APP_CONFIG?.SERVER_BASE || "http://localhost:5000";

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

  // Page title
  if (settings.storeName) {
    document.title = settings.storeName;
  }

  // Footer text
  const footerTextEl = document.getElementById("footer-text");
  if (footerTextEl) {
    footerTextEl.textContent =
      settings.footerText?.trim() ||
      `© ${settings.storeName || "Clothing Store"}. All rights reserved.`;
  }

  // Social links
  const socialMap = {
    facebook: document.getElementById("social-facebook"),
    instagram: document.getElementById("social-instagram"),
    tiktok: document.getElementById("social-tiktok"),
    twitter: document.getElementById("social-twitter"),
    whatsapp: document.getElementById("social-whatsapp")
  };

  Object.entries(socialMap).forEach(([key, el]) => {
    const url = settings.socialLinks?.[key];

    if (el && url) {
      el.href = url;
      el.style.display = "inline-block";
    }
  });

  // Store name fallback text in header
  const logoText = document.getElementById("site-logo-text");
  if (logoText && !logoText.querySelector("img")) {
    logoText.textContent = settings.storeName || "Clothing Store";
  }
}

// Optional global access
window.getStoreSettings = getStoreSettings;
window.applyStoreSettingsToUI = applyStoreSettingsToUI;