// =====================
// IMAGE URL RESOLVER
// =====================
function resolveHeaderImageUrl(path, fallback = "") {
  if (!path) return fallback;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SERVER_BASE}${path}`;
}

// =====================
// LOAD HEADER TEMPLATE
// =====================
async function loadHeaderTemplate() {
  const headerEl = document.getElementById("header");
  if (!headerEl) return null;

  const res = await fetch("header.html");
  const html = await res.text();
  headerEl.innerHTML = html;

  return headerEl;
}

// =====================
// RENDER LOGO
// =====================
function renderHeaderLogo(logoPath, settings = null) {
  const logoText = document.getElementById("site-logo-text");
  if (!logoText) return;

  if (logoPath) {
    logoText.innerHTML = `<img src="${resolveHeaderImageUrl(
      logoPath
    )}" alt="Logo" style="height:40px;object-fit:contain;">`;
    return;
  }

  logoText.textContent = settings?.storeName || "Clothing Store";
}

// =====================
// BUILD MENU LINK HTML
// =====================
function buildHeaderLinkHTML(link) {
  const url = link.url || "#";
  const label = link.label || "";
  const isPromo = url.includes("promo=true");

  let labelHtml = label;

  if (isPromo) {
    labelHtml = label.replace(
      /(Sale|Promo|sale|promo|On Sale|on sale)/i,
      '<span class="promo-text">$1</span>'
    );
  }

  return `<a href="${url}">${labelHtml}</a>`;
}

// =====================
// RENDER DESKTOP MENU
// =====================
function renderDesktopMenu(menu) {
  const desktopMenu = document.getElementById("desktop-menu");
  if (!desktopMenu) return;

  desktopMenu.innerHTML = "";

  menu.forEach((menuItem) => {
    const sections = Array.isArray(menuItem.sections) ? menuItem.sections : [];

    if (!sections.length) {
      desktopMenu.insertAdjacentHTML(
        "beforeend",
        `<a class="menu-item" href="${menuItem.url || "#"}">${menuItem.title}</a>`
      );
      return;
    }

    const sectionsHtml = sections
      .map((section) => {
        const linksHtml = (section.links || [])
          .map((link, i, arr) => {
            const html = buildHeaderLinkHTML(link);
            const isPromo = (link.url || "").includes("promo=true");

            const nextLink = arr[i + 1];
            const nextIsPromo =
              nextLink && (nextLink.url || "").includes("promo=true");
            const addDivider = isPromo && !nextIsPromo;

            return addDivider
              ? html + '<div class="mega-link-divider"></div>'
              : html;
          })
          .join("");

        return `
          <div class="mega-section">
            <h4 class="mega-section-title">${section.title || ""}</h4>
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
// RENDER MOBILE MENU
// =====================
function renderMobileMenu(menu) {
  const mobileMenu = document.getElementById("mobile-menu");
  if (!mobileMenu) return;

  mobileMenu.innerHTML = "";

  menu.forEach((menuItem) => {
    const sections = Array.isArray(menuItem.sections) ? menuItem.sections : [];

    if (!sections.length) {
      mobileMenu.insertAdjacentHTML(
        "beforeend",
        `<a href="${menuItem.url || "#"}">${menuItem.title}</a>`
      );
      return;
    }

    const sectionsHtml = sections
      .map((section) => {
        const linksHtml = (section.links || [])
          .map((link, i, arr) => {
            const html = buildHeaderLinkHTML(link);
            const isPromo = (link.url || "").includes("promo=true");

            const nextLink = arr[i + 1];
            const nextIsPromo =
              nextLink && (nextLink.url || "").includes("promo=true");
            const addDivider = isPromo && !nextIsPromo;

            return addDivider
              ? html + '<div class="mega-link-divider"></div>'
              : html;
          })
          .join("");

        return `
          <div class="mobile-submenu-title">${section.title || ""}</div>
          ${linksHtml}
        `;
      })
      .join("");

    mobileMenu.insertAdjacentHTML(
      "beforeend",
      `
      <div class="mobile-item">
        <button type="button" class="mobile-toggle-sub">${menuItem.title} ▾</button>
        <div class="mobile-submenu">
          ${sectionsHtml}
        </div>
      </div>
      `
    );
  });
}

// =====================
// AUTH-AWARE BUTTONS
// =====================
async function setupHeaderAuth() {
  const loginLink = document.getElementById("login-link");
  const registerLink = document.getElementById("register-link");
  const logoutBtn = document.getElementById("logout-btn");

  if (!loginLink || !registerLink || !logoutBtn) return;

  try {
    const res = await fetch(`${API_BASE}/test/user`, {
      credentials: "include"
    });

    if (res.ok) {
      loginLink.style.display = "none";
      registerLink.style.display = "none";
      logoutBtn.style.display = "inline-flex";
      logoutBtn.onclick = async () => {
        try {
          const res = await fetch(`${API_BASE}/csrf`, {
            method: "GET",
            credentials: "include"
          });
          const data = await res.json().catch(() => ({}));
          const csrfToken = data.csrfToken || null;

          await fetch(`${API_BASE}/auth/logout`, {
            method: "POST",
            credentials: "include",
            headers: {
              ...(csrfToken ? { "x-csrf-token": csrfToken } : {})
            }
          });
        } catch (err) {
          console.error("Logout failed:", err);
        } finally {
          window.location.href = "login.html";
        }
      };
    } else {
      loginLink.style.display = "inline-flex";
      registerLink.style.display = "inline-flex";
      logoutBtn.style.display = "none";
    }
  } catch (err) {
    console.error("Header auth check failed:", err);
    loginLink.style.display = "inline-flex";
    registerLink.style.display = "inline-flex";
    logoutBtn.style.display = "none";
  }
}

// =====================
// HEADER INTERACTIONS
// =====================
function setupHeaderInteractions() {
  const mobileToggle = document.getElementById("mobile-toggle");
  const mobileClose = document.getElementById("mobile-close");
  const mobilePanel = document.getElementById("mobile-panel");
  const mobileOverlay = document.getElementById("mobile-overlay");
  const searchToggle = document.getElementById("search-toggle");
  const headerSearch = document.getElementById("search-input-header");

  mobileToggle?.addEventListener("click", () => {
    if (!mobilePanel) return;
    mobilePanel.setAttribute("aria-hidden", "false");
    mobileOverlay?.classList.add("active");
    document.body.style.overflow = "hidden";
  });

  function closeMobilePanel() {
    if (!mobilePanel) return;
    mobilePanel.setAttribute("aria-hidden", "true");
    mobileOverlay?.classList.remove("active");
    document.body.style.overflow = "";
  }

  mobileClose?.addEventListener("click", closeMobilePanel);
  mobileOverlay?.addEventListener("click", closeMobilePanel);

  document.querySelectorAll(".mobile-toggle-sub").forEach((btn) => {
    btn.addEventListener("click", () => {
      const submenu = btn.nextElementSibling;
      if (!submenu) return;

      const isOpen = submenu.style.display === "block";

      document.querySelectorAll(".mobile-submenu").forEach((sub) => {
        sub.style.display = "none";
      });

      document.querySelectorAll(".mobile-toggle-sub").forEach((b) => {
        b.classList.remove("active");
      });

      if (!isOpen) {
        submenu.style.display = "block";
        btn.classList.add("active");
      }
    });
  });

  searchToggle?.addEventListener("click", () => {
    if (!headerSearch) return;

    const isHidden =
      headerSearch.style.display === "none" || !headerSearch.style.display;

    headerSearch.style.display = isHidden ? "inline-block" : "none";

    if (isHidden) headerSearch.focus();
  });
}

// =====================
// CART HELPERS
// =====================
function getHeaderCart() {
  try {
    return JSON.parse(localStorage.getItem("cart")) || [];
  } catch {
    return [];
  }
}

function updateHeaderCartCounter() {
  const cartCountEl = document.getElementById("cart-count");
  if (!cartCountEl) return;

  const cart = getHeaderCart();
  const count = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
  cartCountEl.textContent = count;
}

function renderHeaderCartModal() {
  const list = document.getElementById("cart-items-list");
  const totalEl = document.getElementById("cart-total");

  if (!list || !totalEl) return;

  const cart = getHeaderCart();
  list.innerHTML = "";

  let total = 0;

  if (!cart.length) {
    list.innerHTML =
      `<li style="justify-content:center;opacity:.7;">Cart is empty</li>`;
    totalEl.textContent = "$0";
    return;
  }

  cart.forEach((item) => {
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
      localStorage.setItem("cart", JSON.stringify(cart));
      updateHeaderCartCounter();
      renderHeaderCartModal();
    };

    decBtn.onclick = () => {
      item.quantity -= 1;

      if (item.quantity <= 0) {
        const index = cart.findIndex((c) => c.id === item.id);
        if (index > -1) cart.splice(index, 1);
      }

      localStorage.setItem("cart", JSON.stringify(cart));
      updateHeaderCartCounter();
      renderHeaderCartModal();
    };

    list.appendChild(li);
    total += item.price * item.quantity;
  });

  totalEl.textContent = `$${total.toFixed(2)}`;
}

function setupHeaderCartModal() {
  const cartBtn = document.querySelector(".cart-wrapper .icon-btn");
  const modal = document.getElementById("cart-modal");
  const closeBtn = document.getElementById("cart-close");

  if (!cartBtn || !modal) return;

  cartBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    renderHeaderCartModal();
    modal.style.display = "flex";
  });

  closeBtn?.addEventListener("click", () => {
    modal.style.display = "none";
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });
}

// =====================
// INIT HEADER
// =====================
async function initSharedHeader() {
  try {
    const headerEl = await loadHeaderTemplate();
    if (!headerEl) return;

    const [headerData, settingsData] = await Promise.all([
      apiFetch("/header"),
      getStoreSettings().catch(() => null)
    ]);

    const settings =
      settingsData && settingsData.success ? settingsData.settings : null;

    if (headerData.success && headerData.header) {
      renderHeaderLogo(headerData.header.logo, settings);
      renderDesktopMenu(headerData.header.menu || []);
      renderMobileMenu(headerData.header.menu || []);
    } else {
      renderHeaderLogo("", settings);
    }

    if (settings) {
      window.applyStoreSettingsToUI?.(settings);
    }

    setupHeaderInteractions();
    await setupHeaderAuth();
    updateHeaderCartCounter();
    setupHeaderCartModal();
  } catch (err) {
    console.error("Failed to initialize shared header:", err);
  }
}

document.addEventListener("DOMContentLoaded", initSharedHeader);