const API_BASE = "https://shoe-store-api.onrender.com/api";

function getCookie(name) {
  return document.cookie
    .split("; ")
    .find(row => row.startsWith(name + "="))
    ?.split("=")[1];
}

async function apiFetch(endpoint, options = {}) {
  const csrfToken = getCookie("csrfToken");

  const config = {
    method: "GET",
    credentials: "include", // important for cookies
    headers: {
      "Content-Type": "application/json",
      ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
      ...(options.headers || {})
    },
    ...options
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Request failed");
    }

    return await res.json();
  } catch (err) {
    console.error("API Error:", err.message);
    throw err;
  }
}