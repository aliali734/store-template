let products = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];

let currentPage = 1;
let totalPages = 1;

let cachedCardTemplate = null;

// =====================
// HTML ESCAPE
// =====================
function escapeHtml(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// =====================
// API FETCH WRAPPER
// =====================
async function shopApiFetch(path, options = {}) {
  const isFormData = options.body instanceof FormData;

  let csrfToken = null;

  try {
    csrfToken = await getCsrfToken();
  } catch (err) {
    console.error("CSRF token error:", err);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method || "GET",

    credentials: "include",

    headers: {
      ...(!isFormData
        ? { "Content-Type": "application/json" }
        : {}),

      ...(csrfToken
        ? { "x-csrf-token": csrfToken }
        : {}),

      ...(options.headers || {})
    },

    body: options.body || null
  });

  if (response.status === 401 || response.status === 403) {
    alert("Your session has expired. Please login again.");

    window.location.href = "login.html";

    throw new Error("Unauthorized");
  }

  return response;
}

// =====================
// PROTECT PAGE
// =====================
async function protectPage() {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      method: "GET",
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
}

// =====================
// TOAST
// =====================
function showToast(message, type = "success") {
  const toast = document.createElement("div");

  toast.className = `toast ${type}`;
  toast.textContent = message;

  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  setTimeout(() => {
    toast.classList.remove("show");

    setTimeout(() => {
      toast.remove();
    }, 300);

  }, 2200);
}

// =====================
// SKELETON LOADING
// =====================
function showProductsSkeleton() {
  const container = document.getElementById("products-grid");

  if (!container) return;

  container.innerHTML = Array(8)
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

    const res = await shopApiFetch(
      `/product?${query}`
    );

    if (!res.ok) {
      throw new Error("Failed to load products");
    }

    const data = await res.json();

    products = data.products || [];

    currentPage = data.page || 1;
    totalPages = data.totalPages || 1;

    updateProductCount(
      data.totalProducts || 0
    );

    await renderProducts();

  } catch (err) {
    console.error(err);

    const container =
      document.getElementById("products-grid");

    if (container) {
      container.innerHTML = `
        <p class="error-text">
          Failed to load products
        </p>
      `;
    }
  }
}

// =====================
// UPDATE PRODUCT COUNT
// =====================
function updateProductCount(total) {
  const el = document.getElementById(
    "product-count-display"
  );

  if (!el) return;

  el.textContent =
    `Showing ${total} product${total !== 1 ? "s" : ""}`;
}

// =====================
// RENDER PRODUCTS
// =====================
async function renderProducts() {
  const container =
    document.getElementById("products-grid");

  if (!container) return;

  container.innerHTML = "";

  // =====================
  // LOAD CARD TEMPLATE
  // =====================
  if (!cachedCardTemplate) {
    try {
      const res = await fetch(
        "product-card.html"
      );

      cachedCardTemplate =
        await res.text();

    } catch (err) {
      console.error(
        "Template loading failed:",
        err
      );

      container.innerHTML = `
        <p>Template error</p>
      `;

      return;
    }
  }

  // =====================
  // EMPTY STATE
  // =====================
  if (!products.length) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No products found</h3>
        <p>Try adjusting filters.</p>
      </div>
    `;

    return;
  }

  // =====================
  // BUILD GRID
  // =====================
  const fragment =
    document.createDocumentFragment();

  products.forEach((product) => {
    const firstImage =
      Array.isArray(product.images)
        ? product.images[0]
        : product.images || "";

    const imageUrl =
      resolveImageUrl(firstImage);

    const cardHTML =
      cachedCardTemplate
        .replace(
          /{{_id}}/g,
          escapeHtml(product._id)
        )
        .replace(
          /{{image}}/g,
          imageUrl
        )
        .replace(
          /{{name}}/g,
          escapeHtml(product.name || "")
        )
        .replace(
          /{{category}}/g,
          escapeHtml(product.category || "")
        )
        .replace(
          /{{price}}/g,
          Number(product.price || 0)
        );

    const wrapper =
      document.createElement("div");

    wrapper.innerHTML = cardHTML;

    if (wrapper.firstElementChild) {
      fragment.appendChild(
        wrapper.firstElementChild
      );
    }
  });

  container.appendChild(fragment);

  initAddToCart();
}

// =====================
// ADD TO CART
// =====================
function initAddToCart() {
  const buttons = document.querySelectorAll(
    ".add-to-cart-btn"
  );

  buttons.forEach((btn) => {
    btn.onclick = (e) => {
      e.preventDefault();

      e.stopPropagation();

      const card =
        btn.closest(".product-card");

      if (!card) return;

      const id = card.dataset.id;

      const product = products.find(
        (p) => p._id === id
      );

      if (!product) return;

      const existing = cart.find(
        (item) =>
          item.id === product._id
      );

      if (existing) {
        existing.quantity += 1;

      } else {
        cart.push({
          id: product._id,
          name: product.name,
          price: Number(product.price),
          quantity: 1
        });
      }

      localStorage.setItem(
        "cart",
        JSON.stringify(cart)
      );

      if (
        typeof updateHeaderCartCounter ===
        "function"
      ) {
        updateHeaderCartCounter();
      }

      if (
        typeof renderHeaderCartModal ===
        "function"
      ) {
        renderHeaderCartModal();
      }

      showToast("Added to cart");
    };
  });
}

// =====================
// INITIALIZATION
// =====================
document.addEventListener(
  "DOMContentLoaded",
  async () => {
    await protectPage();

    applyUrlFilters();

    await loadFilterTaxonomy();

    syncFilterInputsFromState();

    setupFilters(() => {
      loadProducts(1);
    });

    loadProducts(1);
  }
);