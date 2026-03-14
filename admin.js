const API_BASE = "https://shoe-store-api.onrender.com/api";
const SERVER_BASE = "http://127.0.0.1:5000";

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
// LOGOUT (COOKIE)
// =====================
async function adminLogout() {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: { ...csrfHeaders() }
    });
  } catch (e) {
    console.error("Logout failed:", e);
  } finally {
    showLogin("Logged out.");
  }
}

// =====================
// API FETCH (COOKIE)
// =====================
async function adminApiFetch(path, options = {}) {
  return fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.headers || {})
    }
  });
}

window.adminApiFetch = adminApiFetch;
/* ================= AUTH ================= */
const loginSection = document.getElementById("login-section");
const dashboardSection = document.getElementById("dashboard-section");
const loginForm = document.getElementById("login-form");
const loginMessage = document.getElementById("login-message");
const logoutBtn = document.getElementById("logoutBtn");

/* ================= DASHBOARD / PRODUCTS ================= */
const form = document.getElementById("product-form");
const messageEl = document.getElementById("message");
const modal = document.getElementById("productModal");
const overlay = document.getElementById("overlay");
const openBtn = document.getElementById("openAddProduct");
const closeBtn = document.getElementById("closeModal");
const modalTitle = document.getElementById("modalTitle");
const submitBtn = document.getElementById("submitBtn");
const productIdInput = document.getElementById("productId");

const name = document.getElementById("name");
const description = document.getElementById("description");
const brand = document.getElementById("brand");
const category = document.getElementById("category");
const audience = document.getElementById("audience");
const price = document.getElementById("price");
const compareAtPrice = document.getElementById("compareAtPrice");
const stock = document.getElementById("stock");
const sizes = document.getElementById("sizes");
const colors = document.getElementById("colors");
const featured = document.getElementById("featured");
const isActive = document.getElementById("isActive");
const image = document.getElementById("image");

const productsBody = document.getElementById("productsBody");

/* ================= HEADER ================= */
const openHeaderBtn = document.getElementById("openHeaderModal");
const closeHeaderBtn = document.getElementById("closeHeaderModal");
const headerModal = document.getElementById("headerModal");
const headerForm = document.getElementById("header-form");
const headerLogo = document.getElementById("header-logo");
const logoPreview = document.getElementById("logoPreview");
const headerCategories = document.getElementById("header-categories");
const headerMessage = document.getElementById("headerMessage");

// =====================
// SHOW/HIDE HELPERS
// =====================
function showLogin(msg = "") {
  loginSection?.classList.remove("hidden");
  dashboardSection?.classList.add("hidden");

  if (loginMessage) {
    loginMessage.textContent = msg;
    loginMessage.style.color = msg ? "red" : "";
  }
}

function showDashboard() {
  loginSection?.classList.add("hidden");
  dashboardSection?.classList.remove("hidden");
}

// =====================
// CHECK ADMIN SESSION
// =====================
async function checkAdminAuth() {
  try {
    const res =  await adminApiFetch("/test/admin")

    if (res.ok) {
      showDashboard();
      loadProducts();
      return;
    }

    showLogin("Please login as admin.");
  } catch (err) {
    console.error(err);
    showLogin("Server/network error.");
  }
}

// =====================
// LOGIN
// =====================
loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email")?.value.trim().toLowerCase();
  const password = document.getElementById("password")?.value.trim();

  if (!email || !password) {
    loginMessage.textContent = "Email & password required.";
    loginMessage.style.color = "red";
    return;
  }

  loginMessage.textContent = "Logging in...";
  loginMessage.style.color = "black";

  try {
    const res = await adminApiFetch("/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...csrfHeaders()
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      loginMessage.textContent = data.message || "Login failed.";
      loginMessage.style.color = "red";
      return;
    }

    await checkAdminAuth();
  } catch (err) {
    console.error(err);
    loginMessage.textContent = "Server error.";
    loginMessage.style.color = "red";
  }
});

// =====================
// LOGOUT
// =====================
logoutBtn?.addEventListener("click", adminLogout);

// =====================
// MULTI-SELECT HELPERS
// =====================
function getMultiSelectValues(selectEl) {
  return [...selectEl.selectedOptions].map((option) => option.value);
}

function setMultiSelectValues(selectEl, values = []) {
  [...selectEl.options].forEach((option) => {
    option.selected = values.includes(option.value);
  });
}

// =====================
// MODAL
// =====================
openBtn?.addEventListener("click", () => {
  modalTitle.textContent = "Add Product";
  submitBtn.textContent = "Add";
  productIdInput.value = "";
  form.reset();
  setMultiSelectValues(sizes, []);
  setMultiSelectValues(colors, []);
  if (isActive) isActive.checked = true;
  if (featured) featured.checked = false;
  modal.classList.remove("hidden");
  overlay.classList.remove("hidden");
});

closeBtn?.addEventListener("click", closeModal);
overlay?.addEventListener("click", () => {
  closeModal();
  closeHeaderModal();
});

function closeModal() {
  modal.classList.add("hidden");
  overlay.classList.add("hidden");
}

function closeHeaderModal() {
  headerModal.classList.add("hidden");
  overlay.classList.add("hidden");
}

// =====================
// ADD / EDIT PRODUCT
// =====================
form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  e.stopPropagation();

  const formData = new FormData();
  formData.append("name", name.value);
  formData.append("description", description.value);
  formData.append("brand", brand.value);
  formData.append("category", category.value);
  formData.append("audience", audience.value);
  formData.append("price", price.value);
  formData.append("compareAtPrice", compareAtPrice.value || 0);
  formData.append("stock", stock.value);

  const selectedSizes = getMultiSelectValues(sizes);
  const selectedColors = getMultiSelectValues(colors);

  formData.append("sizes", selectedSizes.join(","));
  formData.append("colors", selectedColors.join(","));
  formData.append("featured", featured.checked);
  formData.append("isActive", isActive.checked);

  if (image?.files?.length) {
    [...image.files].slice(0, 5).forEach((file) => {
      formData.append("images", file);
    });
  }

  const productId = productIdInput.value;
  const method = productId ? "PUT" : "POST";
  const path = productId ? `/product/${productId}` : `/product`;

  try {
    const res = await adminApiFetch(path, {
      method,
      headers: {
        ...csrfHeaders()
      },
      body: formData
    });

    const data = await res.json();

    if (!res.ok) {
      messageEl.textContent = data.message || "Error";
      messageEl.style.color = "red";
      return;
    }

    messageEl.textContent = "✅ Saved successfully";
    messageEl.style.color = "green";

    setTimeout(() => {
      closeModal();
      form.reset();
      setMultiSelectValues(sizes, []);
      setMultiSelectValues(colors, []);
      loadProducts();
    }, 600);
  } catch (err) {
    console.error(err);
    messageEl.textContent = "Server error";
    messageEl.style.color = "red";
  }
});

// =====================
// LOAD PRODUCTS
// =====================
async function loadProducts() {
  try {
    const res = await adminApiFetch(`/product?limit=100&isActive=true`);
    const data = await res.json();
    renderProducts(data.products || []);
  } catch (err) {
    console.error(err);
  }
}

// =====================
// RENDER PRODUCTS
// =====================
function renderProducts(products) {
  productsBody.innerHTML = "";

  if (!products.length) {
    productsBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No products</td></tr>`;
    return;
  }

  products.forEach((product) => {
    const tr = document.createElement("tr");

    const firstImage = Array.isArray(product.images)
      ? product.images[0]
      : product.images || "";

    const imgSrc = firstImage
      ? `${SERVER_BASE}${firstImage}`
      : "https://via.placeholder.com/50";

    tr.innerHTML = `
      <td><img src="${imgSrc}" style="width:50px;height:50px;object-fit:cover;border-radius:8px;"></td>
      <td>${product.name}</td>
      <td>$${product.price}</td>
      <td>${product.stock}</td>
      <td>${product.category || "-"}</td>
      <td class="actions">
        <button type="button" class="btn edit">Edit</button>
        <button type="button" class="btn delete">Delete</button>
      </td>
    `;

    tr.querySelector(".edit").addEventListener("click", () => openEditPopup(product));

    tr.querySelector(".delete").addEventListener("click", async () => {
      if (!confirm("Delete this product?")) return;

      await adminApiFetch(`/product/${product._id}`, {
        method: "DELETE",
        headers: {
          ...csrfHeaders()
        }
      });

      loadProducts();
    });

    productsBody.appendChild(tr);
  });
}
// =====================
// EDIT POPUP
// =====================
function openEditPopup(product) {
  modalTitle.textContent = "Edit Product";
  submitBtn.textContent = "Update";

  productIdInput.value = product._id;
  name.value = product.name || "";
  description.value = product.description || "";
  brand.value = product.brand || "";
  category.value = product.category || "";
  audience.value = product.audience || "unisex";
  price.value = product.price ?? "";
  compareAtPrice.value = product.compareAtPrice ?? 0;
  stock.value = product.stock ?? "";
  setMultiSelectValues(sizes, Array.isArray(product.sizes) ? product.sizes : []);
  setMultiSelectValues(colors, Array.isArray(product.colors) ? product.colors : []);
  featured.checked = !!product.featured;
  isActive.checked = product.isActive !== false;

  modal.classList.remove("hidden");
  overlay.classList.remove("hidden");
}

// =====================
// HEADER MODAL
// =====================
openHeaderBtn?.addEventListener("click", () => {
  headerModal.classList.remove("hidden");
  overlay.classList.remove("hidden");
  loadHeaderSettings();
});

closeHeaderBtn?.addEventListener("click", closeHeaderModal);

headerLogo?.addEventListener("change", () => {
  if (headerLogo.files[0]) {
    logoPreview.src = URL.createObjectURL(headerLogo.files[0]);
  }
});

async function loadHeaderSettings() {
  try {
    const res = await fetch(`${API_BASE}/header`);
    const data = await res.json();
    if (data.success) {
      logoPreview.src = data.header.logo ? `${SERVER_BASE}${data.header.logo}` : "";
      headerCategories.value = (data.header.categories || []).join(", ");
    }
  } catch (err) {
    console.error("Failed to load header settings:", err);
  }
}

headerForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData();
  if (headerLogo.files[0]) formData.append("logo", headerLogo.files[0]);
  formData.append("categories", headerCategories.value);

  try {
    const res = await adminApiFetch(`/header`, {
      method: "PUT",
      headers: {
        ...csrfHeaders()
      },
      body: formData
    });

    const data = await res.json();
    headerMessage.textContent = data.success ? "✅ Header updated" : (data.message || "Error");
  } catch (err) {
    headerMessage.textContent = "Server error";
  }
});

// =====================
// NAVIGATION
// =====================
const links = document.querySelectorAll("[data-section]");

const sections = {
  dashboard: document.getElementById("dashboard-section"),
  products: document.querySelector(".products-section"),
  orders: document.getElementById("orders-section")
};

links.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();

    const sectionName = link.dataset.section;

    Object.values(sections).forEach((s) => s.classList.add("hidden"));

    if (sectionName === "orders") {
      window.showOrders?.();
      return;
    }

    if (sectionName === "products") {
      sections.dashboard?.classList.remove("hidden");
      sections.products?.classList.remove("hidden");
      loadProducts();
      return;
    }

    sections[sectionName]?.classList.remove("hidden");
  });
});
// =====================
// LOAD
// =====================
document.addEventListener("DOMContentLoaded", () => {
  checkAdminAuth();
});