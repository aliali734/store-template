/* ================= SHOW ORDERS ================= */
async function showOrders() {
  const ordersSection = document.getElementById("orders-section");
  const dashboardSection = document.getElementById("dashboard-section");
  const productsSection = document.querySelector(".products-section");

  dashboardSection?.classList.add("hidden");
  productsSection?.classList.add("hidden");
  ordersSection?.classList.remove("hidden");

  ordersSection.innerHTML = "<h2>Orders</h2><p>Loading...</p>";

  try {
    const res = await window.adminApiFetch("/orders/admin/all");
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.message || "Failed to fetch orders");
    }

    renderOrders(data.orders || []);
  } catch (err) {
    console.error(err);
    ordersSection.innerHTML = `<h2>Orders</h2><p style="color:red">${err.message}</p>`;
  }
}

/* ================= UPDATE ORDER STATUS ================= */
async function updateAdminOrderStatus(orderId, status) {
  try {
    const res = await window.adminApiFetch(`/orders/admin/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert(data.message || "Failed to update order status");
      return;
    }

    showOrders();
  } catch (err) {
    console.error(err);
    alert("Server error while updating order status");
  }
}

/* ================= ACTION BUTTONS ================= */
function getOrderActionButtons(order) {
  if (order.status === "pending") {
    return `
      <button type="button" class="btn status-btn" data-id="${order._id}" data-status="confirmed">Confirm</button>
      <button type="button" class="btn danger-btn" data-id="${order._id}" data-status="cancelled">Cancel</button>
    `;
  }

  if (order.status === "confirmed") {
    return `
      <button type="button" class="btn status-btn" data-id="${order._id}" data-status="shipped">Ship</button>
      <button type="button" class="btn danger-btn" data-id="${order._id}" data-status="cancelled">Cancel</button>
    `;
  }

  if (order.status === "shipped") {
    return `
      <button type="button" class="btn status-btn" data-id="${order._id}" data-status="delivered">Deliver</button>
    `;
  }

  return `<span style="opacity:.7;">No actions</span>`;
}

/* ================= RENDER ORDERS ================= */
function renderOrders(orders) {
  const section = document.getElementById("orders-section");
  if (!section) return;

  section.innerHTML = "<h2>Orders</h2>";

  if (!orders.length) {
    section.innerHTML += "<p>No orders found</p>";
    return;
  }

  const container = document.createElement("div");
  container.className = "orders-container";

  orders.forEach((order) => {
    const div = document.createElement("div");
    div.className = `order-card status-${order.status}`;

    div.innerHTML = `
      <p><strong>Order ID:</strong> ${order._id}</p>
      <p><strong>User:</strong> ${order.user?.email || "-"}</p>
      <p><strong>Total:</strong> $${Number(order.totalPrice || 0).toFixed(2)}</p>
      <p><strong>Status:</strong> ${order.status}</p>
      <p><strong>Paid:</strong> ${order.isPaid ? "Yes ✅" : "No ❌"}</p>
      <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
      <div class="order-actions">
        ${getOrderActionButtons(order)}
      </div>
    `;

    container.appendChild(div);
  });

  section.appendChild(container);

  section.querySelectorAll(".status-btn, .danger-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const orderId = btn.dataset.id;
      const status = btn.dataset.status;
      updateAdminOrderStatus(orderId, status);
    });
  });
}

/* ================= EXPORT ================= */
window.showOrders = showOrders;