/* assets/js/main.js
 * THE GRID — main.js v15b
 * - Smooth Customize drawer (open/close, hash support)
 * - Live theme editing + save/load/export (localStorage)
 * - Gallery category filters (robust text + data-* fallback)
 * - Safe, idempotent; runs once even if re-initialized
 */
(() => {
  // ----------------------------
  // Helpers
  // ----------------------------
  const $  = (sel, r = document) => r.querySelector(sel);
  const $$ = (sel, r = document) => [...r.querySelectorAll(sel)];
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);

  const STORE_KEY = "the-grid-theme";
  const LOG = (...a) => console && console.log && console.log("[GRID]", ...a);

  // Prevent double init across hot reloads
  if (document.documentElement.__gridInitDone) return;
  document.documentElement.__gridInitDone = true;

  // ----------------------------
  // Customize drawer
  // ----------------------------
  function getPanel() { return $("#customize"); }

  function openPanel() {
    const panel = getPanel();
    if (!panel) return;
    panel.removeAttribute("hidden");
    panel.setAttribute("aria-hidden", "false");
    panel.classList.add("open");
    try { panel.scrollIntoView({ behavior: "smooth", block: "start" }); } catch {}
    // keep hash in sync (helps on mobile refresh)
    if (location.hash !== "#customize") {
      try { history.replaceState(null, "", "#customize"); } catch { location.hash = "#customize"; }
    }
  }

  function closePanel() {
    const panel = getPanel();
    if (!panel) return;
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
    // We keep the element in DOM; hidden attr helps CSS-only fallback
    panel.setAttribute("hidden", "");
    if (location.hash === "#customize") {
      try { history.replaceState(null, "", " "); } catch { location.hash = ""; }
    }
  }

  function bindCustomizeControls() {
    // explicit buttons if present
    on($("#open-customize"),  "click", (e) => { e.preventDefault(); openPanel(); });
    on($("#close-customize"), "click", (e) => { e.preventDefault(); closePanel(); });

    // Any link or button that contains the word "Customize" (case-insensitive)
    $$("a,button").forEach((el) => {
      if (el.__gridCustomizeBound) return;
      const text = (el.textContent || "").toLowerCase();
      if (!text) return;
      if (text.includes("customize")) {
        on(el, "click", (e) => {
          // If it's an anchor pointing to #customize, don't navigate; open smoothly
          const href = (el.getAttribute("href") || "").trim();
          if (href.includes("#customize")) e.preventDefault();
          openPanel();
        });
        el.__gridCustomizeBound = true;
      }
    });

    // If page loads with #customize in URL, open automatically
    if (location.hash === "#customize") openPanel();
  }

  // ----------------------------
  // Theme save / load / live apply
  // ----------------------------
  const fields = {
    title:   "#cfg-title",
    tagline: "#cfg-tagline",
    accent:  "#cfg-accent",
    bg:      "#cfg-bg",
    panel:   "#cfg-panel",
    text:    "#cfg-text",
    radius:  "#cfg-radius",
  };

  function readTheme() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || "{}"); }
    catch { return {}; }
  }

  function writeTheme(s) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); }
    catch {}
  }

  function applyTheme(s) {
    const root = document.documentElement.style;
    if (s.accent) root.setProperty("--accent", s.accent);
    if (s.bg)     root.setProperty("--bg",     s.bg);
    if (s.panel)  root.setProperty("--panel",  s.panel);
    if (s.text)   root.setProperty("--text",   s.text);
    if (s.radius !== undefined) root.setProperty("--radius", (s.radius|0) + "px");

    if (s.title)   $("#site-title")?.textContent = s.title;
    if (s.tagline) $("#tagline")?.textContent    = s.tagline;
  }

  function currentThemeFromInputs() {
    const pick = (sel) => $(sel)?.value;
    return {
      title:   pick(fields.title),
      tagline: pick(fields.tagline),
      accent:  pick(fields.accent),
      bg:      pick(fields.bg),
      panel:   pick(fields.panel),
      text:    pick(fields.text),
      radius:  Number(pick(fields.radius) || 20),
    };
  }

  function fillInputsFromTheme(s) {
    const set = (sel, v) => { const el = $(sel); if (el && v !== undefined) el.value = v; };
    set(fields.title,   s.title);
    set(fields.tagline, s.tagline);
    set(fields.accent,  s.accent);
    set(fields.bg,      s.bg);
    set(fields.panel,   s.panel);
    set(fields.text,    s.text);
    set(fields.radius,  s.radius ?? 20);
  }

  function bindThemeControls() {
    // Live updates on input
    $$("#customize input").forEach((el) => {
      on(el, "input", () => {
        const s = currentThemeFromInputs();
        applyTheme(s);
      });
    });

    // Save
    on($("#cfg-save"), "click", (e) => {
      e.preventDefault();
      const s = currentThemeFromInputs();
      writeTheme(s);
      applyTheme(s);
    });

    // Reset (clears store + resets UI to defaults)
    on($("#cfg-reset"), "click", (e) => {
      e.preventDefault();
      try { localStorage.removeItem(STORE_KEY); } catch {}
      const defaults = {
        accent:  "#10b9e3",
        bg:      "#0b1216",
        panel:   "#0f1b20",
        text:    "#e6f5ff",
        radius:  20,
        title:   "THE GRID",
        tagline: "Cinematic AI visuals & TikTok creator hub"
      };
      fillInputsFromTheme(defaults);
      applyTheme(defaults);
    });

    // Export
    on($("#cfg-export"), "click", (e) => {
      e.preventDefault();
      const s = currentThemeFromInputs();
      const blob = new Blob([JSON.stringify(s, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "the-grid-theme.json";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });

    // Load stored theme at start
    const saved = readTheme();
    if (Object.keys(saved).length) {
      fillInputsFromTheme(saved);
      applyTheme(saved);
    } else {
      // If no saved theme, prefill current DOM values if present
      const initial = currentThemeFromInputs();
      applyTheme(initial);
    }
  }

  // ----------------------------
  // Gallery filters (robust)
  // ----------------------------
  function bindGalleryFilters() {
    const container = document.querySelector(".gallery") || document;
    const buttons = $$(".gallery-filters [data-filter], .gallery-filters button, .gallery-filters a", container);
    const tiles   = $$(".gallery [data-cat], .gallery .tile", container);

    if (!buttons.length || !tiles.length) return;

    // Infer category from data-cat OR text fallback on tile (class names last resort)
    const getCats = (el) => {
      const raw = el.getAttribute?.("data-cat");
      if (raw) return raw.split(",").map(s => s.trim().toLowerCase());
      const t = (el.getAttribute?.("data-title") || el.title || el.alt || el.textContent || "").toLowerCase();
      const cats = [];
      if (t.includes("tiktok")) cats.push("tiktok");
      if (t.includes("character")) cats.push("characters");
      if (t.includes("vfx")) cats.push("vfx");
      return cats.length ? cats : ["misc"];
    };

    tiles.forEach(el => { el.__cats = getCats(el); });

    function activate(filter) {
      const f = (filter || "all").toLowerCase();
      tiles.forEach(el => {
        const show = f === "all" ? true : (el.__cats || []).includes(f);
        el.style.display = show ? "" : "none";
      });
      buttons.forEach(b => b.classList.toggle("active",
        (b.dataset.filter || b.textContent || "").trim().toLowerCase() === f || (f === "all" && (b.dataset.filter || b.textContent || "").trim().toLowerCase() === "all")
      ));
    }

    buttons.forEach(btn => {
      if (btn.__gridFilterBound) return;
      btn.__gridFilterBound = true;
      on(btn, "click", (e) => {
        e.preventDefault();
        const value = (btn.dataset.filter || btn.textContent || "all").trim().toLowerCase();
        activate(value);
      });
    });

    // Start with "all"
    activate("all");
  }

  // ----------------------------
  // Start
  // ----------------------------
  function init() {
    LOG("main.js v15b init");
    bindCustomizeControls();
    bindThemeControls();
    bindGalleryFilters();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
