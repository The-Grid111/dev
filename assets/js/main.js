// THE GRID main.js v15 – robust Customize panel controls

(function () {
  console.log("THE GRID main.js v15 loaded");

  // Helpers
  const $  = (sel, r = document) => r.querySelector(sel);
  const $$ = (sel, r = document) => [...r.querySelectorAll(sel)];

  function openPanel() {
    const panel = $("#customize");
    if (!panel) return;
    // unhide if HTML had hidden or CSS display:none
    panel.hidden = false;
    try { panel.style.display = ""; } catch (e) {}
    // smooth scroll into view; fallback to hash
    try {
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (e) {
      window.location.hash = "#customize";
    }
  }

  function closePanel() {
    const panel = $("#customize");
    if (!panel) return;
    panel.hidden = true;
  }

  function bindCustomize() {
    // Avoid double-binding
    if (document.documentElement._gridCustomizeBound) return;
    document.documentElement._gridCustomizeBound = true;

    const openBtn  = $("#open-customize");
    const closeBtn = $("#close-customize");

    if (openBtn) {
      openBtn.addEventListener("click", (e) => {
        e.preventDefault();
        openPanel();
      });
    }
    if (closeBtn) {
      closeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        closePanel();
      });
    }

    // Also make any link/button with text “Customize” open the panel
    $$("a,button").forEach((el) => {
      if (el._gridCustomizeWire) return;
      const text = (el.textContent || "").trim().toLowerCase();

      // If it’s a hash link to #customize, intercept for smooth UX
      const href = (el.getAttribute("href") || "").trim();
      const isHashCustomize = href === "#customize";

      if (isHashCustomize || text.includes("customize")) {
        el.addEventListener("click", (e) => {
          // Only prevent default for anchors (avoid breaking real buttons)
          if (el.tagName === "A") e.preventDefault();
          openPanel();
        });
        el._gridCustomizeWire = true;
      }
    });

    // If URL already has #customize, auto-open on load
    if (location.hash === "#customize") openPanel();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindCustomize);
  } else {
    bindCustomize();
  }
})();
