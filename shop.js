let products = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let currentPage = 1;
let totalPages = 1;

// =====================
// LOCAL SAFE DEBOUNCE
// =====================
function safeDebounce(fn, delay = 400) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

// =====================
// IMAGE URL RESOLVER
// Supports both:
// - full Cloudinary URLs
// - old local /uploads/... paths
// =====================
function resolveImageUrl(path, fallback = "https://via.placeholder.com/300") {
  if (!path) return fallback;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SERVER_BASE}${path}`;
}

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
async function shopApiFetch(path, options = {}) {
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
// PROTECT PAGE
// =====================
(async function protectPage() {
  try {
    const res = await fetch(`${API_BASE}/test/user`, {
      credentials: "include"
    });

    if (!res.ok) {
      throw new Error("Session invalid");
    }

    console.log("User session verified");
  } catch (err) {
    console.error("Session verification failed:", err);
    alert("Your session has expired. Please login again.");
    window.location.href = "login.html";
  }
})();

// =====================
// TOAST NOTIFICATION
// =====================
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 50);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// =====================
// CART
// =====================
function updateCartCounter() {
  const cartCountEl = document.getElementById("cart-count");
  if (!cartCountEl) return;

  const count = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
  cartCountEl.textContent = count;
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCounter();
  renderCartModal();
}

function setupCartModal() {
  const cartBtn = document.querySelector(".cart-wrapper .icon-btn");
  const modal = document.getElementById("cart-modal");
  const closeBtn = document.getElementById("cart-close");

  if (!modal) return;

  cartBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    renderCartModal();
    modal.style.display = "flex";
  });

  closeBtn?.addEventListener("click", () => {
    modal.style.display = "none";
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });
}

function renderCartModal() {
  const list = document.getElementById("cart-items-list");
  const totalEl = document.getElementById("cart-total");

  if (!list || !totalEl) return;

  list.innerHTML = "";

  let total = 0;

  if (!cart.length) {
    list.innerHTML =
      `<li style="justify-content:center;opacity:.7;">Cart is empty</li>`;
    totalEl.textContent = "$0";
    return;
  }

  cart.forEach((item, idx) => {
    const li = document.createElement("li");

    li.innerHTML = `
      <span>${item.name}</span>
      <div>
        <button type="button" class="dec" ${item.quantity <= 1 ? "disabled" : ""}>-</button>
        <span>${item.quantity}</span>
        <button type="button" class="inc">+</button>
      </div>
      <span>$${(item.price * item.quantity).toFixed(2)}</span>
    `;

    const incBtn = li.querySelector(".inc");
    const decBtn = li.querySelector(".dec");

    incBtn.onclick = () => {
      item.quantity += 1;
      saveCart();
    };

    decBtn.onclick = () => {
      item.quantity -= 1;

      if (item.quantity <= 0) {
        cart.splice(idx, 1);
      }

      saveCart();
    };

    list.appendChild(li);
    total += item.price * item.quantity;
  });

  totalEl.textContent = `$${total.toFixed(2)}`;
}

// =====================
// PRODUCTS
// =====================
function showProductsSkeleton() {
  const container = document.getElementById("products");
  if (!container) return;

  container.innerHTML = Array(9)
    .fill(`
      <div class="product-skeleton">
        <div class="img"></div>
        <div class="line"></div>
        <div class="line short"></div>
      </div>
    `)
    .join("");
}

async function loadProducts(page = 1) {
  showProductsSkeleton();

  try {
    const query = buildFilterQuery(page, 9);
    const data = await apiFetch(`/product?${query}`);

    products = data.products || [];
    currentPage = data.page || 1;
    totalPages = data.totalPages || 1;

    updateTitle(data.totalProducts || 0);
    await renderProducts();
    renderPagination();
  } catch (err) {
    console.error(err);

    const container = document.getElementById("products");
    if (container) {
      container.innerHTML = `<p style="color:#b91c1c">Failed to load products</p>`;
    }
  }
}

function updateTitle(total) {
  const title = document.querySelector(".title");
  if (!title) return;

  title.textContent = `Products (${total})`;
}

// =====================
// RENDER PRODUCTS
// =====================
async function renderProducts() {
  const container = document.getElementById("products");
  if (!container) return;

  container.innerHTML = "";

  let template = "";

  try {
    const res = await fetch("product-card.html");
    template = await res.text();
  } catch (err) {
    console.error("Failed to load product template:", err);
    container.innerHTML = "<p>Template error</p>";
    return;
  }

  if (!products.length) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No products found</h3>
        <p>Try changing filters or search</p>
      </div>
    `;
    return;
  }

  const fragment = document.createDocumentFragment();

  products.forEach((product) => {
    const firstImage = Array.isArray(product.images)
      ? product.images[0]
      : product.images || "";

    const imageUrl = resolveImageUrl(firstImage);

    const cardHTML = template
      .replace(/{{_id}}/g, product._id)
      .replace(/{{image}}/g, imageUrl)
      .replace(/{{name}}/g, product.name || "")
      .replace(/{{category}}/g, product.category || "")
      .replace(/{{price}}/g, product.price ?? 0);

    const wrapper = document.createElement("div");
    wrapper.innerHTML = cardHTML;

    fragment.appendChild(wrapper.firstElementChild);
  });

  container.appendChild(fragment);
  initAddToCart();
}

// =====================
// ADD TO CART
// =====================
function initAddToCart() {
  const buttons = document.querySelectorAll(".add-to-cart-btn");

  buttons.forEach((btn) => {
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const card = btn.closest(".product-card");
      if (!card) return;

      const id = card.dataset.id;
      const product = products.find((p) => p._id === id);
      if (!product) return;

      const existing = cart.find((item) => item.id === product._id);

      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({
          id: product._id,
          name: product.name || "Product",
          price: Number(product.price) || 0,
          quantity: 1
        });
      }

      saveCart();
      showToast("Added to cart");
    };
  });
}

// =====================
// PAGINATION
// =====================
function renderPagination() {
  const container = document.getElementById("pagination");
  if (!container) return;

  container.innerHTML = "";

  if (totalPages <= 1) return;

  const fragment = document.createDocumentFragment();

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");

    btn.textContent = i;
    btn.disabled = i === currentPage;

    btn.onclick = () => {
      loadProducts(i);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    fragment.appendChild(btn);
  }

  container.appendChild(fragment);
}

// =====================
// INIT
// =====================
document.addEventListener("DOMContentLoaded", () => {
  updateCartCounter();
  setupCartModal();

  const toggleFilters = document.getElementById("toggle-filters");
  const aside = document.getElementById("filters");

  toggleFilters?.addEventListener("click", () => {
    if (!aside) return;

    const hidden = aside.style.display === "none";
    aside.style.display = hidden ? "" : "none";
  });

  applyUrlFilters();
  loadFilterTaxonomy().then(() => {
    syncFilterInputsFromState();
    setupFilters(() => loadProducts(1));
    loadProducts(1);
  });
});