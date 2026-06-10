// =====================
// APPLY HOMEPAGE SETTINGS
// =====================
function applyHomepageSettings(settings) {
  if (!settings?.homepage) return;

  const homepage = settings.homepage;

  const heroTitleEl          = document.getElementById("hero-title");
  const heroSubtitleEl       = document.getElementById("hero-subtitle");
  const supportHeadlineEl    = document.getElementById("support-headline");
  const supportTextEl        = document.getElementById("support-text");
  const supportEmailLink     = document.getElementById("support-email-link");
  const supportInstagramLink = document.getElementById("support-instagram-link");
  const supportTwitterLink   = document.getElementById("support-twitter-link");

  if (heroTitleEl && homepage.heroTitle) {
    heroTitleEl.innerHTML = homepage.heroTitle
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .join("<br />");
  }

  if (heroSubtitleEl && homepage.heroSubtitle) {
    heroSubtitleEl.textContent = homepage.heroSubtitle;
  }

  if (supportHeadlineEl && homepage.supportHeadline) {
    supportHeadlineEl.textContent = homepage.supportHeadline;
  }

  if (supportTextEl && homepage.supportText) {
    supportTextEl.textContent = homepage.supportText;
  }

  if (supportEmailLink && homepage.supportEmail) {
    supportEmailLink.href        = `mailto:${homepage.supportEmail}`;
    supportEmailLink.textContent = homepage.supportEmail;
  }

  if (supportInstagramLink && homepage.supportInstagram) {
    supportInstagramLink.href        = homepage.supportInstagram;
    supportInstagramLink.textContent = "@Instagram";
  }

  if (supportTwitterLink && homepage.supportTwitter) {
    supportTwitterLink.href        = homepage.supportTwitter;
    supportTwitterLink.textContent = "@X";
  }
}

// =====================
// LOAD STORE SETTINGS
// =====================
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const settingsData = await getStoreSettings();
    if (settingsData.success && settingsData.settings) {
      window.applyStoreSettingsToUI?.(settingsData.settings);
      applyHomepageSettings(settingsData.settings);
    }
  } catch (err) {
    console.error("Failed to load homepage settings:", err);
  }
});

// =====================
// LOAD DISCOUNT OFFERS
// =====================
async function loadDiscountOffers() {
  const offersGrid = document.getElementById("offers-grid");
  if (!offersGrid) return;

  offersGrid.innerHTML = "<p>Loading offers...</p>";

  try {
    const data   = await apiFetch("/product?promo=true&limit=4&sort=newest");
    const offers = data.products || [];

    if (!offers.length) {
      offersGrid.innerHTML = "<p>No offers available right now.</p>";
      return;
    }

    offersGrid.innerHTML = offers
      .map((product) => {
        const firstImage = Array.isArray(product.images) ? product.images[0] : "";
        const imageSrc   = firstImage
          ? (/^https?:\/\//i.test(firstImage) ? firstImage : `${SERVER_BASE}${firstImage}`)
          : "https://via.placeholder.com/400";

        const oldPrice = Number(product.compareAtPrice || 0);
        const newPrice = Number(product.price || 0);

        const discount =
          oldPrice > newPrice && oldPrice > 0
            ? Math.round(((oldPrice - newPrice) / oldPrice) * 100)
            : 0;

        const badgeHtml = discount > 0
          ? `<div class="offer-badge"><span>${discount}%</span></div>`
          : "";

        return `
          <article class="offer-card">
            <div class="offer-image-wrap">
              <img src="${imageSrc}" alt="${product.name}" />
              ${badgeHtml}
            </div>
            <h3>${product.name}</h3>
            <div class="offer-prices">
              <p class="offer-old">Old: <span>$${oldPrice.toFixed(2)}</span></p>
              <p class="offer-new">Now: <strong>$${newPrice.toFixed(2)}</strong></p>
            </div>
            <a href="product.html?id=${product._id}" class="offer-btn">Shop Now</a>
          </article>
        `;
      })
      .join("");

    initOffersSlider();
  } catch (err) {
    console.error("Failed to load discount offers:", err);
    offersGrid.innerHTML = "<p style='color:#b91c1c;'>Failed to load offers.</p>";
  }
}

// =====================
// OFFERS SLIDER
// =====================
function initOffersSlider() {
  const grid    = document.getElementById("offers-grid");
  const prevBtn = document.querySelector(".offers-prev");
  const nextBtn = document.querySelector(".offers-next");
  if (!grid || !prevBtn || !nextBtn) return;

  let currentIndex = 0;

  function getVisibleCount() {
    if (window.innerWidth <= 768)  return 1;
    if (window.innerWidth <= 1200) return 2;
    return 4;
  }

  function updateSlider() {
    const cards = [...grid.querySelectorAll(".offer-card")];
    if (!cards.length) return;

    const visibleCount = getVisibleCount();
    const maxIndex     = Math.max(cards.length - visibleCount, 0);

    if (currentIndex > maxIndex) currentIndex = maxIndex;
    if (currentIndex < 0)        currentIndex = 0;

    const cardWidth = cards[0].offsetWidth;
    const gap       = 24;
    grid.style.transform = `translateX(-${currentIndex * (cardWidth + gap)}px)`;
  }

  prevBtn.addEventListener("click", () => { currentIndex -= 1; updateSlider(); });
  nextBtn.addEventListener("click", () => { currentIndex += 1; updateSlider(); });
  window.addEventListener("resize", updateSlider);
  updateSlider();
}

// =====================
// COLLECTIONS ORBITS
// The new structure uses .orbit-center + .orbit-ring + .orbit-sat.
// Spin / counter-spin / hover-pause are all handled in pure CSS,
// so no JavaScript orbit logic is required here.
// =====================


// =====================
// THEME TOGGLE
// =====================
(function () {
  const LS_KEY = "site-theme";

  document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById("theme-toggle");
    if (!toggle) return;

    const saved          = localStorage.getItem(LS_KEY);
    const systemPrefDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;

    function applyTheme(theme) {
      if (theme === "dark") document.documentElement.classList.add("dark");
      else                  document.documentElement.classList.remove("dark");

      toggle.setAttribute("aria-pressed", String(theme === "dark"));

      const icon = toggle.querySelector(".theme-icon");
      if (icon) icon.textContent = theme === "dark" ? "☀️" : "🌙";
    }

    applyTheme(saved === "dark" || (!saved && systemPrefDark) ? "dark" : "light");

    window.matchMedia?.("(prefers-color-scheme: dark)")
      .addEventListener?.("change", (e) => {
        if (!localStorage.getItem(LS_KEY)) applyTheme(e.matches ? "dark" : "light");
      });

    toggle.addEventListener("click", () => {
      const newTheme = document.documentElement.classList.contains("dark") ? "light" : "dark";
      applyTheme(newTheme);
      localStorage.setItem(LS_KEY, newTheme);
    });

    toggle.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle.click(); }
    });
  });
})();


// =====================
// TESTIMONIALS
// =====================
document.addEventListener("DOMContentLoaded", () => {
  const grid     = document.querySelector(".testimonial-grid");
  const wrap     = document.querySelector(".testimonials .wrap");
  const rightBtn = document.querySelector(".change-background-r");
  const leftBtn  = document.querySelector(".change-background-l");

  if (!grid || !wrap || !rightBtn || !leftBtn) return;

  let cards = Array.from(grid.querySelectorAll(".card")).sort((a, b) => {
    return a.getBoundingClientRect().left - b.getBoundingClientRect().left;
  });

  cards.forEach((card) => grid.appendChild(card));

  function centerActive(animate = true) {
    const active =
      cards.find((c) => c.classList.contains("active")) ||
      cards[Math.floor(cards.length / 2)];

    if (!active) return;

    const wrapRect      = wrap.getBoundingClientRect();
    const activeRect    = active.getBoundingClientRect();
    const delta         = (wrapRect.left + wrapRect.width / 2) -
                          (activeRect.left + activeRect.width / 2);

    if (!animate) {
      grid.style.transition = "none";
      grid.style.transform  = `translateX(${delta}px)`;
      grid.getBoundingClientRect();
      grid.style.transition = "";
      return;
    }

    grid.style.transform = `translateX(${delta}px)`;
  }

  function renderCards(animate = true) {
    const firstRects = new Map();
    cards.forEach((c) => firstRects.set(c, c.getBoundingClientRect()));
    cards.forEach((c) => grid.appendChild(c));

    cards.forEach((c) => c.classList.remove("active"));
    cards[Math.floor(cards.length / 2)].classList.add("active");

    if (!animate) { centerActive(false); return; }

    const lastRects = new Map();
    cards.forEach((c) => lastRects.set(c, c.getBoundingClientRect()));

    cards.forEach((card) => {
      const first = firstRects.get(card);
      const last  = lastRects.get(card);
      if (!first || !last) return;

      const dx = first.left - last.left;
      const dy = first.top  - last.top;
      if (dx === 0 && dy === 0) return;

      card.style.transition = "none";
      card.style.transform  = `translate(${dx}px, ${dy}px)`;
      card.getBoundingClientRect();

      requestAnimationFrame(() => {
        card.style.transition = "transform .45s cubic-bezier(.2,.9,.3,1)";
        card.style.transform  = "";
      });

      const cleanup = () => {
        card.style.transition = "";
        card.style.transform  = "";
        card.removeEventListener("transitionend", cleanup);
      };
      card.addEventListener("transitionend", cleanup);
    });

    setTimeout(() => centerActive(true), 410);
  }

  rightBtn.addEventListener("click", () => { const last  = cards.pop();   cards.unshift(last);  renderCards(true); });
  leftBtn.addEventListener("click",  () => { const first = cards.shift(); cards.push(first);    renderCards(true); });

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => centerActive(false), 120);
  });

  renderCards(false);
});

// =====================
// SECTION-BY-SECTION SCROLL — desktop only
//
// BUG FIXED: selector was ".pricing" which never matched because the
// element has id="pricing" and class="offers-section".  Fixed to "#pricing".
//
// IMPROVED: replaced the isAnimating + touchpadLock boolean flags with a
// single lastScrollTime timestamp.  During the cooldown window the handler
// calls preventDefault() (no partial scroll); outside the window it snaps
// to the next or previous section.  At the first/last section the handler
// returns early so the browser can scroll naturally past the boundary.
// =====================
(function () {
  const sectionSelectors = [
    ".hero",
    ".about",
    ".projects",
    "#pricing",        // ← FIXED (was ".pricing")
    ".testimonials",
    ".contact"
  ];

  let currentSectionIndex = 0;
  let lastScrollTime      = 0;
  const COOLDOWN          = 920; // ms — matches smooth-scroll duration

  function getSections() {
    return sectionSelectors
      .map((sel) => document.querySelector(sel))
      .filter(Boolean);
  }

  // Use section mid-points for more accurate detection on
  // sections that are shorter or taller than the viewport.
  function detectCurrentSection() {
    const sections  = getSections();
    const viewMid   = window.scrollY + window.innerHeight / 2;
    let bestIndex   = 0;
    let bestDist    = Infinity;

    sections.forEach((sec, i) => {
      const secMid = sec.offsetTop + sec.offsetHeight / 2;
      const dist   = Math.abs(secMid - viewMid);
      if (dist < bestDist) { bestDist = dist; bestIndex = i; }
    });

    currentSectionIndex = bestIndex;
  }

  function scrollToSection(index) {
    const sections = getSections();
    if (!sections[index]) return;

    currentSectionIndex = index;

    window.scrollTo({
      // 80px offset accounts for the sticky header height (68px) + buffer
      top:      Math.max(0, sections[index].offsetTop - 80),
      behavior: "smooth"
    });
  }

  function handleWheel(event) {
    if (window.innerWidth <= 768) return;

    const now       = Date.now();
    const sections  = getSections();
    if (!sections.length) return;

    const direction = event.deltaY > 0 ? 1 : -1;

    detectCurrentSection();

    const nextIndex = currentSectionIndex + direction;

    // At the boundary — return without preventing default so the browser
    // can scroll naturally past the first / last section.
    if (nextIndex < 0 || nextIndex >= sections.length) return;

    // During cooldown — the smooth-scroll animation is still playing.
    // Block any further scrolling until it finishes.
    if (now - lastScrollTime < COOLDOWN) {
      event.preventDefault();
      return;
    }

    // Ignore micro-movements (trackpad drift, accidental nudge < 10 px).
    if (Math.abs(event.deltaY) < 10) return;

    event.preventDefault();
    lastScrollTime = now;
    scrollToSection(nextIndex);
  }

  function init() {
    detectCurrentSection();

    window.addEventListener("wheel", handleWheel, { passive: false });

    // Re-sync current section on manual scroll (e.g. clicking anchor links).
    window.addEventListener("scroll", () => {
      if (Date.now() - lastScrollTime > COOLDOWN) {
        detectCurrentSection();
      }
    }, { passive: true });
  }

  document.addEventListener("DOMContentLoaded", init);
})();

// =====================
// BOOT
// =====================
document.addEventListener("DOMContentLoaded", () => {
  loadDiscountOffers();
});