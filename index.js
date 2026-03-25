  /* ===========================================================================================================================================================================================================================================================
 .testimonials
   ==========================================================================================================================================================================================================================================================*/
/* about-orbits-click-only.js
   Show big circle only on button click. No hover-based showing.
*/
(function () {
  function init() {
    const desc = document.querySelector('.about .desc') || document.querySelector('.desc');
    const orbit1 = document.getElementById('orbit1');
    const orbit2 = document.getElementById('orbit2');
    if (!desc || !orbit1 || !orbit2) return;

    // Map small buttons in orbit2 -> big panels in orbit1 using aria-controls
    const buttons = Array.from(orbit2.querySelectorAll('button.circle'))

    const bigById = {};
    Array.from(orbit1.querySelectorAll('.circle[id]')).forEach(b => bigById[b.id] = b);

    const map = new Map();
    buttons.forEach(btn => {
      const ctrl = btn.getAttribute('aria-controls');
      if (ctrl && bigById[ctrl]) map.set(btn, bigById[ctrl]);
    });

    // Init states
    map.forEach((big, btn) => {
      big.classList.remove('is-visible');
      big.setAttribute('aria-hidden', 'true');
      if (!big.hasAttribute('tabindex')) big.setAttribute('tabindex', '-1'); // allow focus if needed
      btn.setAttribute('aria-expanded', 'false');
    });

    // Pause/resume helpers (toggle CSS class, CSS must respond to .paused)
    function pauseOrbit() {
      orbit1.classList.add('paused');
      orbit2.classList.add('paused');
      desc.classList.add('paused');
    }
    function resumeOrbit() {
      const anyOpen = Object.values(bigById).some(b => b.classList && b.classList.contains('is-visible'));
      if (!anyOpen) {
        orbit1.classList.remove('paused');
        orbit2.classList.remove('paused');
        desc.classList.remove('paused');
      }
    }

    function hideAll() {
      map.forEach((big, btn) => {
        big.classList.remove('is-visible');
        big.setAttribute('aria-hidden', 'true');
        btn.setAttribute('aria-expanded', 'false');
        btn.classList.remove('is-expanded');
      });
      resumeOrbit();
    }

    function showFor(btn) {
      const big = map.get(btn);
      if (!big) return;
      // hide others
      map.forEach((otherBig, otherBtn) => {
        if (otherBig !== big) {
          otherBig.classList.remove('is-visible');
          otherBig.setAttribute('aria-hidden', 'true');
          otherBtn.setAttribute('aria-expanded', 'false');
          otherBtn.classList.remove('is-expanded');
        }
      });
      big.classList.add('is-visible');
      big.setAttribute('aria-hidden', 'false');
      btn.setAttribute('aria-expanded', 'true');
      btn.classList.add('is-expanded');
      pauseOrbit();
      // Move focus into big for keyboard users optionally:
      // big.focus(); // uncomment if you want focus to jump
    }

    // Toggle behavior on click. Buttons are real <button>, so keyboard works out of the box.
    map.forEach((big, btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // prevent document click from immediately closing
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        if (expanded) {
          hideAll();
          btn.focus(); // keep focus tidy
        } else {
          showFor(btn);
        }
      });

      // Optional: keep big open if user clicks inside it
      big.addEventListener('click', (ev) => ev.stopPropagation());
    });

    // Click outside closes all
    document.addEventListener('click', (e) => {
      // If click target is neither a mapped button nor one of the big panels, close.
      const clickedButton = buttons.find(b => b.contains(e.target) || b === e.target);
      const clickedBig = Object.values(bigById).find(b => b.contains(e.target) || b === e.target);
      if (!clickedButton && !clickedBig) hideAll();
    });

    // Escape closes
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') hideAll();
    });

    // Wheel: do NOT open bigs on scroll — we only pause orbit briefly for clarity
    let wheelTimer = null;
    orbit2.addEventListener('wheel', (ev) => {
      // pause briefly while user scrolls inside orbit area
      pauseOrbit();
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(resumeOrbit, 220);
    }, { passive: true });
    orbit1.addEventListener('wheel', (ev) => {
      pauseOrbit();
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(resumeOrbit, 220);
    }, { passive: true });

    // Responsive: hide on small screens (optional)
    function handleResponsive() {
      if (window.innerWidth <= 768) hideAll();
    }
    handleResponsive();
    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(handleResponsive, 120); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
})();




  /* ===========================================================================================================================================================================================================================================================
 .testimonials
   ==========================================================================================================================================================================================================================================================*/

  document.addEventListener('DOMContentLoaded', () => {
    // small delay so fonts/images don't jump
    requestAnimationFrame(() => document.querySelector('.hero').classList.add('loaded'));
  });
  

  // Theme toggle — add to template1.js or separate file included after it

(function () {
  const LS_KEY = 'site-theme'; // localStorage key
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;

  // Read explicit user preference from localStorage if present
  const saved = localStorage.getItem(LS_KEY); // 'dark'|'light' or null

  // Detect system preference
  const systemPrefDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  // Apply theme function
  function applyTheme(theme) {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');

    // update toggle UI
    const pressed = (theme === 'dark');
    toggle.setAttribute('aria-pressed', String(pressed));
    toggle.querySelector('.theme-icon').textContent = pressed ? '☀️' : '🌙';
  }

  // Decide initial theme: localStorage > systemPref > default light
  const initial = saved === 'dark' || (saved === null && systemPrefDark) ? 'dark' : 'light';
  applyTheme(initial);

  // Listen for system changes (only if user hasn't explicitly chosen)
  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener?.('change', e => {
      // if user has no saved choice, follow system change
      if (!localStorage.getItem(LS_KEY)) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  // Toggle handler
  toggle.addEventListener('click', () => {
    const isDark = document.documentElement.classList.contains('dark');
    const newTheme = isDark ? 'light' : 'dark';
    applyTheme(newTheme);
    // persist user choice
    localStorage.setItem(LS_KEY, newTheme);
  });

  // keyboard accessibility (optional: toggle with Enter/Space handled by button by default)
  toggle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle.click();
    }
  });
})();


  /* ===========================================================================================================================================================================================================================================================
 .testimonials
   ==========================================================================================================================================================================================================================================================*/


function handleResponsive() {
  const circles = document.querySelectorAll(".orbit3 ");

  if (window.innerWidth <= 768) {
    circles.forEach(c => c.style.animation = "none"); 
  } else {
    circles.forEach(c => c.style.animation = "spin 40s linear infinite"); 
  }
}


window.addEventListener("resize", handleResponsive);





document.addEventListener("DOMContentLoaded", () => {
    const orbit3     = document.getElementById("orbit3");
    const orbit4     = document.getElementById("orbit4");
    const circle7    = document.getElementById("circle7");
    const circle77   = document.getElementById("circle77");
    const circle8    = document.getElementById("circle8");
    const circle88 = document.getElementById("circle88");
    const circle9 = document.getElementById("circle9");
    const circle99 = document.getElementById("circle99");
    const circle10 = document.getElementById("circle10");
    const circle1010 = document.getElementById("circle1010");
    const circle12 = document.getElementById("circle12");
    const circle1212 = document.getElementById("circle1212");
    const circle13 = document.getElementById("circle13");
    const circle1313 = document.getElementById("circle1313");
  


      // hide big circle initially
      circle7.style.visibility= "hidden";
      circle8.style.visibility= "hidden";
      circle9.style.visibility= "hidden";
      circle10.style.visibility= "hidden";
      circle12.style.visibility= "hidden";
      circle13.style.visibility= "hidden";

      
      if (window.innerWidth > 768) {

    orbit4.addEventListener("mouseenter", () => {  
        // pause ALL rotating elements (orbit + circles)
        document.querySelectorAll(".orbit3, .orbit4, .po2, .circle, .content7, .content77, .content8, .content88, .content9, .content99, .content10, .content1010, .content12, .content1212, .content13, .content1313")
          .forEach(el => el.style.animationPlayState = "paused");

      });
  
      orbit4.addEventListener("mouseleave", () => {
        // resume ALL rotating elements
        document.querySelectorAll(".orbit3, .orbit4, .po2, .circle, .content7, .content77, .content8, .content88, .content9, .content99, .content10, .content1010, .content12, .content1212, .content13, .content1313")
          .forEach(el => el.style.animationPlayState = "running");
 
      });
    }});
  




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
    circle7.style.visibility= "hidden";  
  });
    circle88.addEventListener("mouseleave", () => {
    circle8.style.visibility= "hidden";  
  });
    circle99.addEventListener("mouseleave", () => {
    circle9.style.visibility= "hidden";  
  });
    circle1010.addEventListener("mouseleave", () => {
    circle10.style.visibility= "hidden";  
  });
    circle1212.addEventListener("mouseleave", () => {
    circle12.style.visibility= "hidden";  
  });
    circle1313.addEventListener("mouseleave", () => {
    circle13.style.visibility= "hidden";  
  });
  /* ===========================================================================================================================================================================================================================================================
 .testimonials
   ==========================================================================================================================================================================================================================================================*/
// Accessible mobile menu (drop-in)
// - Lazy-creates a mobile panel from the desktop nav when first opened.
// - Keeps original desktop nav intact.
// - Proper ARIA, focus trap, ESC, click-outside, and resize behaviour.

(function () {
  const header = document.querySelector('.nav');
  const toggle = document.getElementById('mobile-toggle');
  const desktopMenu = document.getElementById('primary-menu'); // desktop nav
  if (!header || !toggle || !desktopMenu) return;

  // Helpers
  const focusableSelector = [
    'a[href]:not([tabindex="-1"])',
    'button:not([disabled])',
    'input:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(', ');

  let panel = null;
  let lastFocusedBeforeOpen = null;
  let listeners = { };

  function createPanel() {
    if (panel) return panel;

    // Create panel container
    panel = document.createElement('div');
    panel.className = 'nav-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'Primary menu');
    panel.tabIndex = -1; // allow programmatic focus

    // Clone the desktop menu but avoid cloning id attributes (to prevent duplicates)
    const clone = desktopMenu.cloneNode(true);

    // Remove id from the clone root if present
    if (clone.hasAttribute('id')) clone.removeAttribute('id');

    // Also make sure any descendants don't keep duplicate IDs
    clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));

    // Append cloned content
    panel.appendChild(clone);

    // Add close button at top of panel for easier dismissing on mobile
    const closeButton = document.createElement('button');
    closeButton.className = 'nav-panel-close';
    closeButton.type = 'button';
    closeButton.innerText = 'Close';
    closeButton.setAttribute('aria-label', 'Close menu');
    // place before cloned menu (style with CSS as needed)
    panel.insertBefore(closeButton, panel.firstChild);

    header.appendChild(panel);

    // close when clicking close button
    closeButton.addEventListener('click', closeMenu);

    // close on clicks of links inside the panel (use closest)
    panel.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (a) closeMenu();
    });

    // click outside to close
    listeners.outsideClick = (e) => {
      if (!panel.contains(e.target) && !toggle.contains(e.target)) closeMenu();
    };

    // keydown handler for ESC and focus trapping
    listeners.keydown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMenu();
        return;
      }
      if (e.key === 'Tab') {
        // Focus trap: cycle focus inside panel
        const nodes = Array.from(panel.querySelectorAll(focusableSelector)).filter(n => n.offsetParent !== null);
        if (nodes.length === 0) {
          e.preventDefault();
          return;
        }
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    return panel;
  }

  function openMenu() {
    createPanel();
    // set unique id for the panel and update toggle aria-controls
    const panelId = 'mobile-panel';
    panel.id = panelId;
    toggle.setAttribute('aria-controls', panelId);

    if (!panel) return;

    lastFocusedBeforeOpen = document.activeElement;

    header.classList.add('menu-open');          // class used for header styling if needed
    panel.classList.add('open');                // panel visible state (style in CSS)
    document.body.classList.add('menu-open');   // prevent body scroll via CSS

    // Hide the desktop nav from ATs while panel is open
    desktopMenu.setAttribute('aria-hidden', 'true');

    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close menu');

    // Focus the first focusable element inside panel (prefer real interactive element)
    const first = panel.querySelector(focusableSelector);
    if (first) first.focus();
    else panel.focus();

    // Attach global listeners
    document.addEventListener('keydown', listeners.keydown);
    setTimeout(() => document.addEventListener('click', listeners.outsideClick), 0); // defer to avoid immediate close
  }

  function closeMenu() {
    if (!panel) return;

    header.classList.remove('menu-open');
    panel.classList.remove('open');
    document.body.classList.remove('menu-open');

    desktopMenu.removeAttribute('aria-hidden');

    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');

    // remove listeners
    document.removeEventListener('keydown', listeners.keydown);
    document.removeEventListener('click', listeners.outsideClick);

    // restore focus to the toggle
    if (lastFocusedBeforeOpen && typeof lastFocusedBeforeOpen.focus === 'function') {
      lastFocusedBeforeOpen.focus();
    } else {
      toggle.focus();
    }
  }

  // Toggle click
  toggle.addEventListener('click', (e) => {
    const isOpen = panel && panel.classList && panel.classList.contains('open');
    if (isOpen) closeMenu();
    else openMenu();
  });

  // Close panel if viewport expands to desktop (cleanup)
  window.addEventListener('resize', () => {
    // When moving to large screen, close mobile panel
    if (window.innerWidth > 768 && panel && panel.classList.contains('open')) {
      closeMenu();
    }
  });

  // Optional: close on navigation (hashchange) to handle anchor jumps
  window.addEventListener('hashchange', () => {
    if (panel && panel.classList.contains('open')) closeMenu();
  });

})();
  /* ===========================================================================================================================================================================================================================================================
 .testimonials
   ==========================================================================================================================================================================================================================================================*/
   document.addEventListener("DOMContentLoaded", () => {
    const grid = document.querySelector(".testimonial-grid");
    const cards = Array.from(grid.querySelectorAll(".card"));
  
    // Sort cards based on their x position (left-to-right)
    const orderedCards = cards.sort((a, b) => {
      const aLeft = a.getBoundingClientRect().left;
      const bLeft = b.getBoundingClientRect().left;
      return aLeft - bLeft;
    });
  
    console.log("Cards ordered left-to-right:", orderedCards);
  
    // Optional: re-append them in sorted order (ensures DOM order matches visual order)
    orderedCards.forEach(card => grid.appendChild(card));
  });
  document.addEventListener("DOMContentLoaded", () => {
    const grid = document.querySelector(".testimonial-grid");
    const wrap = document.querySelector(".testimonials .wrap");
    const rightBtn = document.querySelector(".change-background-r");
    const leftBtn  = document.querySelector(".change-background-l");
  
    let cards = Array.from(grid.querySelectorAll(".card"));
  
    // Centers the active card inside the wrap by translating the grid.
    // Uses bounding boxes so it's responsive.
    function centerActive(animate = true) {
      const active = cards.find(c => c.classList.contains('active')) || cards[Math.floor(cards.length/2)];
      if (!active) return;
  
      // Get center x of wrap and active card
      const wrapRect = wrap.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();
  
      // distance from wrap center to active center (positive = need to push grid right)
      const wrapCenterX = wrapRect.left + wrapRect.width / 2;
      const activeCenterX = activeRect.left + activeRect.width / 2;
      const delta = wrapCenterX - activeCenterX;
  
      // Apply transform to the grid to move active to wrap center.
      // We set transform directly (not relative) so it works on resize / repeated calls.
      if (!animate) {
        // temporarily disable transition
        grid.style.transition = 'none';
        grid.style.transform = `translateX(${delta}px)`;
        // force reflow then restore transition
        grid.getBoundingClientRect();
        grid.style.transition = '';
      }
    }
  
    // Renders DOM order, runs FLIP animation, then recenters
    function renderCards(animate = true) {
      // 1) record first positions
      const firstRects = new Map();
      cards.forEach(card => firstRects.set(card, card.getBoundingClientRect()));
  
      // 2) re-append in new order (this updates the DOM)
      cards.forEach(card => grid.appendChild(card));
  
      // 3) set active class (middle)
      cards.forEach(c => c.classList.remove("active"));
      const middleIndex = Math.floor(cards.length / 2);
      cards[middleIndex].classList.add("active");
  
      if (!animate) {
        // no FLIP, but we still need to center
        centerActive(false);
        return;
      }
  
      // 4) record last positions and perform FLIP on each card
      const lastRects = new Map();
      cards.forEach(card => lastRects.set(card, card.getBoundingClientRect()));
  
      cards.forEach(card => {
        const first = firstRects.get(card);
        const last = lastRects.get(card);
        if (!first || !last) return;
  
        const dx = first.left - last.left;
        const dy = first.top - last.top;
  
        if (dx === 0 && dy === 0) return;
  
        // Invert
        card.style.transition = 'none';
        card.style.transform = `translate(${dx}px, ${dy}px)`;
  
        // Force reflow
        card.getBoundingClientRect();
  
        // Play: animate transform back to natural spot
        requestAnimationFrame(() => {
          card.style.transition = 'transform .45s cubic-bezier(.2,.9,.3,1)';
          card.style.transform = '';
        });
  
        // Cleanup when transition ends
        const cleanup = () => {
          card.style.transition = '';
          card.style.transform = '';
          card.removeEventListener('transitionend', cleanup);
        };
        card.addEventListener('transitionend', cleanup);
      });
  
      // After a short delay (equal to the FLIP duration), recenter the grid so the visible
      // movement looks natural. We call centerActive() slightly after FLIP completes.
      const FLIP_DURATION = 450; // ms (match the animation above)
      setTimeout(() => centerActive(true), FLIP_DURATION - 40);
    }
  
    // rotate right: last becomes first
    function rotateRight() {
      const last = cards.pop();
      cards.unshift(last);
      renderCards(true);
    }
  
    // rotate left: first goes to end
    function rotateLeft() {
      const first = cards.shift();
      cards.push(first);
      renderCards(true);
    }
  
    // Attach events
    rightBtn.addEventListener('click', rotateRight);
    leftBtn.addEventListener('click', rotateLeft);
  
    // Re-center on resize (debounced-ish)
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => centerActive(false), 120);
    });
  
    // Initial render without FLIP animation
    renderCards(false);
  });
  
  

