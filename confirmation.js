// js/confirmation.js ✅ COD + Cookie Auth + CSRF + Auto Logout

const API_BASE = "https://store-template-nemj.onrender.com/api";
const ORDER_ID = localStorage.getItem("currentOrderId");

// =====================
// CSRF HELPERS
// =====================
function getCookie(name) {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="))
    ?.split("=")[1];
}

function csrfHeaders() {
  const csrf = getCookie("csrfToken");
  return csrf ? { "x-csrf-token": csrf } : {};
}

// =====================
// FORCE LOGOUT (COOKIE)
// =====================
async function forceLogout() {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: { ...csrfHeaders() }
    });
  } catch (e) {
    console.error("Logout request failed:", e);
  } finally {
    window.location.href = "login.html";
  }
}

// =====================
// API FETCH WRAPPER (COOKIE + AUTO LOGOUT)
// =====================
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include", // ✅ IMPORTANT: send cookie
    headers: {
      ...(options.headers || {})
    }
  });

  if (res.status === 401 || res.status === 403) {
    await forceLogout();
    throw new Error("Unauthorized");
  }

  return res;
}

// =====================
// LOAD HEADER
// =====================
fetch("header.html")
  .then((res) => res.text())
  .then((html) => {
    document.getElementById("header").innerHTML = html;
    setupAuthHeader();
  });

function setupAuthHeader() {
  const loginLink = document.getElementById("login-link");
  const registerLink = document.getElementById("register-link");
  const logoutBtn = document.getElementById("logout-btn");

  if (!logoutBtn) return;

  // Confirmation page is protected => show logout, hide login/register
  if (loginLink) loginLink.style.display = "none";
  if (registerLink) registerLink.style.display = "none";
  logoutBtn.style.display = "inline-flex";

  logoutBtn.onclick = () => forceLogout();
}

// =====================
// PAGE INIT (VERIFY SESSION + ORDER_ID)
// =====================
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // ✅ verify cookie session first
    const me = await apiFetch("/test/user");
    if (!me.ok) {
      await forceLogout();
      return;
    }

    if (!ORDER_ID) {
      updateStatus("No order found ❌", "error");
      return;
    }

    await loadOrder();
  } catch (err) {
    console.error(err);
    updateStatus("Server error", "error");
  }
});

// =====================
// LOAD ORDER (COD)
// =====================
async function loadOrder() {
  const res = await apiFetch(`/orders/${ORDER_ID}`);
  const data = await res.json();

  if (!res.ok) {
    updateStatus(data.message || "Failed to load order", "error");
    return;
  }

  const order = data.order;
  renderOrder(order);

  // ✅ Clear stored order after showing it
  localStorage.removeItem("currentOrderId");
}

// =====================
// RENDER ORDER
// =====================
function renderOrder(order) {
  const statusText =
    order.status === "pending"
      ? "Order placed ✅ Pay cash on delivery"
      : `Order status: ${order.status}`;

  updateStatus(statusText, "success");

  const itemsList = document.getElementById("order-items");
  itemsList.innerHTML = "";

  order.products.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = `${item.name} × ${item.quantity} — $${(
      item.price * item.quantity
    ).toFixed(2)}`;
    itemsList.appendChild(li);
  });

  document.getElementById("order-total").textContent = `Total: $${Number(
    order.totalPrice || 0
  ).toFixed(2)}`;
}

// =====================
// UPDATE STATUS
// =====================
function updateStatus(text, type) {
  const statusEl = document.getElementById("status");
  statusEl.textContent = text;
  statusEl.className = `status ${type}`;
}