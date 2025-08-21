/* THE GRID – main.js v15a
   - Fixes Customize button (opens/closes smoothly)
   - Saves/loads theme to localStorage
   - Gallery category filters
*/
(() => {
  // Helpers
  const $  = (sel, r = document) => r.querySelector(sel);
  const $$ = (sel, r = document) => [...r.querySelectorAll(sel)];

  const STORE_KEY = "the-grid-theme";

  // -------------------------
  // Customize panel open/close
  // -------------------------
  function openPanel() {
    const panel = $("#customize");
    if (!panel) return;
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    try { panel.scrollIntoView({ behavior: "smooth", block: "start" }); } catch {}
    // reflect hash for direct links
    if (location.hash !== "#customize") history.replaceState(null, "", "#customize");
  }

  function closePanel() {
    const panel = $("#customize");
    if (!panel) return;
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
    // clean hash if we were on #customize
    if (location.hash === "#customize") history.replaceState(null, "", " ");
  }

  function bindCustomize() {
    // explicit buttons if present
    $("#open-customize")?.addEventListener("click", (e) => {
      e.preventDefault(); openPanel();
    });
    $("#close-customize")?.addEventListener("click", (e) => {
      e.preventDefault(); closePanel();
    });

    // Any link or button that contains the word “Customize”
    $$("a,button").forEach((el) => {
      const text = (el.textContent || "").trim().toLowerCase();
      if (!text) return;
      if (text.includes("customize")) {
        el.addEventListener("click", (e) => {
          // If it’s a hash to #customize, don’t navigate, just open smoothly
          const href = el.getAttribute("href") || "";
          if (href.includes("#customize")) e.preventDefault();
          openPanel();
        });
      }
    });

    // If page loaded with #customize, open the panel
    if (location.hash === "#customize") openPanel();
  }

  // -------------------------
  // Theme save / load
  // -------------------------
  const fields = {
    title:    "#cfg-title",
    tagline:  "#cfg-tagline",
    accent:   "#cfg-accent",
    bg:       "#cfg-bg",
    panel:    "#cfg-panel",
    text:     "#cfg-text",
    radius:   "#cfg-radius"
  };

  function readTheme() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || "{}"); }
    catch { return {}; }
  }
  function writeTheme(s) {
    localStorage.setItem(STORE_KEY, JSON.stringify(s));
  }
  function applyTheme(s) {
    const root = document.documentElement.style;
    if (s.accent) root.setProperty("--accent", s.accent);
    if (s.bg)     root.setProperty("--bg", s.bg);
    if (s.panel)  root.setProperty("--panel", s.panel);
    if (s.text)   root.setProperty("--text", s.text);
    if (s.radius !== undefined) root.setProperty("--radius", (s.radius|0) + "px");
    if (s.title)   $("#site-title")?.textContent = s.title;
    if (s.tagline) $("#tagline")?.textContent   = s.tagline;
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
      radius:  Number(pick(fields.radius) || 20)
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
    // Live updates when inputs change
    $$("#customize input").forEach((el) => {
      el.addEventListener("input", () => {
        const s = currentThemeFromInputs();
        applyTheme(s);
      });
    });
    // Save / Reset / Export
    $("#cfg-save")?.addEventListener("click", (e) => {
      e.preventDefault();
      const s = currentThemeFromInputs();
      writeTheme(s);
      alert("Saved ✨");
    });
    $("#cfg-reset")?.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem(STORE_KEY);
      location.reload();
    });
    $("#cfg-export")?.addEventListener("click", (e) => {
      e.preventDefault();
      const blob = new Blob([ JSON.stringify(readTheme(), null, 2) ], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement("a"), { href: url, download: "the-grid-theme.json" });
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // -------------------------
  // Gallery filters
  // -------------------------
  function bindGalleryFilters() {
    const items = $$(".grid .grid-item");
    const btns  = $$(".filters [data-filter]");
    if (!items.length || !btns.length) return;

    function applyFilter(cat) {
      items.forEach((it) => {
        const ok = cat === "all" || (it.getAttribute("data-cat") || "").split(" ").includes(cat);
        it.style.display = ok ? "" : "none";
      });
      btns.forEach((b) => b.classList.toggle("active", b.dataset.filter === cat));
    }

    btns.forEach((b) => {
      b.addEventListener("click", (e) => {
        e.preventDefault();
        applyFilter(b.dataset.filter || "all");
      });
    });

    // default: show all
    applyFilter("all");
  }

  // -------------------------
  // Init
  // -------------------------
  function init() {
    bindCustomize();
    bindThemeControls();
    bindGalleryFilters();

    // Load saved theme
    const saved = readTheme();
    applyTheme(saved);
    fillInputsFromTheme(saved);
    console.log("THE GRID main.js v15a loaded");
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else
    init();
})();
