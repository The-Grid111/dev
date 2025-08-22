*** Begin Patch
*** Update File: dev/assets/js/main.js
/* THE GRID — main.js (baseline)
   Goal: minimal, robust behaviour with zero errors even if elements are missing.
   - Smooth scroll for internal links & buttons
   - Buttons: Choose / Details / Start Setup / Order Pack / Get Pack wired
   - Header chips: Library / Pricing / Contact wired
   - Safe no-ops if targets don’t exist
*/

(function () {
  "use strict";

  // ========== Helpers ==========
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const smoothScrollTo = (targetSelector) => {
    const el = typeof targetSelector === "string" ? $(targetSelector) : targetSelector;
    if (!el) return false;
    try {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      return true;
    } catch { return false; }
  };

  // Best effort anchor resolution: id, name, or section heading with the text
  const resolveTarget = (prefList) => {
    for (const t of prefList) {
      if (typeof t === "string" && t.startsWith("#") && $(t)) return t;
      if (typeof t === "string" && !t.startsWith("#")) {
        const byId = $("#" + t);
        if (byId) return "#" + t;
        const byName = $(`[name="${t}"]`);
        if (byName) return `[name="${t}"]`;
        // Try section headings that contain the label text
        const heading = $$("h1,h2,h3,h4,h5").find(h =>
          (h.textContent || "").trim().toLowerCase().includes(t.toLowerCase())
        );
        if (heading) return heading;
      }
    }
    return null;
  };

  // ========== Global nav chips ==========
  const wireNav = () => {
    const navMap = [
      { text: "Library",  prefs: ["#library", "library"] },
      { text: "Pricing",  prefs: ["#pricing", "plans", "pricing"] },
      { text: "Contact",  prefs: ["#contact", "contact"] },
      { text: "Customize",prefs: ["#library", "library"] }, // acts as “open library”
      { text: "Join Now", prefs: ["#pricing", "plans", "pricing"] },
      { text: "Open Library", prefs: ["#library", "library"] },
      { text: "See Pricing", prefs: ["#pricing", "plans", "pricing"] },
    ];

    // Links or buttons that *visibly* match the labels above
    const candidates = $$('a,button');
    candidates.forEach((el) => {
      const label = (el.textContent || "").trim();
      const match = navMap.find(x => label.toLowerCase() === x.text.toLowerCase());
      if (!match) return;
      el.addEventListener("click", (e) => {
        // If it’s a real link to an external page, let it work
        const href = el.getAttribute("href");
        if (href && /^https?:\/\//i.test(href)) return;
        e.preventDefault();
        const tgt = resolveTarget(match.prefs);
        if (tgt) smoothScrollTo(tgt);
      }, { passive: false });
    });

    // Also auto-wire any anchors with hash hrefs for smooth scroll
    $$('a[href^="#"]').forEach(a => {
      a.addEventListener("click", (e) => {
        const href = a.getAttribute("href");
        if (!href || href === "#") return;
        if ($(href)) { e.preventDefault(); smoothScrollTo(href); }
      }, { passive: false });
    });
  };

  // ========== Plans CTA buttons ==========
  const wirePlans = () => {
    // Buttons typically read: Choose / Details
    const btns = $$("button, a");
    btns.forEach((el) => {
      const label = (el.textContent || "").trim().toLowerCase();

      // “Choose” → take the user to Contact (default) or Pricing if Contact not found
      if (label === "choose") {
        el.addEventListener("click", (e) => {
          const tgt = resolveTarget(["#contact", "contact", "#pricing", "plans"]);
          if (!tgt) return; // nothing to do
          e.preventDefault();
          smoothScrollTo(tgt);
        }, { passive: false });
      }

      // “Details” → take the user to Pricing details section
      if (label === "details") {
        el.addEventListener("click", (e) => {
          const tgt = resolveTarget(["#pricing", "plans", "pricing"]);
          if (!tgt) return;
          e.preventDefault();
          smoothScrollTo(tgt);
        }, { passive: false });
      }

      // Services CTAs
      if (label === "start setup" || label === "order pack" || label === "get pack") {
        el.addEventListener("click", (e) => {
          const tgt = resolveTarget(["#contact", "contact"]);
          if (!tgt) return;
          e.preventDefault();
          smoothScrollTo(tgt);
        }, { passive: false });
      }
    });
  };

  // ========== Contact form (optional graceful handling) ==========
  const wireContactForm = () => {
    const form  = $("form");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      // If no action configured, just keep the page steady and show a tiny toast
      const hasAction = !!form.getAttribute("action");
      if (!hasAction) {
        e.preventDefault();
        try {
          // minimal UX confirmation
          const btn = $('button[type="submit"], button', form) || form;
          btn?.classList.add("pressed");
          setTimeout(() => btn?.classList.remove("pressed"), 250);
          alert("Thanks! We’ll reply from gridcoresystems@gmail.com.");
        } catch {}
      }
    });
  };

  // ========== Init ==========
  const init = () => {
    wireNav();
    wirePlans();
    wireContactForm();
    // Future: gallery filters, manifest-driven content, etc.
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
*** End Patch
