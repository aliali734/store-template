// index.js

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
// LOAD HEADER TEMPLATE + DATA
// =====================
async function initHeader() {
  try {
    const res = await fetch("header.html");
    const html = await res.text();

    const headerEl = document.getElementById("header");
    if (!headerEl) return;

    headerEl.innerHTML = html;

    await loadDynamicHeader();

    setupAuthHeader();

    cartCountEl = document.getElementById("cart-count");

    updateCartCounter();
    setupCartModal();
    setupHeaderInteractions();

    applyUrlFilters();
    syncFilterInputsFromState();
    setupFilters();

    const checkoutBtn = document.getElementById("checkout-btn");
    checkoutBtn?.addEventListener("click", checkout);

    loadProducts(1);
  } catch (err) {
    console.error("Failed to initialize header:", err);
  }
}

initHeader();

// =====================
// LOAD HEADER DATA
// =====================
async function loadDynamicHeader() {
  try {
    const data = await apiFetch("/header");

    if (!data.success || !data.header) return;

    const { header } = data;

    renderHeaderLogo(header.logo);
    renderDesktopMenu(header.menu || []);
    renderMobileMenu(header.menu || []);
  } catch (err) {
    console.error("Failed to load dynamic header:", err);
  }
}

// =====================
// RENDER LOGO
// =====================
function renderHeaderLogo(logoPath) {
  const logoText = document.getElementById("site-logo-text");

  if (!logoText) return;

  if (logoPath) {
    logoText.innerHTML =
      `<img src="${SERVER_BASE}${logoPath}" alt="Logo" style="height:40px;object-fit:contain;">`;
  } else {
    logoText.textContent = "Clothing Store";
  }
}

// =====================
// DESKTOP MENU
// =====================
function renderDesktopMenu(menu) {
  const desktopMenu = document.getElementById("desktop-menu");
  if (!desktopMenu) return;

  desktopMenu.innerHTML = "";

  menu.forEach((menuItem) => {
    const sections = Array.isArray(menuItem.sections)
      ? menuItem.sections
      : [];

    if (!sections.length) {
      desktopMenu.insertAdjacentHTML(
        "beforeend",
        `<a class="menu-item" href="#">${menuItem.title}</a>`
      );
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

    desktopMenu.insertAdjacentHTML(
      "beforeend",
      `
      <div class="menu-item">
        ${menuItem.title}
        <div class="mega">
          <div class="mega-inner">
            ${sectionsHtml}
          </div>
        </div>
      </div>
    `
    );
  });
}

// =====================
// MOBILE MENU
// =====================
function renderMobileMenu(menu) {
  const mobileMenu = document.getElementById("mobile-menu");
  if (!mobileMenu) return;

  mobileMenu.innerHTML = "";

  menu.forEach((menuItem) => {
    const links = (menuItem.sections || []).flatMap((section) => section.links || []);

    if (!links.length) {
      mobileMenu.insertAdjacentHTML("beforeend", `<a href="#">${menuItem.title}</a>`);
      return;
    }

    const linksHtml = links
      .map((link) => `<a href="${link.url || "#"}">${link.label || ""}</a>`)
      .join("");

    mobileMenu.insertAdjacentHTML(
      "beforeend",
      `
      <div class="mobile-item">
        <button type="button" class="mobile-toggle-sub">${menuItem.title} ▾</button>
        <div class="mobile-submenu">
          ${linksHtml}
        </div>
      </div>
    `
    );
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
    if (!mobilePanel) return;
    mobilePanel.setAttribute("aria-hidden", "false");
  });

  mobileClose?.addEventListener("click", () => {
    if (!mobilePanel) return;
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

    const isHidden =
      headerSearch.style.display === "none" || !headerSearch.style.display;

    headerSearch.style.display = isHidden ? "inline-block" : "none";

    if (isHidden) headerSearch.focus();
  });

  headerSearch?.addEventListener(
    "input",
    debounce((e) => {
      filters.search = e.target.value;

      if (pageSearch) pageSearch.value = e.target.value;

      updateFiltersURL();
      loadProducts(1);
    })
  );
}

// =====================
// AUTH HEADER
// =====================
function setupAuthHeader() {
  const loginLink = document.getElementById("login-link");
  const registerLink = document.getElementById("register-link");
  const logoutBtn = document.getElementById("logout-btn");

  if (!loginLink || !registerLink || !logoutBtn) return;

  loginLink.style.display = "none";
  registerLink.style.display = "none";
  logoutBtn.style.display = "inline-flex";

  logoutBtn.onclick = forceLogout;
}

// =====================
// CART
// =====================
function updateCartCounter() {
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
  const cartBtn = document.querySelector(".cart-wrapper button");
  const modal = document.getElementById("cart-modal");
  const closeBtn = document.getElementById("cart-close");

  if (!modal) return;

  cartBtn?.addEventListener("click", () => {
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

  container.innerHTML = Array(9).fill(`
    <div class="product-skeleton">
      <div class="img"></div>
      <div class="line"></div>
      <div class="line short"></div>
    </div>
  `).join("");
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

    const imageUrl = firstImage
      ? `${SERVER_BASE}${firstImage}`
      : "https://via.placeholder.com/300";

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
// APPLY URL FILTERS
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

// =====================
// SYNC FILTER INPUTS
// =====================
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
// FILTERS
// =====================
function debounce(fn, delay = 400) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

function updateFiltersURL() {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });

  const newUrl =
    window.location.pathname +
    (params.toString() ? `?${params.toString()}` : "");

  window.history.replaceState(null, "", newUrl);
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

      updateFiltersURL();
      loadProducts(1);
    })
  );

  categoryInput?.addEventListener("change", (e) => {
    filters.category = e.target.value;
    updateFiltersURL();
    loadProducts(1);
  });

  audienceInput?.addEventListener("change", (e) => {
    filters.audience = e.target.value;
    updateFiltersURL();
    loadProducts(1);
  });

  sizeInput?.addEventListener("change", (e) => {
    filters.size = e.target.value;
    updateFiltersURL();
    loadProducts(1);
  });

  colorInput?.addEventListener("change", (e) => {
    filters.color = e.target.value;
    updateFiltersURL();
    loadProducts(1);
  });

  minInput?.addEventListener(
    "input",
    debounce((e) => {
      filters.priceMin = e.target.value;
      updateFiltersURL();
      loadProducts(1);
    })
  );

  maxInput?.addEventListener(
    "input",
    debounce((e) => {
      filters.priceMax = e.target.value;
      updateFiltersURL();
      loadProducts(1);
    })
  );

  inStockInput?.addEventListener("change", (e) => {
    filters.inStock = e.target.checked ? "true" : "";
    updateFiltersURL();
    loadProducts(1);
  });

  featuredInput?.addEventListener("change", (e) => {
    filters.featured = e.target.checked ? "true" : "";
    updateFiltersURL();
    loadProducts(1);
  });

  sortInput?.addEventListener("change", (e) => {
    filters.sort = e.target.value;
    updateFiltersURL();
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

    updateFiltersURL();
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

  showToast("Placing your order...", "info");

  const productsPayload = cart.map((item) => ({
    product: item.id,
    quantity: item.quantity
  }));

  try {
    const res = await shopApiFetch("/orders", {
      method: "POST",
      body: JSON.stringify({ products: productsPayload })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.order?._id) {
      showToast(data.message || "Order creation failed", "error");
      return;
    }

    localStorage.setItem("currentOrderId", data.order._id);

    cart = [];
    saveCart();

    window.location.href = "confirmation.html";
  } catch (err) {
    console.error(err);
    showToast("Server error", "error");
  }
}

// =====================
// INIT
// =====================
document.addEventListener("DOMContentLoaded", () => {
  const toggleFilters = document.getElementById("toggle-filters");
  const aside = document.getElementById("filters");

  toggleFilters?.addEventListener("click", () => {
    if (!aside) return;

    const hidden = aside.style.display === "none";
    aside.style.display = hidden ? "" : "none";
  });
});