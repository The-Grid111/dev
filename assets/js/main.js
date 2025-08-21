// THE GRID — UI HOTFIX (safe, compact)
// Restores: Customize panel, Join Now scroll, spinning logo video fallback,
// and Library tabs + hero picker from assets/manifest.json.

(() => {
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // ---------- Greeting ----------
  try {
    const h = new Date().getHours();
    const word = h<12?'Good morning':h<18?'Good afternoon':'Good evening';
    const hello = $('#hello'); if (hello) hello.textContent = `${word} — THE GRID`;
  } catch {}

  // ---------- Spinning logo (video with img fallback) ----------
  try {
    const v = $('#logoVid');
    if (v) {
      v.src = 'assets/videos/gc_spin.mp4';
      v.muted = true; v.autoplay = true; v.loop = true; v.playsInline = true;
      v.onerror = () => { 
        const img = new Image(); img.src = 'assets/images/gc_logo.png'; img.alt = 'Logo';
        v.replaceWith(img);
      };
    }
  } catch {}

  // ---------- Customize panel open ----------
  try {
    const btn = $('#btnCustomize');
    const dlg = $('#panel');
    if (btn && dlg && typeof dlg.showModal === 'function') {
      btn.onclick = () => dlg.showModal();
    }
    // Keep Save/Reset working if present
    const save = $('#save'), reset = $('#reset');
    if (save) save.onclick = () => {
      try { localStorage.setItem('thegrid.settings.savedAt', Date.now()); alert('Saved to this device.'); } catch {}
    };
    if (reset) reset.onclick = () => { localStorage.clear(); location.reload(); };
  } catch {}

  // ---------- Join Now scroll to pricing ----------
  try {
    const j = $('#btnJoin'), target = $('#plans');
    if (j && target) j.onclick = () => target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch {}

  // ---------- Hero swap helper ----------
  function setHero(src) {
    const box = $('#hero'); if (!box || !src) return;
    box.innerHTML = '<div class="heroOverlay"></div>';
    const isVid = /\.(mp4|webm|mov)$/i.test(src);
    const el = document.createElement(isVid ? 'video' : 'img');
    if (isVid) Object.assign(el, { src, controls: true, playsInline: true, className:'hero-media' });
    else       Object.assign(el, { src, alt:'hero', className:'hero-media' });
    box.prepend(el);
    // sync dropdown if present
    const sel = $('#uiHero'); if (sel) sel.value = src;
  }

  // ---------- Library (manifest-aware) ----------
  async function buildLibrary() {
    const tabsEl = $('#libTabs'), gridEl = $('#libGrid');
    if (!tabsEl || !gridEl) return; // page might be mid-update

    let manifest;
    try {
      const res = await fetch('assets/manifest.json', { cache: 'no-store' });
      if (res.ok) manifest = await res.json();
    } catch {}
    if (!manifest) {
      manifest = {
        "Hero": ["assets/videos/hero_1.mp4","assets/images/hero_1.jpg"],
        "Reels 9:16": [],
        "Reels 16:9": [],
        "Backgrounds": [],
        "Logos": ["assets/videos/gc_spin.mp4","assets/images/gc_logo.png"],
        "Images": ["assets/images/hero_1.jpg"]
      };
    }

    const cats = Object.keys(manifest);
    const active = localStorage.getItem('thegrid.activeTab') || cats[0];

    // tabs
    tabsEl.innerHTML = '';
    cats.forEach(cat => {
      const pill = document.createElement('div');
      pill.className = 'pill' + (cat === active ? ' active' : '');
      pill.textContent = cat;
      pill.onclick = () => { localStorage.setItem('thegrid.activeTab', cat); renderGrid(cat); renderTabs(cat); };
      tabsEl.appendChild(pill);
    });

    function renderTabs(cur) {
      $$('.pill', tabsEl).forEach(p => p.classList.toggle('active', p.textContent === cur));
    }

    function renderGrid(cat) {
      const list = manifest[cat] || [];
      gridEl.innerHTML = '';
      list.forEach(src => {
        const row = document.createElement('div'); row.className = 'tile';
        const th  = document.createElement('div'); th.className  = 'thumb';
        const label = document.createElement('div');
        label.innerHTML = `<b>${src.split('/').pop()}</b><div class="meta">${src}</div>`;

        if (/\.(mp4|webm|mov)$/i.test(src)) {
          const v = document.createElement('video');
          Object.assign(v, { src, muted:true, playsInline:true, loop:true, autoplay:true });
          th.appendChild(v);
        } else {
          const i = new Image(); i.src = src; th.appendChild(i);
        }

        row.append(th, label);
        row.onclick = () => setHero(src);
        gridEl.appendChild(row);
      });

      // Fill hero select if present
      const sel = $('#uiHero');
      if (sel) {
        const all = [...new Set(Object.values(manifest).flat())];
        sel.innerHTML = '';
        all.forEach(src => sel.add(new Option(src, src, false, false)));
        sel.oninput = e => setHero(e.target.value);
      }
    }

    renderGrid(active);
    renderTabs(active);
  }

  // ---------- Apply saved design (from owner-core.json + localStorage) ----------
  async function applyDesign() {
    try {
      const res = await fetch('assets/data/owner-core.json', { cache:'no-store' });
      if (!res.ok) return;
      const cfg = await res.json();
      const r = document.documentElement.style;

      // Theme
      const d = cfg.design || {};
      if (d.accent)          r.setProperty('--accent', d.accent);
      if (d.accentSecondary) r.setProperty('--accent-2', d.accentSecondary);
      if (d.text)            r.setProperty('--ink', d.text);
      if (d.softText)        r.setProperty('--soft', d.softText);
      if (d.cardSurface)     r.setProperty('--card', d.cardSurface);
      if (d.panelSurface)    r.setProperty('--panel', d.panelSurface);
      if (d.bgA)             r.setProperty('--bg-a', d.bgA);
      if (d.bgB)             r.setProperty('--bg-b', d.bgB);
      if (d.cardRadius != null) r.setProperty('--radius', d.cardRadius + 'px');
      if (d.borderGlow != null) r.setProperty('--ring', d.borderGlow);
      if (d.fontScale != null)  r.setProperty('--fontScale', d.fontScale);
      if (d.spacingScale != null) r.setProperty('--space', d.spacingScale);
      if (d.vignette != null)  r.setProperty('--vignette', d.vignette ? 1 : 0);

      // Hero
      const hero = cfg.hero?.source;
      if (hero) setHero(hero);
    } catch {}
  }

  // Kickoff
  document.addEventListener('DOMContentLoaded', () => {
    applyDesign();
    buildLibrary();
  });
})();
