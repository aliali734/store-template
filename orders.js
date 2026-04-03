const ordersContainer = document.getElementById("orders-container");

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
// API FETCH
// =====================
async function ordersApiFetch(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const csrfToken = await getCsrfToken();

  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method || "GET",
    credentials: "include",
    headers: {
      ...(!isFormData ? { "Content-Type": "application/json" } : {}),
      ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
      ...(options.headers || {})
    },
    body: options.body
  });

  if (res.status === 401 || res.status === 403) {
    await forceLogout();
    throw new Error("Unauthorized");
  }

  return res;
}

// =====================
// LOAD MY ORDERS
// =====================
async function loadMyOrders() {
  if (!ordersContainer) return;

  ordersContainer.innerHTML = "<p>Loading orders...</p>";

  try {
    const res = await ordersApiFetch("/orders/my");
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      ordersContainer.innerHTML = `<p style="color:#b91c1c">${data.message || "Failed to load orders"}</p>`;
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
    ordersContainer.innerHTML =
      "<p style='color:#b91c1c'>Error loading orders</p>";
  }
}

// =====================
// CANCEL ORDER
// =====================
async function cancelOrder(orderId) {
  const confirmed = window.confirm(
    "Are you sure you want to cancel this order?"
  );
  if (!confirmed) return;

  try {
    const res = await ordersApiFetch(`/orders/${orderId}`, {
      method: "PUT",
      body: JSON.stringify({ status: "cancelled" })
    });

    const data = await res.json().catch(() => ({}));

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
      return `<span class="paid-label">Pending</span>`;
    case "confirmed":
      return `<span class="paid-label">Confirmed</span>`;
    case "shipped":
      return `<span class="paid-label">Shipped</span>`;
    case "delivered":
      return `<span class="paid-label">Delivered</span>`;
    case "cancelled":
      return `<span class="paid-label">Cancelled</span>`;
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
            <span class="item-total">$${(
              Number(item.price || 0) * Number(item.quantity || 0)
            ).toFixed(2)}</span>
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
      <ul class="order-items-list">
        ${itemsHtml}
      </ul>
      ${
        canCancel
          ? `<button type="button" class="cancel-order-btn" data-id="${order._id}">Cancel Order</button>`
          : ""
      }
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