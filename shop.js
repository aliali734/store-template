// =====================================================
// SHOP PAGE — Premium Storefront Logic
// FIXED VERSION
// Only fixes authentication/session issue.
// UI/UX architecture remains untouched.
// =====================================================

// resolveImageUrl is provided globally by config.js

// =====================================================
// STATE
// =====================================================
let allProducts = [];
let filteredProducts = [];
let activeCategory = "all";

// =====================================================
// ELEMENTS
// =====================================================
const productsGrid        = document.getElementById("products-grid");
const productCountDisplay = document.getElementById("product-count-display");
const sortSelect          = document.getElementById("sort-products");
const filterButtons       = document.querySelectorAll(".filter-btn");

// =====================================================
// AUTH SESSION CHECK
// FIX:
// Previously many implementations relied on:
//   /api/test/user
// which breaks in production.
//
// We now use:
//   /api/auth/me
// which is permanently mounted.
// =====================================================
async function verifySession() {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      credentials: "include"
    });

    if (!res.ok) {
      return false;
    }

    const data = await res.json();
    return !!data.success;

  } catch (err) {
    console.error("Session verification failed:", err);
    return false;
  }
}

// =====================================================
// FETCH PRODUCTS
// =====================================================
async function fetchProducts() {
  try {
    const response = await fetch(`${API_BASE}/product`);
    const data     = await response.json();

    if (!data.success || !Array.isArray(data.products)) {
      throw new Error("Invalid products response");
    }

    allProducts = data.products;
    filteredProducts = [...allProducts];

    renderProducts(filteredProducts);
    updateProductCount();

  } catch (err) {
    console.error("Failed to fetch products:", err);

    if (productsGrid) {
      productsGrid.innerHTML = `
        <div style="
          grid-column:1/-1;
          padding:40px;
          border:1px solid rgba(255,255,255,.08);
          border-radius:8px;
          text-align:center;
          color:#a1a1aa;
          background:rgba(255,255,255,.02);
        ">
          Failed to load products.
        </div>
      `;
    }
  }
}

// =====================================================
// RENDER PRODUCTS
// =====================================================
function renderProducts(products) {
  if (!productsGrid) return;

  if (!products.length) {
    productsGrid.innerHTML = `
      <div style="
        grid-column:1/-1;
        padding:40px;
        border:1px solid rgba(255,255,255,.08);
        border-radius:8px;
        text-align:center;
        color:#a1a1aa;
        background:rgba(255,255,255,.02);
      ">
        No products found.
      </div>
    `;

    return;
  }

  productsGrid.innerHTML = products.map((product) => {
    const image =
      resolveImageUrl(
        product.images?.[0],
        "https://via.placeholder.com/600x800?text=Product"
      );

    const price = Number(product.price || 0).toFixed(2);

    return `
      <article class="product-card">

        <div class="product-image-wrapper">
          <img
            src="${image}"
            alt="${escapeHtml(product.name || "Product")}"
            loading="lazy"
          >

          <button
            class="quick-add-btn"
            data-product-id="${product._id}"
          >
            Add To Bag
          </button>
        </div>

        <div class="product-card-info">
          <span class="product-brand">
            ${escapeHtml(product.brand || "Collection")}
          </span>

          <h3 class="product-title">
            ${escapeHtml(product.name || "Untitled Product")}
          </h3>

          <span class="product-price">
            $${price}
          </span>
        </div>

      </article>
    `;
  }).join("");

  setupAddToCartButtons();
}

// =====================================================
// FILTER PRODUCTS
// =====================================================
function filterProducts(category) {
  activeCategory = category;

  if (category === "all") {
    filteredProducts = [...allProducts];
  } else if (category === "new") {
    filteredProducts = allProducts.filter((p) => p.isNew);
  } else {
    filteredProducts = allProducts.filter((p) => {
      return (
        p.category &&
        p.category.toLowerCase() === category.toLowerCase()
      );
    });
  }

  applySorting();
}

// =====================================================
// SORT PRODUCTS
// =====================================================
function applySorting() {
  const sortValue = sortSelect?.value || "default";

  let sorted = [...filteredProducts];

  if (sortValue === "price-low") {
    sorted.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
  }

  if (sortValue === "price-high") {
    sorted.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
  }

  renderProducts(sorted);
  updateProductCount(sorted.length);
}

// =====================================================
// UPDATE PRODUCT COUNT
// =====================================================
function updateProductCount(count = filteredProducts.length) {
  if (!productCountDisplay) return;

  productCountDisplay.textContent =
    `${count} item${count !== 1 ? "s" : ""} available`;
}

// =====================================================
// ADD TO CART
// =====================================================
function setupAddToCartButtons() {
  const buttons = document.querySelectorAll(".quick-add-btn");

  buttons.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const productId = btn.dataset.productId;

      const product = allProducts.find(
        (p) => String(p._id) === String(productId)
      );

      if (!product) return;

      addToCart(product);
    });
  });
}

// =====================================================
// CART STORAGE
// =====================================================
function getCart() {
  try {
    return JSON.parse(localStorage.getItem("cart")) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

// =====================================================
// ADD ITEM TO CART
// =====================================================
function addToCart(product) {
  const cart = getCart();

  const existing = cart.find(
    (item) => String(item.id) === String(product._id)
  );

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: product._id,
      name: product.name,
      price: Number(product.price || 0),
      image: product.images?.[0] || "",
      quantity: 1
    });
  }

  saveCart(cart);

  // Sync with header cart UI if available
  if (typeof updateHeaderCartCounter === "function") {
    updateHeaderCartCounter();
  }

  if (typeof renderHeaderCartModal === "function") {
    renderHeaderCartModal();
  }

  showToast("Added to cart");
}

// =====================================================
// TOAST
// =====================================================
function showToast(message = "Success") {
  let toast = document.querySelector(".toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast._timer);

  showToast._timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

// =====================================================
// FILTER BUTTONS
// =====================================================
function setupFilters() {
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {

      filterButtons.forEach((b) => {
        b.classList.remove("active");
      });

      btn.classList.add("active");

      const category = btn.dataset.category || "all";
      filterProducts(category);
    });
  });

  sortSelect?.addEventListener("change", applySorting);
}

// =====================================================
// ESCAPE HTML
// =====================================================
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// =====================================================
// INIT
// =====================================================
async function initShopPage() {
  try {

    // FIXED AUTH CHECK
    // Uses production-safe endpoint.
    await verifySession();

    setupFilters();
    await fetchProducts();

  } catch (err) {
    console.error("Shop initialization failed:", err);
  }
}

document.addEventListener("DOMContentLoaded", initShopPage);