/* THE GRID — core front-end
   Purpose: load manifest, build Library, wire Hero, basic UI hooks
   File: assets/js/main.js
*/

(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // ---------- State ----------
  const state = {
    heroSrc: 'assets/videos/hero_1.mp4',
    manifest: null,
    categories: [],
    activeCat: null
  };

  // ---------- Logo + Greeting ----------
  function initHeader() {
    const h = new Date().getHours();
    const word = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
    const hello = $('#hello');
    if (hello) hello.textContent = `${word} — THE GRID`;

    const vid = $('#logoVid');
    if (vid) {
      vid.src = 'assets/videos/gc_spin.mp4';
      vid.onerror = () => {
        const img = document.createElement('img');
        img.alt = 'Logo';
        img.src = 'assets/images/gc_logo.png';
        vid.replaceWith(img);
      };
    }
  }

  // ---------- Hero ----------
  function renderHero() {
    const holder = $('#hero');
    if (!holder) return;
    holder.innerHTML = ''; // clear (index provides overlay if needed)
    const src = state.heroSrc;

    if (/\.(mp4|webm|mov)$/i.test(src)) {
      const v = document.createElement('video');
      v.className = 'hero-media';
      v.src = src;
      v.controls = true;
      v.playsInline = true;
      holder.prepend(v);
    } else {
      const i = document.createElement('img');
      i.className = 'hero-media';
      i.alt = 'hero';
      i.src = src;
      holder.prepend(i);
    }
  }

  function setHero(src) {
    state.heroSrc = src;
    try { localStorage.setItem('thegrid.hero', src); } catch(e){}
    renderHero();
    // keep the Customize select (if present) synced
    const sel = $('#uiHero');
    if (sel) sel.value = src;
  }

  // ---------- Manifest ----------
  const defaultManifest = {
    "Hero": [
      "assets/videos/hero_1.mp4",
      "assets/videos/interaction_1.mp4",
      "assets/images/hero_1.jpg",
      "assets/images/hero_2.jpg",
      "assets/images/hero_3.jpg"
    ],
    "Reels 9:16": [],
    "Reels 16:9": [
      "assets/videos/hero_1.mp4",
      "assets/videos/natural_1.mp4",
      "assets/videos/spread_1.mp4",
      "assets/videos/transform_1.mp4",
      "assets/videos/pour_1.mp4",
      "assets/videos/interaction_1.mp4",
      "assets/videos/gc_spin.mp4"
    ],
    "Backgrounds": [
      "assets/images/hero_1.jpg",
      "assets/images/hero_2.jpg",
      "assets/images/hero_3.jpg"
    ],
    "Logos": [
      "assets/videos/gc_spin.mp4",
      "assets/images/gc_logo.png"
    ],
    "Images": [
      "assets/images/hero_1.jpg",
      "assets/images/hero_2.jpg",
      "assets/images/hero_3.jpg"
    ]
  };

  async function loadManifest() {
    let data = null;
    try {
      const res = await fetch('assets/manifest.json', { cache: 'no-store' });
      if (res.ok) data = await res.json();
    } catch (e) {
      // ignored – will fall back
    }
    state.manifest = data || defaultManifest;

    // categories & active
    state.categories = Object.keys(state.manifest);
    const stored = localStorage.getItem('thegrid.activeCat');
    state.activeCat = stored && state.categories.includes(stored)
      ? stored
      : state.categories[0];

    buildLibrary();
    populateHeroSelect();
  }

  // ---------- Library UI ----------
  function buildLibrary() {
    const tabs = $('#libTabs');
    const grid = $('#libGrid');
    if (!tabs || !grid) return;

    tabs.innerHTML = '';
    grid.innerHTML = '';

    state.categories.forEach(cat => {
      const pill = document.createElement('div');
      pill.className = 'pill' + (cat === state.activeCat ? ' active' : '');
      pill.textContent = cat;
      pill.onclick = () => {
        state.activeCat = cat;
        try { localStorage.setItem('thegrid.activeCat', cat); } catch(e){}
        buildLibrary();
      };
      tabs.appendChild(pill);
    });

    const list = state.manifest[state.activeCat] || [];
    if (!list.length) {
      const empty = document.createElement('div');
      empty.className = 'meta';
      empty.textContent = 'No items found in this category.';
      grid.appendChild(empty);
      return;
    }

    list.forEach(src => {
      const row = document.createElement('div');
      row.className = 'tile';

      const thumb = document.createElement('div');
      thumb.className = 'thumb';

      if (/\.(mp4|webm|mov)$/i.test(src)) {
        const v = document.createElement('video');
        v.src = src;
        v.muted = true;
        v.loop = true;
        v.playsInline = true;
        v.autoplay = true;
        thumb.appendChild(v);
      } else {
        const i = document.createElement('img');
        i.src = src;
        i.alt = src.split('/').pop();
        thumb.appendChild(i);
      }

      const label = document.createElement('div');
      label.innerHTML = `<b>${src.split('/').pop()}</b><div class="meta">${src}</div>`;

      row.appendChild(thumb);
      row.appendChild(label);
      row.onclick = () => setHero(src);

      grid.appendChild(row);
    });
  }

  function populateHeroSelect() {
    const sel = $('#uiHero');
    if (!sel) return;
    sel.innerHTML = '';

    const all = [...new Set(Object.values(state.manifest).flat())];
    all.forEach(src => {
      const opt = new Option(src, src, src === state.heroSrc, src === state.heroSrc);
      sel.add(opt);
    });
    sel.oninput = e => setHero(e.target.value);
  }

  // ---------- Customize button (no-op safe if panel missing) ----------
  function initCustomize() {
    const b = $('#btnCustomize');
    const dlg = $('#panel');
    if (b && dlg) b.onclick = () => dlg.showModal();
  }

  // ---------- Plans & Details (safe if absent) ----------
  function initPlans() {
    const DETAILS = {
      basic: `<ul><li>Starter templates to get online today</li><li>Access to the media library & updates</li><li>Support via email within 48h</li></ul>`,
      silver:`<ul><li>Everything in Basic</li><li>Advanced visual effects & presets</li><li>Priority support within 24h</li></ul>`,
      gold:  `<ul><li>Hands-on customization session</li><li>Admin toolkit & automation setup</li><li>Onboarding call (45 min)</li></ul>`,
      diamond:`<ul><li>Custom pipelines & integrations</li><li>Hands-on help building your stack</li><li>Priority turnaround & roadmap</li></ul>`
    };
    const modal = $('#planModal');
    const mTitle = $('#mTitle');
    const mBody  = $('#mBody');

    $$('.details').forEach(btn => {
      btn.onclick = e => {
        if (!modal) return;
        const card = e.currentTarget.closest('.plan');
        const tier = (card?.dataset?.tier || 'basic');
        if (mTitle) mTitle.textContent = tier.toUpperCase() + ' plan';
        if (mBody)  mBody.innerHTML = DETAILS[tier] || '';
        modal.showModal();
      };
    });

    $$('.choose').forEach(btn => {
      btn.onclick = e => {
        const card = e.currentTarget.closest('.plan');
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // (Confetti handled in index if present; no hard dependency here)
      };
    });
  }

  // ---------- Boot ----------
  document.addEventListener('DOMContentLoaded', async () => {
    initHeader();

    // restore saved hero if any
    const savedHero = localStorage.getItem('thegrid.hero');
    if (savedHero) state.heroSrc = savedHero;
    renderHero();

    await loadManifest();   // <- reads assets/manifest.json we fixed in Step 1
    initCustomize();
    initPlans();
  });
})();
