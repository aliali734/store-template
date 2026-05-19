let products    = [];
let cart        = JSON.parse(localStorage.getItem("cart")) || [];
let currentPage = 1;
let totalPages  = 1;

// getCsrfToken, forceLogout, and resolveImageUrl are defined in config.js
// and available globally — no local copies needed here.

// =====================
// HTML ESCAPE
// =====================
function escapeHtml(str) {
  return String(str == null ? "" : str)
    .replace(/&/g,  "&amp;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;")
    .replace(/"/g,  "&quot;")
    .replace(/'/g,  "&#39;");
}

// =====================
// API FETCH WRAPPER
// =====================
async function shopApiFetch(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const csrfToken  = await getCsrfToken();

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
// Uses /auth/me — a permanent, production-safe endpoint — instead of
// /test/user which is only mounted in development (fix #4).
// =====================
(async function protectPage() {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      credentials: "include"
    });

    if (!res.ok) {
      throw new Error("Session invalid");
    }
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
  toast.className   = `toast ${type}`;
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 50);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// =====================
// SKELETON LOADING
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

// =====================
// LOAD PRODUCTS
// =====================
async function loadProducts(page = 1) {
  showProductsSkeleton();

  try {
    const query = buildFilterQuery(page, 9);
    const data  = await apiFetch(`/product?${query}`);

    products    = data.products   || [];
    currentPage = data.page       || 1;
    totalPages  = data.totalPages || 1;

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
let cachedCardTemplate = null;

async function renderProducts() {
  const container = document.getElementById("products");
  if (!container) return;

  container.innerHTML = "";

  if (!cachedCardTemplate) {
    try {
      const res          = await fetch("product-card.html");
      cachedCardTemplate = await res.text();
    } catch (err) {
      console.error("Failed to load product template:", err);
      container.innerHTML = "<p>Template error</p>";
      return;
    }
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

    const cardHTML = cachedCardTemplate
      .replace(/{{_id}}/g,      escapeHtml(product._id))
      .replace(/{{image}}/g,    imageUrl)
      .replace(/{{name}}/g,     escapeHtml(product.name     || ""))
      .replace(/{{category}}/g, escapeHtml(product.category || ""))
      .replace(/{{price}}/g,    Number(product.price ?? 0));

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

      const id      = card.dataset.id;
      const product = products.find((p) => p._id === id);
      if (!product) return;

      const existing = cart.find((item) => item.id === product._id);

      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({
          id:       product._id,
          name:     product.name  || "Product",
          price:    Number(product.price) || 0,
          quantity: 1
        });
      }

      localStorage.setItem("cart", JSON.stringify(cart));

      if (typeof updateHeaderCartCounter === "function") {
        updateHeaderCartCounter();
      }

      if (typeof renderHeaderCartModal === "function") {
        renderHeaderCartModal();
      }

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
    btn.disabled    = i === currentPage;

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
  const toggleFilters = document.getElementById("toggle-filters");
  const aside         = document.getElementById("filters");

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