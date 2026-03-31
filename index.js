// =====================
// APPLY HOMEPAGE SETTINGS
// =====================
function applyHomepageSettings(settings) {
  if (!settings?.homepage) return;

  const homepage = settings.homepage;

  const heroTitleEl = document.getElementById("hero-title");
  const heroSubtitleEl = document.getElementById("hero-subtitle");
  const supportHeadlineEl = document.getElementById("support-headline");
  const supportTextEl = document.getElementById("support-text");
  const supportEmailLink = document.getElementById("support-email-link");
  const supportInstagramLink = document.getElementById("support-instagram-link");
  const supportTwitterLink = document.getElementById("support-twitter-link");

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
    supportEmailLink.href = `mailto:${homepage.supportEmail}`;
    supportEmailLink.textContent = homepage.supportEmail;
  }

  if (supportInstagramLink && homepage.supportInstagram) {
    supportInstagramLink.href = homepage.supportInstagram;
    supportInstagramLink.textContent = "@Instagram";
  }

  if (supportTwitterLink && homepage.supportTwitter) {
    supportTwitterLink.href = homepage.supportTwitter;
    supportTwitterLink.textContent = "@X";
  }
}

// =====================
// LOAD STORE SETTINGS FOR HOMEPAGE
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

  document.addEventListener("DOMContentLoaded", () => {
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
      saved === "dark" || (saved === null && systemPrefDark)
        ? "dark"
        : "light";

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