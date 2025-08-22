/* THE GRID — Hotfix / Customizer
   Drop-in design panel that requires no HTML changes.
   Injects its own CSS + UI, binds to the "Customize" button if present,
   persists settings to localStorage, and applies themes per section.
*/
(() => {
  const STORE_KEY = "tgDesign";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  // ---- Inject CSS (scoped, safe) ------------------------------------------
  const css = `
  :root{
    --tg-accent:#EAB308;        /* gold */
    --tg-text-1:#EAEAEA;
    --tg-text-2:#B8B8B8;
    --tg-surface:#0E1116;
    --tg-surface-2:#11151B;
    --tg-radius:18px;
    --tg-glow:0.35;
    --tg-lib-h:220px;           /* default library tile min-height */
  }
  body{ --tg-shadow: 0 10px 40px rgba(0,0,0,.6); }

  /* Section theme tokens (per-section via data-theme attr) */
  [data-theme="gold"]{
    --tg-accent:#EAB308;
    --tg-surface-2: linear-gradient(180deg,#0F1319 0%, #0B0E13 100%);
  }
  [data-theme="ocean"]{
    --tg-accent:#22D3EE;
    --tg-surface-2: linear-gradient(180deg,#0e1b25 0%, #0b131a 100%);
  }
  [data-theme="rose"]{
    --tg-accent:#FB7185;
    --tg-surface-2: linear-gradient(180deg,#1b0e15 0%, #120a10 100%);
  }
  [data-theme="forest"]{
    --tg-accent:#34D399;
    --tg-surface-2: linear-gradient(180deg,#0f1b16 0%, #0a120f 100%);
  }
  [data-theme="slate"]{
    --tg-accent:#93C5FD;
    --tg-surface-2: linear-gradient(180deg,#101418 0%, #0b0f13 100%);
  }

  /* Soft glow used around accent buttons/cards */
  .tg-glow{
    box-shadow:
      0 0 0 1px rgba(255,255,255,.04),
      0 12px 40px rgba(0,0,0,.5),
      0 0 60px calc(var(--tg-glow) * 80px) color-mix(in oklab, var(--tg-accent) 35%, transparent);
  }

  /* ---------- Customizer panel ---------- */
  .tg-fab{
    position: fixed; inset: auto 20px 20px auto; z-index: 9999;
    width: 48px; height: 48px; border-radius: 999px;
    background: var(--tg-accent); color:#111; font-weight:700;
    display:flex; align-items:center; justify-content:center; cursor:pointer;
    box-shadow: var(--tg-shadow);
  }
  .tg-customizer{
    position: fixed; top: 16px; right: 16px; width: 360px; max-width: 92vw;
    background: #0d1117; color: var(--tg-text-1); border-radius: 16px;
    border: 1px solid rgba(255,255,255,.06); box-shadow: var(--tg-shadow);
    padding: 14px; z-index: 9999; transform: translateX(120%); transition: .25s ease;
  }
  .tg-customizer.open{ transform: translateX(0); }
  .tg-row{ display:flex; gap:10px; align-items:center; margin:10px 0; }
  .tg-row > label{ flex:1; font-size:14px; color:var(--tg-text-2); }
  .tg-row > input[type="range"]{ flex:2; }
  .tg-row > input[type="color"]{ width:40px; height:28px; border:0; background:transparent; }
  .tg-select{ width:100%; padding:8px 10px; background:#0b0f14; border:1px solid rgba(255,255,255,.08); border-radius:10px; color:var(--tg-text-1); }
  .tg-head{ display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:6px; }
  .tg-title{ font-weight:700; letter-spacing:.2px; }
  .tg-x{ background:#131823; border:1px solid rgba(255,255,255,.08); width:32px; height:32px; border-radius:10px; color:var(--tg-text-2); cursor:pointer; }
  .tg-hr{ height:1px; background:rgba(255,255,255,.06); margin:10px 0; border:0; }
  .tg-btn{
    padding:8px 12px; border-radius:12px; border:1px solid rgba(255,255,255,.08);
    background:#0b0f14; color:var(--tg-text-1); cursor:pointer;
  }
  .tg-btn.primary{ background: var(--tg-accent); color:#111; font-weight:700; border-color: transparent; }
  .tg-caption{ font-size:12px; color:var(--tg-text-2); }
  /* Try to catch common library card classes for height control */
  #library .tile, #library .card, #library .lib-tile, #library .media, #library .showcase, #library .panel{
    min-height: var(--tg-lib-h);
  }
  `;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  // ---- Build panel ---------------------------------------------------------
  const panel = document.createElement("div");
  panel.className = "tg-customizer";
  panel.innerHTML = `
    <div class="tg-head">
      <div class="tg-title">Design Panel</div>
      <button class="tg-x" aria-label="Close">×</button>
    </div>

    <div class="tg-row">
      <label>Accent</label>
      <input id="tgAccent" type="color" value="#EAB308" />
      <span class="tg-caption">Buttons & glow</span>
    </div>

    <div class="tg-row">
      <label>Corner radius</label>
      <input id="tgRadius" type="range" min="8" max="28" step="1">
    </div>

    <div class="tg-row">
      <label>Glow intensity</label>
      <input id="tgGlow" type="range" min="0" max="1" step="0.01">
    </div>

    <hr class="tg-hr"/>

    <div class="tg-row" style="flex-direction:column;align-items:stretch">
      <label style="width:100%">Theme per section</label>
      <select id="tgSection" class="tg-select">
        <option value="hero">Hero</option>
        <option value="library">Library</option>
        <option value="plans">Plans</option>
        <option value="services">Services</option>
        <option value="contact">Contact</option>
      </select>
      <select id="tgTheme" class="tg-select" style="margin-top:8px">
        <option value="gold">Gold (brand)</option>
        <option value="ocean">Ocean</option>
        <option value="rose">Rose</option>
        <option value="forest">Forest</option>
        <option value="slate">Slate</option>
      </select>
      <div style="display:flex;gap:8px;margin-top:8px">
        <button id="tgApplyTheme" class="tg-btn primary">Apply theme</button>
        <button id="tgClearTheme" class="tg-btn">Clear</button>
      </div>
      <span class="tg-caption">Applies a palette + surface to that section only.</span>
    </div>

    <div class="tg-row" style="flex-direction:column;align-items:stretch">
      <label style="width:100%">Library tile height</label>
      <input id="tgLibH" type="range" min="160" max="420" step="10">
      <span class="tg-caption">Affects tiles in the Library grid.</span>
    </div>

    <hr class="tg-hr"/>

    <div class="tg-row" style="justify-content:space-between">
      <button id="tgClose" class="tg-btn">Close</button>
      <button id="tgReset" class="tg-btn">Reset</button>
      <button id="tgSave" class="tg-btn primary">Save</button>
    </div>
  `;
  document.body.appendChild(panel);

  // Fallback FAB if we don't find the existing "Customize" button
  const fab = document.createElement("button");
  fab.className = "tg-fab tg-glow";
  fab.title = "Customize";
  fab.textContent = "⚙︎";
  document.body.appendChild(fab);
  fab.style.display = "none"; // hidden unless needed

  // ---- Helpers to read/apply settings -------------------------------------
  const els = {
    accent: $("#tgAccent", panel),
    radius: $("#tgRadius", panel),
    glow: $("#tgGlow", panel),
    section: $("#tgSection", panel),
    theme: $("#tgTheme", panel),
    libH: $("#tgLibH", panel),
    apply: $("#tgApplyTheme", panel),
    clear: $("#tgClearTheme", panel),
    save: $("#tgSave", panel),
    reset: $("#tgReset", panel),
    close: $("#tgClose", panel),
    x: panel.querySelector(".tg-x")
  };

  const sections = {
    hero: $("#hero") || document.body,
    library: $("#library") || $("#Library") || document.body,
    plans: $("#plans") || $("#Plans") || document.body,
    services: $("#services") || $("#Services") || document.body,
    contact: $("#contact") || $("#Contact") || document.body
  };

  const defaultState = {
    accent: getComputedStyle(document.documentElement).getPropertyValue("--tg-accent").trim() || "#EAB308",
    radius: 18,
    glow: 0.35,
    libH: 220,
    perSection: {} // { hero:'gold', ... }
  };

  const loadState = () => {
    try { return Object.assign({}, defaultState, JSON.parse(localStorage.getItem(STORE_KEY) || "{}")); }
    catch { return { ...defaultState }; }
  };

  const state = loadState();

  const applyState = () => {
    document.documentElement.style.setProperty("--tg-accent", state.accent);
    document.documentElement.style.setProperty("--tg-radius", state.radius + "px");
    document.documentElement.style.setProperty("--tg-glow", String(state.glow));
    document.documentElement.style.setProperty("--tg-lib-h", state.libH + "px");

    // Clear old themes
    Object.values(sections).forEach(sec => sec && sec.removeAttribute("data-theme"));
    // Apply per-section themes
    Object.entries(state.perSection || {}).forEach(([k, v]) => {
      const sec = sections[k];
      if (sec && v) sec.setAttribute("data-theme", v);
    });

    // Reflect into controls
    els.accent.value = toHex(state.accent) || "#EAB308";
    els.radius.value = state.radius;
    els.glow.value = state.glow;
    els.libH.value = state.libH;
  };

  const toHex = (val) => {
    // accept hex or rgb() and return hex
    if (!val) return null;
    if (val.startsWith("#")) return val;
    const m = val.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (!m) return null;
    const [r,g,b] = m.slice(1).map(n=>parseInt(n,10));
    return "#" + [r,g,b].map(x=>x.toString(16).padStart(2,"0")).join("");
  };

  const save = () => localStorage.setItem(STORE_KEY, JSON.stringify(state));

  // ---- Wire controls -------------------------------------------------------
  on(els.accent, "input", e => {
    state.accent = e.target.value;
    document.documentElement.style.setProperty("--tg-accent", state.accent);
  });

  on(els.radius, "input", e => {
    state.radius = +e.target.value;
    document.documentElement.style.setProperty("--tg-radius", state.radius + "px");
  });

  on(els.glow, "input", e => {
    state.glow = +e.target.value;
    document.documentElement.style.setProperty("--tg-glow", String(state.glow));
  });

  on(els.libH, "input", e => {
    state.libH = +e.target.value;
    document.documentElement.style.setProperty("--tg-lib-h", state.libH + "px");
  });

  on(els.apply, "click", () => {
    const sKey = els.section.value;
    const theme = els.theme.value;
    state.perSection = state.perSection || {};
    state.perSection[sKey] = theme;
    applyState();
  });

  on(els.clear, "click", () => {
    const sKey = els.section.value;
    if (state.perSection) delete state.perSection[sKey];
    applyState();
  });

  on(els.save, "click", () => { save(); toast("Saved"); });
  on(els.reset, "click", () => {
    localStorage.removeItem(STORE_KEY);
    Object.assign(state, defaultState);
    applyState();
    toast("Reset");
  });

  const open = () => panel.classList.add("open");
  const close = () => panel.classList.remove("open");
  on(els.close, "click", close);
  on(els.x, "click", close);

  // Bind to existing "Customize" button if present; else show FAB
  const customizeBtn =
    $("#customize") ||
    $$("button,a").find(b => (b.textContent || "").trim().toLowerCase() === "customize");
  if (customizeBtn) on(customizeBtn, "click", (e)=>{ e.preventDefault(); open(); });
  else fab.style.display = "flex", on(fab, "click", open);

  // Small toast helper
  function toast(txt){
    const t = document.createElement("div");
    t.textContent = txt;
    Object.assign(t.style, {
      position:"fixed", left:"50%", bottom:"24px", transform:"translateX(-50%)",
      background:"#0d1117", color:"#eaeaea", padding:"10px 14px",
      border:"1px solid rgba(255,255,255,.08)", borderRadius:"12px",
      boxShadow:"0 8px 30px rgba(0,0,0,.5)", zIndex:99999, opacity:"0",
      transition:"opacity .2s ease"
    });
    document.body.appendChild(t);
    requestAnimationFrame(()=> t.style.opacity="1");
    setTimeout(()=>{ t.style.opacity="0"; setTimeout(()=> t.remove(), 200); }, 1200);
  }

  // First paint
  applyState();

  // Bonus: add subtle glow to any primary buttons if they already have brand classnames
  $$('a,button').forEach(el => {
    const label = (el.textContent || "").trim().toLowerCase();
    if (["choose","order pack","start setup","get pack","send","join now","customize"].includes(label)) {
      el.classList.add("tg-glow");
      el.style.borderRadius = "var(--tg-radius)";
    }
  });
})();
