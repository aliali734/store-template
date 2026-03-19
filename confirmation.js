// confirmation.js

const ORDER_ID = localStorage.getItem("currentOrderId");

// =====================
// GET CSRF TOKEN
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
// FORCE LOGOUT
// =====================
async function forceLogout() {
  try {
    const csrfToken = await getCsrfToken();

    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: {
        ...(csrfToken ? { "x-csrf-token": csrfToken } : {})
      }
    });
  } catch (e) {
    console.error("Logout request failed:", e);
  } finally {
    window.location.href = "login.html";
  }
}

// =====================
// API FETCH WRAPPER
// =====================
async function confirmationApiFetch(path, options = {}) {
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
// PAGE INIT
// =====================
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const me = await confirmationApiFetch("/test/user");

    if (!me.ok) {
      await forceLogout();
      return;
    }

    if (!ORDER_ID) {
      updateStatus("No order found", "error");
      return;
    }

    await loadOrder();
  } catch (err) {
    console.error(err);
    updateStatus("Server error", "error");
  }
});

// =====================
// LOAD ORDER
// =====================
async function loadOrder() {
  const res = await confirmationApiFetch(`/orders/${ORDER_ID}`);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    updateStatus(data.message || "Failed to load order", "error");
    return;
  }

  const order = data.order;
  renderOrder(order);

  localStorage.removeItem("currentOrderId");
}

// =====================
// RENDER ORDER
// =====================
function renderOrder(order) {
  const statusText =
    order.status === "pending"
      ? "Order placed successfully. Pay cash on delivery."
      : `Order status: ${order.status}`;

  updateStatus(statusText, "success");

  const itemsList = document.getElementById("order-items");
  if (!itemsList) return;

  itemsList.innerHTML = "";

  (order.products || []).forEach((item) => {
    const li = document.createElement("li");
    li.textContent = `${item.name} × ${item.quantity} — $${(
      Number(item.price || 0) * Number(item.quantity || 0)
    ).toFixed(2)}`;
    itemsList.appendChild(li);
  });

  const totalEl = document.getElementById("order-total");
  if (totalEl) {
    totalEl.textContent = `Total: $${Number(order.totalPrice || 0).toFixed(2)}`;
  }
}

// =====================
// UPDATE STATUS
// =====================
function updateStatus(text, type) {
  const statusEl = document.getElementById("status");
  if (!statusEl) return;

  statusEl.textContent = text;
  statusEl.className = `status ${type}`;
}