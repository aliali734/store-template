const API_BASE = "https://shoe-store-api.onrender.com/api";
const ordersContainer = document.getElementById("orders-container");

// =====================
// API FETCH WRAPPER (AUTO LOGOUT ON 401/403)
// =====================
async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: token ? `Bearer ${token}` : undefined
    }
  });

  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem("token");
    window.location.href = "login.html";
    throw new Error("Unauthorized");
  }

  return res;
}

// =====================
// LOAD HEADER
// =====================
fetch("header.html")
  .then(res => res.text())
  .then(html => {
    document.getElementById("header").innerHTML = html;
    setupAuthHeader();
  });

// =====================
// LOAD MY ORDERS (COD)
// =====================
async function loadMyOrders() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  ordersContainer.innerHTML = "<p>Loading...</p>";

  try {
    const res = await apiFetch("/orders/my");
    const data = await res.json();
const API_BASE = "https://shoe-store-api.onrender.com/api";
const SERVER_BASE = "https://shoe-store-api.onrender.com";
const ordersContainer = document.getElementById("orders-container");

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
// FORCE LOGOUT
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
// API FETCH
// =====================
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
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
    const headerEl = document.getElementById("header");
    if (headerEl) {
      headerEl.innerHTML = html;
      setupAuthHeader();
    }
  })
  .catch((err) => console.error("Failed to load header:", err));

function setupAuthHeader() {
  const loginLink = document.getElementById("login-link");
  const registerLink = document.getElementById("register-link");
  const logoutBtn = document.getElementById("logout-btn");

  if (loginLink) loginLink.style.display = "none";
  if (registerLink) registerLink.style.display = "none";
  if (logoutBtn) {
    logoutBtn.style.display = "inline-flex";
    logoutBtn.onclick = () => forceLogout();
  }
}

// =====================
// LOAD MY ORDERS
// =====================
async function loadMyOrders() {
  if (!ordersContainer) return;

  ordersContainer.innerHTML = "<p>Loading orders...</p>";

  try {
    const res = await apiFetch("/orders/my");
    const data = await res.json();

    if (!res.ok) {
      ordersContainer.innerHTML = `<p style="color:red">${data.message || "Failed to load orders"}</p>`;
      return;
    }

    const orders = data.orders || [];

    if (!orders.length) {
      ordersContainer.innerHTML = "<p>No orders found.</p>";
      return;
    }

    renderOrders(orders);
  } catch (err) {
    console.error(err);
    ordersContainer.innerHTML = "<p style='color:red'>Error loading orders</p>";
  }
}

// =====================
// CANCEL ORDER
// =====================
async function cancelOrder(orderId) {
  const confirmed = window.confirm("Are you sure you want to cancel this order?");
  if (!confirmed) return;

  try {
    const res = await apiFetch(`/orders/${orderId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...csrfHeaders()
      },
      body: JSON.stringify({ status: "cancelled" })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Failed to cancel order");
      return;
    }

    loadMyOrders();
  } catch (err) {
    console.error(err);
    alert("Server error while cancelling order");
  }
}

// =====================
// ORDER STATUS LABELS
// =====================
function getStatusLabel(order) {
  switch (order.status) {
    case "pending":
      return `<span class="paid-label">Pending ⏳</span>`;
    case "confirmed":
      return `<span class="paid-label">Confirmed ✅</span>`;
    case "shipped":
      return `<span class="paid-label">Shipped 🚚</span>`;
    case "delivered":
      return `<span class="paid-label">Delivered 📦</span>`;
    case "cancelled":
      return `<span class="paid-label">Cancelled ❌</span>`;
    default:
      return `<span class="paid-label">${order.status}</span>`;
  }
}

// =====================
// RENDER ORDERS
// =====================
function renderOrders(orders) {
  ordersContainer.innerHTML = "";

  orders.forEach((order) => {
    const div = document.createElement("div");
    div.className = `order-card ${order.status}`;

    const statusLabel = getStatusLabel(order);

    const itemsHtml = (order.products || [])
      .map(
        (item) => `
          <li>
            ${item.name} × ${item.quantity}
            <span style="float:right">$${(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}</span>
          </li>
        `
      )
      .join("");

    const canCancel = order.status === "pending";

    div.innerHTML = `
      <h3>Order #${order._id}</h3>
      <p><strong>Total:</strong> $${Number(order.totalPrice || 0).toFixed(2)}</p>
      <p><strong>Status:</strong> ${order.status}</p>
      <p><strong>Payment:</strong> ${order.paymentMethod || "cash"}</p>
      <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
      ${statusLabel}
      <ul style="margin-top:10px;">
        ${itemsHtml}
      </ul>
      ${
        canCancel
          ? `<button type="button" class="cancel-order-btn" data-id="${order._id}">Cancel Order</button>`
          : ""
      }
      <hr/>
    `;

    ordersContainer.appendChild(div);
  });

  document.querySelectorAll(".cancel-order-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      cancelOrder(btn.dataset.id);
    });
  });
}

// =====================
// INIT
// =====================
document.addEventListener("DOMContentLoaded", loadMyOrders);
    const orders = data.orders || [];
    if (!orders.length) {
      ordersContainer.innerHTML = "<p>No orders found.</p>";
      return;
    }

    renderOrders(orders);
  } catch (err) {
    console.error(err);
    ordersContainer.innerHTML = "<p style='color:red'>Error loading orders</p>";
  }
}

function renderOrders(orders) {
  ordersContainer.innerHTML = "";

  orders.forEach(order => {
    const div = document.createElement("div");
    div.className = `order-card ${order.status}`;

    // ✅ COD status labels (no payment button)
    const statusLabel =
      order.status === "pending"
        ? `<span class="paid-label">Cash on delivery ⏳</span>`
        : order.status === "paid"
        ? `<span class="paid-label">Delivered / Paid ✅</span>`
        : `<span class="paid-label">${order.status}</span>`;

    div.innerHTML = `
      <h3>Order #${order._id}</h3>
      <p>Total: $${order.totalPrice}</p>
      <p>Status: <strong>${order.status}</strong></p>
      <p>Date: ${new Date(order.createdAt).toLocaleString()}</p>
      ${statusLabel}
      <hr/>
    `;

    ordersContainer.appendChild(div);
  });
}

document.addEventListener("DOMContentLoaded", loadMyOrders);