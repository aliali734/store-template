// js/user.js ✅ COD + Cookie Auth + Dynamic Header + Professional Filters

const API_BASE = "http://127.0.0.1:5000/api";
const SERVER_BASE = "http://127.0.0.1:5000";

let products = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let currentPage = 1;
let totalPages = 1;

let filters = {
  search: "",
  category: "",
  audience: "",
  size: "",
  color: "",
  priceMin: "",
  priceMax: "",
  inStock: "",
  featured: "",
  sort: "newest"
};

let cartCountEl;

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
// FORCE LOGOUT
// =====================
async function forceLogout() {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: { ...csrfHeaders() }
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
async function apiFetch(path, options = {}) {
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
// PROTECT USER PAGE
// =====================
(async function protectPage() {
  try {
    const res = await apiFetch("/test/user");
    if (res.ok) {
      console.log("✅ Token verified with backend");
    }
  } catch (err) {
    console.error("Server/network error while verifying session:", err);
    alert("Server is unavailable. Please try again.");
  }
})();

// =====================
// TOAST
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
// LOAD HEADER TEMPLATE + DATA
// =====================
fetch("header.html")
  .then((res) => res.text())
  .then(async (html) => {
    document.getElementById("header").innerHTML = html;

    await loadDynamicHeader();

    setupAuthHeader();

    cartCountEl = document.getElementById("cart-count");
    updateCartCounter();
    setupCartModal();
    setupHeaderInteractions();
    setupFilters();

    applyUrlFilters();
    syncFilterInputsFromState();

    const checkoutBtn = document.getElementById("checkout-btn");
    checkoutBtn?.addEventListener("click", checkout);

    loadProducts(1);
  });

async function loadDynamicHeader() {
  try {
    const res = await fetch(`${API_BASE}/header`);
    const data = await res.json();

    if (!res.ok || !data.success || !data.header) {
      return;
    }

    const { header } = data;

    renderHeaderLogo(header.logo);
    renderDesktopMenu(header.menu || []);
    renderMobileMenu(header.menu || []);
  } catch (err) {
    console.error("Failed to load dynamic header:", err);
  }
}

function renderHeaderLogo(logoPath) {
  const logoLink = document.getElementById("site-logo-link");
  const logoText = document.getElementById("site-logo-text");

  if (!logoLink || !logoText) return;

  if (logoPath) {
    logoText.innerHTML = `<img src="${SERVER_BASE}${logoPath}" alt="Logo" style="height:40px; object-fit:contain;">`;
  } else {
    logoText.textContent = "Clothing Store";
  }
}

function renderDesktopMenu(menu) {
  const desktopMenu = document.getElementById("desktop-menu");
  if (!desktopMenu) return;

  desktopMenu.innerHTML = "";

  menu.forEach((menuItem) => {
    const sections = Array.isArray(menuItem.sections) ? menuItem.sections : [];

    if (!sections.length) {
      desktopMenu.innerHTML += `
        <a class="menu-item" href="#">${menuItem.title}</a>
      `;
      return;
    }

    const sectionsHtml = sections
      .map((section) => {
        const linksHtml = (section.links || [])
          .map((link) => `<a href="${link.url || "#"}">${link.label || ""}</a>`)
          .join("");

        return `
          <div>
            <h4>${section.title || ""}</h4>
            ${linksHtml}
          </div>
        `;
      })
      .join("");

    desktopMenu.innerHTML += `
      <div class="menu-item">
        ${menuItem.title}
        <div class="mega">
          <div class="mega-inner">
            ${sectionsHtml}
          </div>
        </div>
      </div>
    `;
  });
}

function renderMobileMenu(menu) {
  const mobileMenu = document.getElementById("mobile-menu");
  if (!mobileMenu) return;

  mobileMenu.innerHTML = "";

  menu.forEach((menuItem) => {
    const links = (menuItem.sections || []).flatMap((section) => section.links || []);

    if (!links.length) {
      mobileMenu.innerHTML += `<a href="#">${menuItem.title}</a>`;
      return;
    }

    const linksHtml = links
      .map((link) => `<a href="${link.url || "#"}">${link.label || ""}</a>`)
      .join("");

    mobileMenu.innerHTML += `
      <div class="mobile-item">
        <button class="mobile-toggle-sub">${menuItem.title} ▾</button>
        <div class="mobile-submenu">
          ${linksHtml}
        </div>
      </div>
    `;
  });
}

// =====================
// HEADER INTERACTIONS
// =====================
function setupHeaderInteractions() {
  const mobileToggle = document.getElementById("mobile-toggle");
  const mobileClose = document.getElementById("mobile-close");
  const mobilePanel = document.getElementById("mobile-panel");
  const searchToggle = document.getElementById("search-toggle");
  const headerSearch = document.getElementById("search-input-header");
  const pageSearch = document.getElementById("search-input");

  mobileToggle?.addEventListener("click", () => {
    mobilePanel.style.display = "block";
    mobilePanel.setAttribute("aria-hidden", "false");
  });

  mobileClose?.addEventListener("click", () => {
    mobilePanel.style.display = "none";
    mobilePanel.setAttribute("aria-hidden", "true");
  });

  document.querySelectorAll(".mobile-toggle-sub").forEach((btn) => {
    btn.addEventListener("click", () => {
      const submenu = btn.nextElementSibling;
      if (!submenu) return;

      const isOpen = submenu.style.display === "block";
      submenu.style.display = isOpen ? "none" : "block";
    });
  });

  searchToggle?.addEventListener("click", () => {
    if (!headerSearch) return;
    const isHidden = headerSearch.style.display === "none" || !headerSearch.style.display;
    headerSearch.style.display = isHidden ? "inline-block" : "none";
    if (isHidden) headerSearch.focus();
  });

  headerSearch?.addEventListener(
    "input",
    debounce((e) => {
      filters.search = e.target.value;
      if (pageSearch) pageSearch.value = e.target.value;
      loadProducts(1);
    })
  );
}

function setupAuthHeader() {
  const loginLink = document.getElementById("login-link");
  const registerLink = document.getElementById("register-link");
  const logoutBtn = document.getElementById("logout-btn");

  if (!loginLink || !registerLink || !logoutBtn) return;

  loginLink.style.display = "none";
  registerLink.style.display = "none";
  logoutBtn.style.display = "inline-flex";

  logoutBtn.onclick = () => forceLogout();
}

// =====================
// CART
// =====================
function updateCartCounter() {
  if (!cartCountEl) return;
  const count = cart.reduce((sum, i) => sum + i.quantity, 0);
  cartCountEl.textContent = count;
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCounter();
  renderCartModal();
}

function setupCartModal() {
  const cartBtn = document.querySelector(".cart-wrapper button");
  const modal = document.getElementById("cart-modal");
  const closeBtn = document.getElementById("cart-close");

  cartBtn?.addEventListener("click", () => {
    renderCartModal();
    modal.style.display = "flex";
  });

  closeBtn?.addEventListener("click", () => {
    modal.style.display = "none";
  });

  modal?.addEventListener("click", (e) => {
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
    list.innerHTML = `<li style="justify-content:center; opacity:.7;">Cart is empty</li>`;
    totalEl.textContent = "$0";
    return;
  }

  cart.forEach((item, idx) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${item.name}</span>
      <div>
        <button class="dec" ${item.quantity === 1 ? "disabled" : ""}>-</button>
        <span>${item.quantity}</span>
        <button class="inc">+</button>
      </div>
      <span>$${(item.price * item.quantity).toFixed(2)}</span>
    `;

    li.querySelector(".inc").onclick = () => {
      item.quantity++;
      saveCart();
    };

    li.querySelector(".dec").onclick = () => {
      item.quantity--;
      if (item.quantity <= 0) cart.splice(idx, 1);
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
    const query = new URLSearchParams({
      page,
      limit: 9,
      search: filters.search || "",
      category: filters.category || "",
      audience: filters.audience || "",
      size: filters.size || "",
      color: filters.color || "",
      priceMin: filters.priceMin || "",
      priceMax: filters.priceMax || "",
      inStock: filters.inStock || "",
      featured: filters.featured || "",
      sort: filters.sort || "newest"
    });

    const res = await apiFetch(`/product?${query}`);
    if (!res.ok) throw new Error("Failed to load products");

    const data = await res.json();
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
      container.innerHTML = `<p style="color:red">❌ Failed to load products</p>`;
    }
  }
}

function updateTitle(total) {
  const title = document.querySelector(".title");
  if (!title) return;
  title.textContent = `Products (${total})`;
}

async function renderProducts() {
  const container = document.getElementById("products");
  if (!container) return;

  const template = await fetch("product-card.html").then((r) => r.text());

  container.innerHTML = "";

  if (!products.length) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No products found 😕</h3>
        <p>Try changing filters or search</p>
      </div>
    `;
    return;
  }

  products.forEach((product) => {
    const firstImage = Array.isArray(product.images)
      ? product.images[0]
      : product.images || "";

    const imageUrl = firstImage
      ? `${SERVER_BASE}${firstImage}`
      : "https://via.placeholder.com/300";

    const card = template
      .replace(/{{_id}}/g, product._id)
      .replace(/{{image}}/g, imageUrl)
      .replace(/{{name}}/g, product.name || "")
      .replace(/{{category}}/g, product.category || "")
      .replace(/{{price}}/g, product.price ?? 0);

    container.innerHTML += card;
  });

  initAddToCart();
}

// =====================
// ADD TO CART
// =====================

function applyUrlFilters() {
  const params = new URLSearchParams(window.location.search);

  filters.search = params.get("search") || "";
  filters.category = params.get("category") || "";
  filters.audience = params.get("audience") || "";
  filters.size = params.get("size") || "";
  filters.color = params.get("color") || "";
  filters.priceMin = params.get("priceMin") || "";
  filters.priceMax = params.get("priceMax") || "";
  filters.inStock = params.get("inStock") || "";
  filters.featured = params.get("featured") || "";
  filters.sort = params.get("sort") || "newest";
}

function syncFilterInputsFromState() {
  const searchInput = document.getElementById("search-input");
  const headerSearch = document.getElementById("search-input-header");
  const categoryInput = document.getElementById("filter-category");
  const audienceInput = document.getElementById("filter-audience");
  const sizeInput = document.getElementById("filter-size");
  const colorInput = document.getElementById("filter-color");
  const minInput = document.getElementById("filter-minPrice");
  const maxInput = document.getElementById("filter-maxPrice");
  const inStockInput = document.getElementById("filter-inStock");
  const featuredInput = document.getElementById("filter-featured");
  const sortInput = document.getElementById("filter-sort");

  if (searchInput) searchInput.value = filters.search;
  if (headerSearch) headerSearch.value = filters.search;
  if (categoryInput) categoryInput.value = filters.category;
  if (audienceInput) audienceInput.value = filters.audience;
  if (sizeInput) sizeInput.value = filters.size;
  if (colorInput) colorInput.value = filters.color;
  if (minInput) minInput.value = filters.priceMin;
  if (maxInput) maxInput.value = filters.priceMax;
  if (inStockInput) inStockInput.checked = filters.inStock === "true";
  if (featuredInput) featuredInput.checked = filters.featured === "true";
  if (sortInput) sortInput.value = filters.sort;
}

// =====================
// ADD TO CART
// =====================
function initAddToCart() {
  document.querySelectorAll(".add-to-cart-btn").forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      e.preventDefault();

      const id = btn.closest(".product-card")?.dataset?.id;
      const product = products.find((p) => p._id === id);
      if (!product) return;

      const existing = cart.find((i) => i.id === product._id);
      if (existing) existing.quantity++;
      else {
        cart.push({
          id: product._id,
          name: product.name,
          price: Number(product.price) || 0,
          quantity: 1
        });
      }

      saveCart();
      showToast("🛒 Added to cart");
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

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.disabled = i === currentPage;
    btn.onclick = () => loadProducts(i);
    container.appendChild(btn);
  }
}

// =====================
// FILTERS
// =====================
function debounce(fn, delay = 400) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

function setupFilters() {
  const searchInput = document.getElementById("search-input");
  const headerSearch = document.getElementById("search-input-header");
  const categoryInput = document.getElementById("filter-category");
  const audienceInput = document.getElementById("filter-audience");
  const sizeInput = document.getElementById("filter-size");
  const colorInput = document.getElementById("filter-color");
  const minInput = document.getElementById("filter-minPrice");
  const maxInput = document.getElementById("filter-maxPrice");
  const inStockInput = document.getElementById("filter-inStock");
  const featuredInput = document.getElementById("filter-featured");
  const sortInput = document.getElementById("filter-sort");
  const resetBtn = document.getElementById("reset-filters");

  searchInput?.addEventListener(
    "input",
    debounce((e) => {
      filters.search = e.target.value;
      if (headerSearch) headerSearch.value = e.target.value;
      loadProducts(1);
    })
  );

  categoryInput?.addEventListener("change", (e) => {
    filters.category = e.target.value;
    loadProducts(1);
  });

  audienceInput?.addEventListener("change", (e) => {
    filters.audience = e.target.value;
    loadProducts(1);
  });

  sizeInput?.addEventListener("change", (e) => {
    filters.size = e.target.value;
    loadProducts(1);
  });

  colorInput?.addEventListener("change", (e) => {
    filters.color = e.target.value;
    loadProducts(1);
  });

  minInput?.addEventListener(
    "input",
    debounce((e) => {
      filters.priceMin = e.target.value;
      loadProducts(1);
    })
  );

  maxInput?.addEventListener(
    "input",
    debounce((e) => {
      filters.priceMax = e.target.value;
      loadProducts(1);
    })
  );

  inStockInput?.addEventListener("change", (e) => {
    filters.inStock = e.target.checked ? "true" : "";
    loadProducts(1);
  });

  featuredInput?.addEventListener("change", (e) => {
    filters.featured = e.target.checked ? "true" : "";
    loadProducts(1);
  });

  sortInput?.addEventListener("change", (e) => {
    filters.sort = e.target.value;
    loadProducts(1);
  });

  resetBtn?.addEventListener("click", () => {
    filters = {
      search: "",
      category: "",
      audience: "",
      size: "",
      color: "",
      priceMin: "",
      priceMax: "",
      inStock: "",
      featured: "",
      sort: "newest"
    };

    if (searchInput) searchInput.value = "";
    if (headerSearch) headerSearch.value = "";
    if (categoryInput) categoryInput.value = "";
    if (audienceInput) audienceInput.value = "";
    if (sizeInput) sizeInput.value = "";
    if (colorInput) colorInput.value = "";
    if (minInput) minInput.value = "";
    if (maxInput) maxInput.value = "";
    if (inStockInput) inStockInput.checked = false;
    if (featuredInput) featuredInput.checked = false;
    if (sortInput) sortInput.value = "newest";

    loadProducts(1);
  });
}

// =====================
// CHECKOUT
// =====================
async function checkout() {
  if (!cart.length) {
    alert("Cart is empty");
    return;
  }

  showToast("⏳ Placing your order...", "info");

  const productsPayload = cart.map((item) => ({
    product: item.id,
    quantity: item.quantity
  }));

  try {
    const res = await apiFetch("/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...csrfHeaders()
      },
      body: JSON.stringify({ products: productsPayload })
    });

    const data = await res.json();

    if (!res.ok || !data.order?._id) {
      showToast(data.message || "❌ Order creation failed", "error");
      return;
    }

    localStorage.setItem("currentOrderId", data.order._id);

    cart = [];
    saveCart();

    window.location.href = "confirmation.html";
  } catch (err) {
    console.error(err);
    showToast("❌ Server error", "error");
  }
}

// =====================
// INIT
// =====================
document.addEventListener("DOMContentLoaded", () => loadProducts());

document.getElementById("toggle-filters")?.addEventListener("click", () => {
  const aside = document.getElementById("filters");
  if (!aside) return;
  const hidden = aside.style.display === "none";
  aside.style.display = hidden ? "" : "none";
});

document.addEventListener("DOMContentLoaded", () => loadProducts());

document.addEventListener("DOMContentLoaded", () => {});