// js/api.js

const API_BASE = "https://store-template-nemj.onrender.com/api";
const SERVER_BASE = "https://store-template-nemj.onrender.com";

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