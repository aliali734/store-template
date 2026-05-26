const ORDER_ID = localStorage.getItem("currentOrderId");

// =====================
// API FETCH WRAPPER
// =====================
async function confirmationApiFetch(path, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        ...(options.headers || {})
      }
    });

    return res;
  } catch (err) {
    console.error("Fetch error:", err);
    throw err;
  }
}

// =====================
// PAGE INIT
// =====================
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Use /auth/me — a permanent, production-safe session check endpoint.
    // /test/user is only mounted in development (isDev) and returns 404
    // in production, which caused "Failed to verify session" for every user.
    const me = await confirmationApiFetch("/auth/me");

    if (me.status === 401 || me.status === 403) {
      await forceLogout();
      return;
    }

    if (!me.ok) {
      updateStatus("Failed to verify session", "error");
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
  try {
    const res  = await confirmationApiFetch(`/orders/${ORDER_ID}`);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      updateStatus(data.message || "Failed to load order", "error");
      return;
    }

    const order = data.order;

    if (!order) {
      updateStatus("Order not found", "error");
      return;
    }

    renderOrder(order);

    localStorage.removeItem("currentOrderId");

  } catch (err) {
    console.error(err);
    updateStatus("Failed to load order", "error");
  }
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
      Number(item.price || 0) *
      Number(item.quantity || 0)
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