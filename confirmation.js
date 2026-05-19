const ORDER_ID = localStorage.getItem("currentOrderId");

// forceLogout is defined in config.js and available globally.

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
  const res  = await confirmationApiFetch(`/orders/${ORDER_ID}`);
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
      Number(item.price    || 0) *
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
  statusEl.className   = `status ${type}`;
}