// =====================
// LOAD DYNAMIC HEADER + STORE SETTINGS
// =====================
fetch("header.html")
  .then((res) => res.text())
  .then(async (html) => {
    const headerEl = document.getElementById("header");
    if (!headerEl) return;

    headerEl.innerHTML = html;

    try {
      const [headerData, settingsData] = await Promise.all([
        apiFetch("/header"),
        getStoreSettings()
      ]);

      if (headerData.success && headerData.header) {
        const header = headerData.header;

        // Logo
        const logoText = document.getElementById("site-logo-text");
        if (logoText && header.logo) {
          const logoSrc = /^https?:\/\//i.test(header.logo)
            ? header.logo
            : `${SERVER_BASE}${header.logo}`;

          logoText.innerHTML = `<img src="${logoSrc}" alt="Logo" style="height:40px;object-fit:contain;">`;
        }

        // Desktop menu
        const desktopMenu = document.getElementById("desktop-menu");
        if (desktopMenu && Array.isArray(header.menu)) {
          desktopMenu.innerHTML = "";

          header.menu.forEach((menuItem) => {
            const sections = Array.isArray(menuItem.sections)
              ? menuItem.sections
              : [];

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
                    const url = link.url || "#";
                    const isPromo = url.includes("promo=true");

                    let labelHtml = link.label || "";
                    if (isPromo) {
                      labelHtml = labelHtml.replace(
                        /(Sale|Promo|sale|promo|On Sale|on sale)/i,
                        '<span class="promo-text">$1</span>'
                      );
                    }

                    const html = `<a href="${url}">${labelHtml}</a>`;

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

        // Mobile menu
        const mobileMenu = document.getElementById("mobile-menu");
        if (mobileMenu && Array.isArray(header.menu)) {
          mobileMenu.innerHTML = "";

          header.menu.forEach((menuItem) => {
            const sections = Array.isArray(menuItem.sections)
              ? menuItem.sections
              : [];

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
                    const url = link.url || "#";
                    const isPromo = url.includes("promo=true");

                    let labelHtml = link.label || "";
                    if (isPromo) {
                      labelHtml = labelHtml.replace(
                        /(Sale|Promo|sale|promo|On Sale|on sale)/i,
                        '<span class="promo-text">$1</span>'
                      );
                    }

                    const html = `<a href="${url}">${labelHtml}</a>`;

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
      }

      if (settingsData.success && settingsData.settings) {
        window.applyStoreSettingsToUI?.(settingsData.settings);
      }

      setupHeaderInteractions();
      setupAuthHeader();
    } catch (err) {
      console.error("Failed to initialize dynamic header:", err);
    }
  })
  .catch((err) => console.error("Failed to load header:", err));

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
// AUTH-AWARE HEADER
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

async function logout() {
  try {
    const csrfToken = await getCsrfToken();

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
}

async function setupAuthHeader() {
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
      logoutBtn.onclick = logout;
    } else {
      loginLink.style.display = "inline-flex";
      registerLink.style.display = "inline-flex";
      logoutBtn.style.display = "none";
    }
  } catch (err) {
    console.error("Auth header check failed:", err);
    loginLink.style.display = "inline-flex";
    registerLink.style.display = "inline-flex";
    logoutBtn.style.display = "none";
  }
}

// =====================
// HERO LOAD EFFECT
// =====================
document.addEventListener("DOMContentLoaded", () => {
  requestAnimationFrame(() => {
    document.querySelector(".hero")?.classList.add("loaded");
  });
});

// =====================
// ABOUT ORBITS - CLICK ONLY
// =====================
(function () {
  function init() {
    const desc =
      document.querySelector(".about .desc") || document.querySelector(".desc");
    const orbit1 = document.getElementById("orbit1");
    const orbit2 = document.getElementById("orbit2");
    if (!desc || !orbit1 || !orbit2) return;

    const buttons = Array.from(orbit2.querySelectorAll("button.circle"));
    const bigById = {};

    Array.from(orbit1.querySelectorAll(".circle[id]")).forEach((b) => {
      bigById[b.id] = b;
    });

    const map = new Map();

    buttons.forEach((btn) => {
      const ctrl = btn.getAttribute("aria-controls");
      if (ctrl && bigById[ctrl]) map.set(btn, bigById[ctrl]);
    });

    map.forEach((big, btn) => {
      big.classList.remove("is-visible");
      big.setAttribute("aria-hidden", "true");
      if (!big.hasAttribute("tabindex")) big.setAttribute("tabindex", "-1");
      btn.setAttribute("aria-expanded", "false");
    });

    function pauseOrbit() {
      orbit1.classList.add("paused");
      orbit2.classList.add("paused");
      desc.classList.add("paused");
    }

    function resumeOrbit() {
      const anyOpen = Object.values(bigById).some(
        (b) => b.classList && b.classList.contains("is-visible")
      );
      if (!anyOpen) {
        orbit1.classList.remove("paused");
        orbit2.classList.remove("paused");
        desc.classList.remove("paused");
      }
    }

    function hideAll() {
      map.forEach((big, btn) => {
        big.classList.remove("is-visible");
        big.setAttribute("aria-hidden", "true");
        btn.setAttribute("aria-expanded", "false");
        btn.classList.remove("is-expanded");
      });
      resumeOrbit();
    }

    function showFor(btn) {
      const big = map.get(btn);
      if (!big) return;

      map.forEach((otherBig, otherBtn) => {
        if (otherBig !== big) {
          otherBig.classList.remove("is-visible");
          otherBig.setAttribute("aria-hidden", "true");
          otherBtn.setAttribute("aria-expanded", "false");
          otherBtn.classList.remove("is-expanded");
        }
      });

      big.classList.add("is-visible");
      big.setAttribute("aria-hidden", "false");
      btn.setAttribute("aria-expanded", "true");
      btn.classList.add("is-expanded");
      pauseOrbit();
    }

    map.forEach((big, btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const expanded = btn.getAttribute("aria-expanded") === "true";
        if (expanded) {
          hideAll();
          btn.focus();
        } else {
          showFor(btn);
        }
      });

      big.addEventListener("click", (ev) => ev.stopPropagation());
    });

    document.addEventListener("click", (e) => {
      const clickedButton = buttons.find(
        (b) => b.contains(e.target) || b === e.target
      );
      const clickedBig = Object.values(bigById).find(
        (b) => b.contains(e.target) || b === e.target
      );
      if (!clickedButton && !clickedBig) hideAll();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" || e.key === "Esc") hideAll();
    });

    let wheelTimer = null;

    orbit2.addEventListener(
      "wheel",
      () => {
        pauseOrbit();
        clearTimeout(wheelTimer);
        wheelTimer = setTimeout(resumeOrbit, 220);
      },
      { passive: true }
    );

    orbit1.addEventListener(
      "wheel",
      () => {
        pauseOrbit();
        clearTimeout(wheelTimer);
        wheelTimer = setTimeout(resumeOrbit, 220);
      },
      { passive: true }
    );

    function handleResponsive() {
      if (window.innerWidth <= 768) hideAll();
    }

    handleResponsive();

    let rt;
    window.addEventListener("resize", () => {
      clearTimeout(rt);
      rt = setTimeout(handleResponsive, 120);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

// =====================
// THEME TOGGLE
// =====================
(function () {
  const LS_KEY = "site-theme";
  const toggle = document.getElementById("theme-toggle");
  if (!toggle) return;

  const saved = localStorage.getItem(LS_KEY);
  const systemPrefDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  function applyTheme(theme) {
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");

    toggle.setAttribute("aria-pressed", String(theme === "dark"));

    const icon = toggle.querySelector(".theme-icon");
    if (icon) {
      icon.textContent = theme === "dark" ? "☀️" : "🌙";
    }
  }

  const initial =
    saved === "dark" || (saved === null && systemPrefDark) ? "dark" : "light";

  applyTheme(initial);

  if (window.matchMedia) {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener?.("change", (e) => {
      if (!localStorage.getItem(LS_KEY)) {
        applyTheme(e.matches ? "dark" : "light");
      }
    });
  }

  toggle.addEventListener("click", () => {
    const isDark = document.documentElement.classList.contains("dark");
    const newTheme = isDark ? "light" : "dark";
    applyTheme(newTheme);
    localStorage.setItem(LS_KEY, newTheme);
  });

  toggle.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle.click();
    }
  });
})();

// =====================
// PROJECT ORBITS
// =====================
document.addEventListener("DOMContentLoaded", () => {
  const orbit4 = document.getElementById("orbit4");
  const circle7 = document.getElementById("circle7");
  const circle77 = document.getElementById("circle77");
  const circle8 = document.getElementById("circle8");
  const circle88 = document.getElementById("circle88");
  const circle9 = document.getElementById("circle9");
  const circle99 = document.getElementById("circle99");
  const circle10 = document.getElementById("circle10");
  const circle1010 = document.getElementById("circle1010");
  const circle12 = document.getElementById("circle12");
  const circle1212 = document.getElementById("circle1212");
  const circle13 = document.getElementById("circle13");
  const circle1313 = document.getElementById("circle1313");

  if (
    !orbit4 ||
    !circle7 || !circle77 ||
    !circle8 || !circle88 ||
    !circle9 || !circle99 ||
    !circle10 || !circle1010 ||
    !circle12 || !circle1212 ||
    !circle13 || !circle1313
  ) {
    return;
  }

  circle7.style.visibility = "hidden";
  circle8.style.visibility = "hidden";
  circle9.style.visibility = "hidden";
  circle10.style.visibility = "hidden";
  circle12.style.visibility = "hidden";
  circle13.style.visibility = "hidden";

  if (window.innerWidth > 768) {
    orbit4.addEventListener("mouseenter", () => {
      document
        .querySelectorAll(
          ".orbit3, .orbit4, .po2, .circle, .content7, .content77, .content8, .content88, .content9, .content99, .content10, .content1010, .content12, .content1212, .content13, .content1313"
        )
        .forEach((el) => (el.style.animationPlayState = "paused"));
    });

    orbit4.addEventListener("mouseleave", () => {
      document
        .querySelectorAll(
          ".orbit3, .orbit4, .po2, .circle, .content7, .content77, .content8, .content88, .content9, .content99, .content10, .content1010, .content12, .content1212, .content13, .content1313"
        )
        .forEach((el) => (el.style.animationPlayState = "running"));
    });
  }

  circle77.addEventListener("mouseenter", () => {
    circle7.style.visibility = "visible";
  });
  circle88.addEventListener("mouseenter", () => {
    circle8.style.visibility = "visible";
  });
  circle99.addEventListener("mouseenter", () => {
    circle9.style.visibility = "visible";
  });
  circle1010.addEventListener("mouseenter", () => {
    circle10.style.visibility = "visible";
  });
  circle1212.addEventListener("mouseenter", () => {
    circle12.style.visibility = "visible";
  });
  circle1313.addEventListener("mouseenter", () => {
    circle13.style.visibility = "visible";
  });

  circle77.addEventListener("mouseleave", () => {
    circle7.style.visibility = "hidden";
  });
  circle88.addEventListener("mouseleave", () => {
    circle8.style.visibility = "hidden";
  });
  circle99.addEventListener("mouseleave", () => {
    circle9.style.visibility = "hidden";
  });
  circle1010.addEventListener("mouseleave", () => {
    circle10.style.visibility = "hidden";
  });
  circle1212.addEventListener("mouseleave", () => {
    circle12.style.visibility = "hidden";
  });
  circle1313.addEventListener("mouseleave", () => {
    circle13.style.visibility = "hidden";
  });
});

// =====================
// TESTIMONIALS
// =====================
document.addEventListener("DOMContentLoaded", () => {
  const grid = document.querySelector(".testimonial-grid");
  const wrap = document.querySelector(".testimonials .wrap");
  const rightBtn = document.querySelector(".change-background-r");
  const leftBtn = document.querySelector(".change-background-l");

  if (!grid || !wrap || !rightBtn || !leftBtn) return;

  let cards = Array.from(grid.querySelectorAll(".card"));

  cards = cards.sort((a, b) => {
    const aLeft = a.getBoundingClientRect().left;
    const bLeft = b.getBoundingClientRect().left;
    return aLeft - bLeft;
  });

  cards.forEach((card) => grid.appendChild(card));

  function centerActive(animate = true) {
    const active =
      cards.find((c) => c.classList.contains("active")) ||
      cards[Math.floor(cards.length / 2)];

    if (!active) return;

    const wrapRect = wrap.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();

    const wrapCenterX = wrapRect.left + wrapRect.width / 2;
    const activeCenterX = activeRect.left + activeRect.width / 2;
    const delta = wrapCenterX - activeCenterX;

    if (!animate) {
      grid.style.transition = "none";
      grid.style.transform = `translateX(${delta}px)`;
      grid.getBoundingClientRect();
      grid.style.transition = "";
      return;
    }

    grid.style.transform = `translateX(${delta}px)`;
  }

  function renderCards(animate = true) {
    const firstRects = new Map();
    cards.forEach((card) => firstRects.set(card, card.getBoundingClientRect()));

    cards.forEach((card) => grid.appendChild(card));

    cards.forEach((c) => c.classList.remove("active"));
    const middleIndex = Math.floor(cards.length / 2);
    cards[middleIndex].classList.add("active");

    if (!animate) {
      centerActive(false);
      return;
    }

    const lastRects = new Map();
    cards.forEach((card) => lastRects.set(card, card.getBoundingClientRect()));

    cards.forEach((card) => {
      const first = firstRects.get(card);
      const last = lastRects.get(card);
      if (!first || !last) return;

      const dx = first.left - last.left;
      const dy = first.top - last.top;

      if (dx === 0 && dy === 0) return;

      card.style.transition = "none";
      card.style.transform = `translate(${dx}px, ${dy}px)`;

      card.getBoundingClientRect();

      requestAnimationFrame(() => {
        card.style.transition = "transform .45s cubic-bezier(.2,.9,.3,1)";
        card.style.transform = "";
      });

      const cleanup = () => {
        card.style.transition = "";
        card.style.transform = "";
        card.removeEventListener("transitionend", cleanup);
      };

      card.addEventListener("transitionend", cleanup);
    });

    const FLIP_DURATION = 450;
    setTimeout(() => centerActive(true), FLIP_DURATION - 40);
  }

  function rotateRight() {
    const last = cards.pop();
    cards.unshift(last);
    renderCards(true);
  }

  function rotateLeft() {
    const first = cards.shift();
    cards.push(first);
    renderCards(true);
  }

  rightBtn.addEventListener("click", rotateRight);
  leftBtn.addEventListener("click", rotateLeft);

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => centerActive(false), 120);
  });

  renderCards(false);
});