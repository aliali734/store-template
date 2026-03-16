// js/api.js

const API_BASE = "https://store-template-nemj.onrender.com/api";
const SERVER_BASE = "https://store-template-nemj.onrender.com";

function getCookie(name) {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="))
    ?.split("=")[1];
}

function csrfHeaders() {
  const csrfToken = getCookie("csrfToken");
  return csrfToken ? { "x-csrf-token": csrfToken } : {};
}

async function apiFetch(endpoint, options = {}) {
  const isFormData = options.body instanceof FormData;

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