// =====================================================
// HEADER — injected into every page via <div id="header">
// Loads header.html, populates logo + mega menu from
// /api/header, manages cart state and auth UI.
// =====================================================

// =====================
// INJECT HEADER HTML
// =====================
async function loadHeader() {
  const headerEl = document.getElementById("header");
  if (!headerEl) return;

  try {
    const res  = await fetch("header.html");
    const html = await res.text();
    headerEl.innerHTML = html;
  } catch (err) {
    console.error("Failed to load header.html:", err);
    return;
  }

  // Initialise all header subsystems after the HTML is in the DOM.
  setupHeaderLogo();
  setupHeaderMenu();
  setupMobileMenu();
  setupSearchToggle();
  setupCartModal();
  setupHeaderAuth();

  // Apply store settings (footer text, socials, page title).
  try {
    const data = await getStoreSettings();
    if (data?.settings) applyStoreSettingsToUI(data.settings);
  } catch (err) {
    console.error("Failed to apply store settings:", err);
  }
}

// =====================
// LOGO
// =====================
async function setupHeaderLogo() {
  try {
    const res    = await fetch(`${API_BASE}/header`);
    const data   = await res.json().catch(() => ({}));
    const logoEl = document.getElementById("site-logo-text");

    if (!logoEl) return;

    if (data.success && data.header?.logo) {
      logoEl.innerHTML = `<img src="${data.header.logo}" alt="Logo" style="max-height:48px; width:auto;" />`;
    }
  } catch (err) {
    console.error("Logo load failed:", err);
  }
}

// =====================
// MEGA MENU
// =====================
async function setupHeaderMenu() {
  try {
    const res  = await fetch(`${API_BASE}/header`);
    const data = await res.json().catch(() => ({}));

    if (!data.success || !Array.isArray(data.header?.menu)) return;

    buildDesktopMenu(data.header.menu);
    buildMobileMenu(data.header.menu);
  } catch (err) {
    console.error("Menu load failed:", err);
  }
}

function buildDesktopMenu(menu) {
  const desktopMenu = document.getElementById("desktop-menu");
  if (!desktopMenu) return;

  desktopMenu.innerHTML = "";

  menu.forEach((item) => {
    const wrapper = document.createElement("div");
    wrapper.className = "menu-item";

    const trigger = document.createElement("button");
    trigger.className   = "menu-trigger";
    trigger.textContent = item.title;
    trigger.type        = "button";

    wrapper.appendChild(trigger);

    if (item.sections?.length) {
      const dropdown = document.createElement("div");
      dropdown.className = "mega-dropdown";

      item.sections.forEach((section) => {
        const col = document.createElement("div");
        col.className = "mega-col";

        if (section.title) {
          const heading = document.createElement("h4");
          heading.textContent = section.title;
          col.appendChild(heading);
        }

        (section.links || []).forEach((link) => {
          const a = document.createElement("a");
          a.href        = link.url || "#";
          a.textContent = link.label || "";
          col.appendChild(a);
        });

        dropdown.appendChild(col);
      });

      wrapper.appendChild(dropdown);
    }

    desktopMenu.appendChild(wrapper);
  });
}

function buildMobileMenu(menu) {
  const mobileMenu = document.getElementById("mobile-menu");
  if (!mobileMenu) return;

  mobileMenu.innerHTML = "";

  menu.forEach((item) => {
    const section = document.createElement("div");
    section.className = "mobile-section";

    const title = document.createElement("div");
    title.className   = "mobile-section-title";
    title.textContent = item.title;
    section.appendChild(title);

    (item.sections || []).forEach((sub) => {
      (sub.links || []).forEach((link) => {
        const a = document.createElement("a");
        a.href        = link.url || "#";
        a.textContent = link.label || "";
        a.className   = "mobile-link";
        section.appendChild(a);
      });
    });

    mobileMenu.appendChild(section);
  });
}

// =====================
// MOBILE PANEL
// =====================
function setupMobileMenu() {
  const toggle  = document.getElementById("mobile-toggle");
  const close   = document.getElementById("mobile-close");
  const panel   = document.getElementById("mobile-panel");
  const overlay = document.getElementById("mobile-overlay");

  const openPanel = () => {
    panel?.removeAttribute("aria-hidden");
    panel?.classList.add("open");
    overlay?.classList.add("active");
    document.body.style.overflow = "hidden";
  };

  const closePanel = () => {
    panel?.setAttribute("aria-hidden", "true");
    panel?.classList.remove("open");
    overlay?.classList.remove("active");
    document.body.style.overflow = "";
  };

  toggle?.addEventListener("click", openPanel);
  close?.addEventListener("click", closePanel);
  overlay?.addEventListener("click", closePanel);
}

// =====================
// SEARCH TOGGLE
// =====================
function setupSearchToggle() {
  const searchToggle = document.getElementById("search-toggle");
  const searchInput  = document.getElementById("search-input-header");

  if (!searchToggle || !searchInput) return;

  searchToggle.addEventListener("click", () => {
    const isVisible = searchInput.style.display !== "none";
    searchInput.style.display = isVisible ? "none" : "inline-block";
    if (!isVisible) searchInput.focus();
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;

    const query = searchInput.value.trim();
    if (!query) return;

    window.location.href = `shop.html?search=${encodeURIComponent(query)}`;
  });
}

// =====================
// CART MODAL
// =====================
function setupCartModal() {
  updateHeaderCartCounter();
  renderHeaderCartModal();

  const cartWrapper = document.querySelector(".cart-wrapper");
  const cartModal   = document.getElementById("cart-modal");
  const cartClose   = document.getElementById("cart-close");

  // Open cart when the cart button (anywhere in wrapper, not close btn) is clicked
  cartWrapper?.addEventListener("click", (e) => {
    if (e.target.closest("#cart-close")) return;
    const isOpen = cartModal?.classList.contains("active");
    if (!isOpen) {
      cartModal?.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  });

  // Close on close button
  cartClose?.addEventListener("click", () => {
    cartModal?.classList.remove("active");
    document.body.style.overflow = "";
  });

  // Close on backdrop click (outside .cart-content)
  cartModal?.addEventListener("click", (e) => {
    if (!e.target.closest(".cart-content")) {
      cartModal.classList.remove("active");
      document.body.style.overflow = "";
    }
  });

  // Checkout button
  const checkoutBtn = document.getElementById("checkout-btn");
  checkoutBtn?.addEventListener("click", handleCheckout);
}

// =====================
// CART COUNTER
// =====================
function updateHeaderCartCounter() {
  const cartCountEl = document.getElementById("cart-count");
  if (!cartCountEl) return;

  const cart  = getCart();
  const total = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
  cartCountEl.textContent = total;
}

window.updateHeaderCartCounter = updateHeaderCartCounter;

// =====================
// RENDER CART MODAL
// =====================
function renderHeaderCartModal() {
  const listEl  = document.getElementById("cart-items-list");
  const totalEl = document.getElementById("cart-total");

  if (!listEl) return;

  const cart = getCart();
  listEl.innerHTML = "";

  if (!cart.length) {
    listEl.innerHTML = '<li style="color:#6b7280;padding:8px 0;">Your cart is empty.</li>';
    if (totalEl) totalEl.textContent = "$0.00";
    return;
  }

  let total = 0;

  cart.forEach((item, index) => {
    total += (item.price || 0) * (item.quantity || 1);

    const li = document.createElement("li");
    li.style.cssText = "display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #e5e7eb;gap:8px;";

    const info = document.createElement("span");
    info.textContent = `${item.name} × ${item.quantity}`;

    const right = document.createElement("span");
    right.style.cssText = "display:flex;align-items:center;gap:8px;white-space:nowrap;";

    const price = document.createElement("span");
    price.textContent = `$${((item.price || 0) * (item.quantity || 1)).toFixed(2)}`;

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "×";
    removeBtn.style.cssText = "background:none;border:none;color:#9ca3af;cursor:pointer;font-size:16px;padding:0;line-height:1;";
    removeBtn.addEventListener("click", () => {
      removeFromCart(index);
    });

    right.appendChild(price);
    right.appendChild(removeBtn);
    li.appendChild(info);
    li.appendChild(right);
    listEl.appendChild(li);
  });

  if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
}

window.renderHeaderCartModal = renderHeaderCartModal;

// =====================
// CART HELPERS
// =====================
function getCart() {
  try {
    const raw = localStorage.getItem("cart");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function removeFromCart(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
  updateHeaderCartCounter();
  renderHeaderCartModal();
}

// =====================
// CHECKOUT
// =====================
async function handleCheckout() {
  const cart = getCart();

  if (!cart.length) {
    alert("Your cart is empty.");
    return;
  }

  const paymentMethodEl = document.getElementById("payment-method");
  const paymentMethod   = paymentMethodEl?.value || "cash";

  const productsPayload = cart.map((item) => ({
    product:  item.id,
    quantity: item.quantity
  }));

  try {
    const csrfToken = await getCsrfToken();

    // Create order
    const orderRes = await fetch(`${API_BASE}/orders`, {
      method:      "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken ? { "x-csrf-token": csrfToken } : {})
      },
      body: JSON.stringify({ products: productsPayload, paymentMethod })
    });

    const orderData = await orderRes.json().catch(() => ({}));

    if (!orderRes.ok) {
      alert(orderData.message || "Failed to create order.");
      return;
    }

    const order = orderData.order;

    // Create payment record
    const paymentRes = await fetch(`${API_BASE}/payments`, {
      method:      "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken ? { "x-csrf-token": csrfToken } : {})
      },
      body: JSON.stringify({
        orderId:  order._id,
        method:   paymentMethod,
        provider: paymentMethod === "cash" ? "cod" : paymentMethod === "card" ? "stripe" : "tabby", // bnpl
        currency: "SAR"
      })
    });

    const paymentData = await paymentRes.json().catch(() => ({}));

    if (!paymentRes.ok) {
      alert(paymentData.message || "Failed to create payment.");
      return;
    }

    const payment = paymentData.payment;

    // Cash on delivery — go straight to confirmation
    if (paymentMethod === "cash") {
      localStorage.setItem("currentOrderId", order._id);
      saveCart([]);
      updateHeaderCartCounter();
      renderHeaderCartModal();
      window.location.href = "confirmation.html";
      return;
    }

    // Card — create Stripe session and redirect
    if (paymentMethod === "card") {
      const stripeRes = await fetch(`${API_BASE}/payments/stripe/create-session`, {
        method:      "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "x-csrf-token": csrfToken } : {})
        },
        body: JSON.stringify({ paymentId: payment._id })
      });

      const stripeData = await stripeRes.json().catch(() => ({}));

      if (!stripeRes.ok || !stripeData.url) {
        alert(stripeData.message || "Failed to start card payment.");
        return;
      }

      localStorage.setItem("currentOrderId", order._id);
      saveCart([]);
      window.location.href = stripeData.url;
      return;
    }

    // BNPL — placeholder
    alert("Buy Now Pay Later integration coming soon. Your order has been recorded.");
  } catch (err) {
    console.error("Checkout error:", err);
    alert("Server error during checkout. Please try again.");
  }
}

// =====================
// AUTH
// Uses /api/auth/me — permanently mounted in production.
// Previously used /api/test/user which is dev-only and was
// causing the session verification issue described in the PDF.
// =====================
async function setupHeaderAuth() {
  const loginLink    = document.getElementById("login-link");
  const registerLink = document.getElementById("register-link");
  const logoutBtn    = document.getElementById("logout-btn");

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      credentials: "include"
    });

    if (res.ok) {
      // Logged in
      if (loginLink)    loginLink.style.display    = "none";
      if (registerLink) registerLink.style.display = "none";
      if (logoutBtn)    logoutBtn.style.display     = "inline-block";
    } else {
      // Not logged in
      if (loginLink)    loginLink.style.display    = "inline-block";
      if (registerLink) registerLink.style.display = "inline-block";
      if (logoutBtn)    logoutBtn.style.display     = "none";
    }
  } catch {
    // Network error — show login links as safe fallback
    if (loginLink)    loginLink.style.display    = "inline-block";
    if (registerLink) registerLink.style.display = "inline-block";
    if (logoutBtn)    logoutBtn.style.display     = "none";
  }

  logoutBtn?.addEventListener("click", async () => {
    try {
      const csrfToken = await getCsrfToken();

      await fetch(`${API_BASE}/auth/logout`, {
        method:      "POST",
        credentials: "include",
        headers: csrfToken ? { "x-csrf-token": csrfToken } : {}
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      window.location.href = "login.html";
    }
  });
}

// =====================
// ADMIN FETCH WRAPPER
// Used by admin panel pages (admin.js, admin-settings.js, etc.)
// =====================
window.adminApiFetch = async function(endpoint, options = {}) {
  const isFormData = options.body instanceof FormData;
  const csrfToken  = await getCsrfToken();

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method:      options.method || "GET",
    credentials: "include",
    headers: {
      ...(!isFormData ? { "Content-Type": "application/json" } : {}),
      ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
      ...(options.headers || {})
    },
    body: options.body
  });

  if (res.status === 401 || res.status === 403) {
    window.location.href = "login.html";
    throw new Error("Unauthorized");
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
};

// =====================
// INIT
// =====================
document.addEventListener("DOMContentLoaded", loadHeader);