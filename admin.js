const productsBody = document.getElementById("productsBody");
const loginSection = document.getElementById("login-section");
const dashboardSection = document.getElementById("dashboard-section");
const loginForm = document.getElementById("login-form");
const loginMessage = document.getElementById("login-message");
const logoutBtn = document.getElementById("logoutBtn");

const form = document.getElementById("product-form");
const messageEl = document.getElementById("message");
const modal = document.getElementById("productModal");
const overlay = document.getElementById("overlay");
const openBtn = document.getElementById("openAddProduct");
const closeBtn = document.getElementById("closeModal");
const modalTitle = document.getElementById("modalTitle");
const submitBtn = document.getElementById("submitBtn");
const productIdInput = document.getElementById("productId");

const nameInput = document.getElementById("name");
const descriptionInput = document.getElementById("description");
const brandInput = document.getElementById("brand");
const departmentInput = document.getElementById("department");
const categoryInput = document.getElementById("category");
const audienceInput = document.getElementById("audience");
const priceInput = document.getElementById("price");
const compareAtPriceInput = document.getElementById("compareAtPrice");
const stockInput = document.getElementById("stock");
const sizesInput = document.getElementById("sizes");
const colorsInput = document.getElementById("colors");
const featuredInput = document.getElementById("featured");
const isActiveInput = document.getElementById("isActive");
const imageInput = document.getElementById("image");

const openHeaderBtn = document.getElementById("openHeaderModal");
const closeHeaderBtn = document.getElementById("closeHeaderModal");
const headerModal = document.getElementById("headerModal");
const headerForm = document.getElementById("header-form");
const headerLogo = document.getElementById("header-logo");
const logoPreview = document.getElementById("logoPreview");
const headerCategories = document.getElementById("header-categories");
const headerMessage = document.getElementById("headerMessage");

let productTaxonomy = {};
let productDepartments = [];

// =====================
// CSRF TOKEN FROM BACKEND
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
// API FETCH FOR ADMIN
// =====================
async function adminApiFetch(path, options = {}) {
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

  return res;
}

window.adminApiFetch = adminApiFetch;

// =====================
// SHOW/HIDE HELPERS
// =====================
function showLogin(msg = "") {
  loginSection?.classList.remove("hidden");
  dashboardSection?.classList.add("hidden");
  document.getElementById("orders-section")?.classList.add("hidden");

  if (loginMessage) {
    loginMessage.textContent = msg;
    loginMessage.style.color = msg ? "#b91c1c" : "";
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
    await getCsrfToken();

    const res = await fetch(`${API_BASE}/test/user`, {
      credentials: "include"
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      showLogin("Please login as admin.");
      return;
    }

    if (data.role !== "admin") {
      showLogin("Access denied. Admins only.");
      return;
    }

    await loadProductTaxonomy();
    showDashboard();
    loadProducts();
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
    loginMessage.style.color = "#b91c1c";
    return;
  }

  loginMessage.textContent = "Logging in...";
  loginMessage.style.color = "#374151";

  try {
    const csrfToken = await getCsrfToken();

    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken ? { "x-csrf-token": csrfToken } : {})
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      loginMessage.textContent = data.message || "Login failed.";
      loginMessage.style.color = "#b91c1c";
      return;
    }

    await checkAdminAuth();
  } catch (err) {
    console.error(err);
    loginMessage.textContent = "Server error.";
    loginMessage.style.color = "#b91c1c";
  }
});

// =====================
// LOGOUT
// =====================
async function adminLogout() {
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
    console.error("Logout failed:", e);
  } finally {
    showLogin("Logged out.");
  }
}

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
// TAXONOMY
// =====================
async function loadProductTaxonomy() {
  try {
    const res = await adminApiFetch("/product/meta/taxonomy");
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to load taxonomy");
    }

    productTaxonomy = data.taxonomy || {};
    productDepartments = data.departments || [];

    populateDepartmentOptions();
  } catch (err) {
    console.error("Failed to load product taxonomy:", err);
  }
}

function populateDepartmentOptions(selectedDepartment = "") {
  if (!departmentInput) return;

  departmentInput.innerHTML = `<option value="">Select department</option>`;

  productDepartments.forEach((department) => {
    const option = document.createElement("option");
    option.value = department;
    option.textContent = capitalizeLabel(department);
    option.selected = department === selectedDepartment;
    departmentInput.appendChild(option);
  });
}

function populateCategoryOptions(department, selectedCategory = "") {
  if (!categoryInput) return;

  categoryInput.innerHTML = `<option value="">Select category</option>`;

  const categories = productTaxonomy[department] || [];

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = humanizeCategory(category);
    option.selected = category === selectedCategory;
    categoryInput.appendChild(option);
  });
}

function capitalizeLabel(value) {
  return String(value || "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function humanizeCategory(value) {
  return capitalizeLabel(value);
}

departmentInput?.addEventListener("change", () => {
  populateCategoryOptions(departmentInput.value);
});

// =====================
// MODAL
// =====================
openBtn?.addEventListener("click", async () => {
  modalTitle.textContent = "Add Product";
  submitBtn.textContent = "Add";
  productIdInput.value = "";
  form.reset();
  messageEl.textContent = "";

  setMultiSelectValues(sizesInput, []);
  setMultiSelectValues(colorsInput, []);

  if (isActiveInput) isActiveInput.checked = true;
  if (featuredInput) featuredInput.checked = false;

  populateDepartmentOptions("");
  populateCategoryOptions("");

  modal.classList.remove("hidden");
  overlay.classList.remove("hidden");
});

closeBtn?.addEventListener("click", closeModal);

overlay?.addEventListener("click", () => {
  closeModal();
  closeHeaderModal();
});

function closeModal() {
  modal?.classList.add("hidden");
  overlay?.classList.add("hidden");
}

function closeHeaderModal() {
  headerModal?.classList.add("hidden");
  overlay?.classList.add("hidden");
}

// =====================
// ADD / EDIT PRODUCT
// =====================
form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  e.stopPropagation();

  const formData = new FormData();
  formData.append("name", nameInput.value);
  formData.append("description", descriptionInput.value);
  formData.append("brand", brandInput.value);
  formData.append("audience", audienceInput.value);
  formData.append("department", departmentInput.value);
  formData.append("category", categoryInput.value);
  formData.append("price", priceInput.value);
  formData.append("compareAtPrice", compareAtPriceInput.value || 0);
  formData.append("stock", stockInput.value);

  const selectedSizes = getMultiSelectValues(sizesInput);
  const selectedColors = getMultiSelectValues(colorsInput);

  formData.append("sizes", selectedSizes.join(","));
  formData.append("colors", selectedColors.join(","));
  formData.append("featured", featuredInput.checked);
  formData.append("isActive", isActiveInput.checked);

  if (imageInput?.files?.length) {
    [...imageInput.files].slice(0, 5).forEach((file) => {
      formData.append("images", file);
    });
  }

  const productId = productIdInput.value;
  const method = productId ? "PUT" : "POST";
  const path = productId ? `/product/${productId}` : `/product`;

  try {
    const res = await adminApiFetch(path, {
      method,
      body: formData
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      messageEl.textContent = data.message || "Error";
      messageEl.style.color = "#b91c1c";
      return;
    }

    messageEl.textContent = "Saved successfully";
    messageEl.style.color = "#166534";

    setTimeout(() => {
      closeModal();
      form.reset();
      populateDepartmentOptions("");
      populateCategoryOptions("");
      setMultiSelectValues(sizesInput, []);
      setMultiSelectValues(colorsInput, []);
      loadProducts();
    }, 600);
  } catch (err) {
    console.error(err);
    messageEl.textContent = "Server error";
    messageEl.style.color = "#b91c1c";
  }
});

// =====================
// LOAD PRODUCTS
// =====================
async function loadProducts() {
  try {
    const data = await apiFetch("/product?limit=100");
    renderProducts(data.products || []);
  } catch (err) {
    console.error("Failed to load products:", err);
  }
}

// =====================
// RENDER PRODUCTS
// =====================
function renderProducts(products) {
  if (!productsBody) return;

  productsBody.innerHTML = "";

  if (!products.length) {
    productsBody.innerHTML =
      `<tr><td colspan="7" style="text-align:center;">No products</td></tr>`;
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
      <td>
        <img src="${imgSrc}" style="width:50px;height:50px;object-fit:cover;border-radius:8px;">
      </td>
      <td>${product.name}</td>
      <td>${product.department || "-"}</td>
      <td>${product.category || "-"}</td>
      <td>$${product.price}</td>
      <td>${product.stock}</td>
      <td class="actions">
        <button type="button" class="btn edit">Edit</button>
        <button type="button" class="btn delete">Delete</button>
      </td>
    `;

    tr.querySelector(".edit")?.addEventListener("click", () => openEditPopup(product));

    tr.querySelector(".delete")?.addEventListener("click", async () => {
      if (!confirm("Delete this product?")) return;

      try {
        const res = await adminApiFetch(`/product/${product._id}`, {
          method: "DELETE"
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          alert(data.message || "Delete failed");
          return;
        }

        loadProducts();
      } catch (err) {
        console.error(err);
        alert("Server error");
      }
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
  nameInput.value = product.name || "";
  descriptionInput.value = product.description || "";
  brandInput.value = product.brand || "";
  audienceInput.value = product.audience || "unisex";
  priceInput.value = product.price ?? "";
  compareAtPriceInput.value = product.compareAtPrice ?? 0;
  stockInput.value = product.stock ?? "";

  populateDepartmentOptions(product.department || "");
  populateCategoryOptions(product.department || "", product.category || "");

  setMultiSelectValues(
    sizesInput,
    Array.isArray(product.sizes) ? product.sizes : []
  );

  setMultiSelectValues(
    colorsInput,
    Array.isArray(product.colors) ? product.colors : []
  );

  featuredInput.checked = !!product.featured;
  isActiveInput.checked = product.isActive !== false;

  modal.classList.remove("hidden");
  overlay.classList.remove("hidden");
}

// =====================
// HEADER MODAL
// =====================
openHeaderBtn?.addEventListener("click", () => {
  headerModal?.classList.remove("hidden");
  overlay?.classList.remove("hidden");
  loadHeaderSettings();
});

closeHeaderBtn?.addEventListener("click", closeHeaderModal);

headerLogo?.addEventListener("change", () => {
  if (headerLogo.files[0]) {
    logoPreview.src = URL.createObjectURL(headerLogo.files[0]);
  }
});

// =====================
// LOAD HEADER SETTINGS
// =====================
async function loadHeaderSettings() {
  try {
    const data = await apiFetch("/header");

    if (data.success) {
      logoPreview.src = data.header.logo
        ? `${SERVER_BASE}${data.header.logo}`
        : "";

      if (headerCategories) {
        headerCategories.value =
          "Mega menu structure is managed from backend defaults / database. Logo can be updated here only.";
        headerCategories.readOnly = true;
        headerCategories.disabled = true;
      }

      if (headerMessage) {
        headerMessage.textContent = "";
      }
    }
  } catch (err) {
    console.error("Failed to load header settings:", err);

    if (headerMessage) {
      headerMessage.textContent = "Failed to load header settings";
      headerMessage.style.color = "#b91c1c";
    }
  }
}

// =====================
// UPDATE HEADER
// Logo only — do not overwrite mega menu
// =====================
headerForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData();

  if (headerLogo?.files?.[0]) {
    formData.append("logo", headerLogo.files[0]);
  }

  try {
    const res = await adminApiFetch("/header", {
      method: "PUT",
      body: formData
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      headerMessage.textContent = data.message || "Error";
      headerMessage.style.color = "#b91c1c";
      return;
    }

    if (data.header?.logo) {
      logoPreview.src = `${SERVER_BASE}${data.header.logo}`;
    }

    headerMessage.textContent = "Header logo updated successfully";
    headerMessage.style.color = "#166534";
  } catch (err) {
    console.error(err);
    headerMessage.textContent = "Server error";
    headerMessage.style.color = "#b91c1c";
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

    Object.values(sections).forEach((s) => s?.classList.add("hidden"));

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