/* assets/js/main.js
   GridCoreSystems — Core UI logic (mobile-first, no-regression)
   - Greeting + logo
   - Background FX (lightweight)
   - Library reader (manifest-aware) + hero picker
   - Customize panel (no auto-open)
   - Plans: details + tasteful confetti
   - Safe guards if elements are missing (won’t crash)
*/

(function () {
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const cssGet = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const cssSet = (v, val) => document.documentElement.style.setProperty(v, val);

  const state = {
    accent: cssGet('--accent') || '#E7B84B',
    accent2: cssGet('--accent-2') || '#95B2FF',
    ink: cssGet('--ink') || '#E9ECF3',
    soft: cssGet('--soft') || '#b9c0cf',
    bgA: cssGet('--bg-a') || '#0b0b0f',
    bgB: cssGet('--bg-b') || '#0a0b10',
    panel: cssGet('--panel') || '#0f1219',
    card: cssGet('--card') || '#10131b',
    ring: +cssGet('--ring') || 24,
    radius: parseInt(cssGet('--radius') || '20', 10),
    font: +cssGet('--fontScale') || 1,
    space: +cssGet('--space') || 1,
    vignette: +cssGet('--vignette') || 1,
    heroSrc: 'assets/videos/hero_1.mp4',
    confetti: { density: 44, speed: 1.1 },
    library: { Hero: [], 'Reels 9:16': [], 'Reels 16:9': [], Backgrounds: [], Logos: [], Images: [] },
  };

  const STORAGE_KEY = 'thegrid.settings';

  const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  const load = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!saved) return;
      Object.assign(state, saved);
    } catch {}
  };

  function applyStateToCSS() {
    cssSet('--accent', state.accent);
    cssSet('--accent-2', state.accent2);
    cssSet('--ink', state.ink);
    cssSet('--soft', state.soft);
    cssSet('--bg-a', state.bgA);
    cssSet('--bg-b', state.bgB);
    cssSet('--panel', state.panel);
    cssSet('--card', state.card);
    cssSet('--ring', state.ring);
    cssSet('--radius', state.radius + 'px');
    cssSet('--fontScale', state.font);
    cssSet('--space', state.space);
    cssSet('--vignette', state.vignette);
  }

  /* ---------------- Greeting + Logo ---------------- */
  function setGreeting() {
    const h1 = $('#hello');
    if (!h1) return;
    const h = new Date().getHours();
    const word = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
    h1.textContent = `${word} — THE GRID`;
  }

  function setLogo() {
    const v = $('#logoVid');
    if (!v) return;
    v.src = 'assets/videos/gc_spin.mp4';
    v.muted = true; v.autoplay = true; v.loop = true; v.playsInline = true;
    v.onerror = () => {
      const img = document.createElement('img');
      img.src = 'assets/images/gc_logo.png';
      img.alt = 'Logo';
      v.replaceWith(img);
    };
  }

  /* ---------------- Background FX (ultra-light) ---------------- */
  function initBackgroundFX() {
    const grad = $('#bgGrad');
    const particles = $('#bgParticles');
    if (!grad || !particles) return;

    const g = grad.getContext('2d');
    const p = particles.getContext('2d');
    let W, H, t = 0, dots = [];

    function size() {
      const dpr = Math.max(1, devicePixelRatio || 1);
      W = grad.width = innerWidth * dpr; H = grad.height = innerHeight * dpr;
      particles.width = W; particles.height = H;
      const count = Math.min(70, Math.round(innerWidth / 14));
      dots = Array.from({ length: count }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        r: 1 + Math.random() * 2.5, vx: (Math.random() - 0.5) * .25, vy: (Math.random() - 0.5) * .25,
        a: 0.06 + Math.random() * .12
      }));
    }

    function tick() {
      t += .0025;
      const x = Math.sin(t) * W * 0.2 + W * 0.5;
      const y = Math.cos(t * 1.2) * H * 0.2 + H * 0.5;
      const grd = g.createRadialGradient(x, y, 0, W / 2, H / 2, Math.hypot(W, H) / 1.2);
      grd.addColorStop(0, cssGet('--bg-a') || '#0b0b0f');
      grd.addColorStop(1, cssGet('--bg-b') || '#0a0b10');
      g.fillStyle = grd; g.fillRect(0, 0, W, H);

      p.clearRect(0, 0, W, H);
      dots.forEach(d => {
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0 || d.x > W) d.vx *= -1;
        if (d.y < 0 || d.y > H) d.vy *= -1;
        p.beginPath();
        p.fillStyle = `rgba(231,184,75,${d.a})`;
        p.arc(d.x, d.y, d.r, 0, Math.PI * 2); p.fill();
      });

      requestAnimationFrame(tick);
    }

    addEventListener('resize', size, { passive: true });
    size(); tick();
  }

  /* ---------------- Hero media ---------------- */
  function renderHero() {
    const box = $('#hero');
    if (!box) return;
    box.innerHTML = '';
    const overlay = document.createElement('div');
    overlay.className = 'heroOverlay';

    if (/\.(mp4|webm|mov)$/i.test(state.heroSrc)) {
      const v = document.createElement('video');
      v.src = state.heroSrc; v.controls = true; v.playsInline = true; v.className = 'hero-media';
      box.appendChild(v);
      box.appendChild(overlay);
    } else {
      const i = document.createElement('img');
      i.src = state.heroSrc; i.alt = 'hero'; i.className = 'hero-media';
      box.appendChild(i);
      box.appendChild(overlay);
    }
  }

  function setHero(src) {
    state.heroSrc = src;
    save();
    renderHero();
    const sel = $('#uiHero');
    if (sel) sel.value = src;
  }

  /* ---------------- Library (manifest-aware) ---------------- */
  const defaultManifest = {
    "Hero": [
      "assets/videos/hero_1.mp4",
      "assets/videos/interaction_1.mp4",
      "assets/videos/pour_1.mp4",
      "assets/images/hero_1.jpg",
      "assets/images/hero_2.jpg",
      "assets/images/hero_3.jpg"
    ],
    "Reels 9:16": [],
    "Reels 16:9": [
      "assets/videos/hero_1.mp4",
      "assets/videos/natural_1.mp4",
      "assets/videos/spread_1.mp4",
      "assets/videos/transform_1.mp4"
    ],
    "Backgrounds": [
      "assets/images/grid_natural_1.jpg",
      "assets/images/grid_spread_1.jpg",
      "assets/images/grid_transform_1.jpg"
    ],
    "Logos": [
      "assets/videos/gc_spin.mp4",
      "assets/images/gc_logo.png"
    ],
    "Images": [
      "assets/images/hero_1.jpg",
      "assets/images/hero_2.jpg",
      "assets/images/hero_3.jpg",
      "assets/images/grid_interaction_1.jpg",
      "assets/images/grid_pour_1.jpg"
    ]
  };

  async function loadManifest() {
    try {
      const res = await fetch('assets/manifest.json', { cache: 'no-store' });
      if (res.ok) Object.assign(state.library, await res.json());
      else Object.assign(state.library, defaultManifest);
    } catch {
      Object.assign(state.library, defaultManifest);
    }
    buildLibrary();
    populateHeroSelect();
  }

  function buildLibrary() {
    const tabs = $('#libTabs');
    const grid = $('#libGrid');
    const tagBar = $('#libTags');
    if (!tabs || !grid) return;

    tabs.innerHTML = '';
    grid.innerHTML = '';
    if (tagBar) tagBar.innerHTML = '';

    const cats = Object.keys(state.library);
    const active = localStorage.getItem('thegrid.activeTab') || cats[0];

    cats.forEach(cat => {
      const b = document.createElement('div');
      b.className = 'pill' + (cat === active ? ' active' : '');
      b.textContent = cat;
      b.onclick = () => {
        localStorage.setItem('thegrid.activeTab', cat);
        buildLibrary();
      };
      tabs.appendChild(b);
    });

    const list = state.library[active] || [];
    renderGrid(list);

    // Simple tags from filenames (optional)
    if (tagBar) {
      const tags = [...new Set(list.flatMap(x => {
        const name = x.split('/').pop().toLowerCase();
        return name.split(/[_\-.]/g).filter(w => w.length > 2 && !/mp4|jpg|jpeg|png|webm|mov/.test(w));
      }))].slice(0, 6);

      tags.forEach(t => {
        const b = document.createElement('div');
        b.className = 'pill';
        b.textContent = t;
        b.style.opacity = .9;
        b.onclick = () => {
          const filtered = list.filter(x => x.toLowerCase().includes(t));
          renderGrid(filtered);
        };
        tagBar.appendChild(b);
      });
    }
  }

  function renderGrid(list) {
    const grid = $('#libGrid');
    if (!grid) return;
    grid.innerHTML = '';

    list.forEach(src => {
      const row = document.createElement('div'); row.className = 'tile';
      const th = document.createElement('div'); th.className = 'thumb';
      const label = document.createElement('div');
      label.innerHTML = `<b>${src.split('/').pop()}</b><div class="meta">${src}</div>`;

      if (/\.(mp4|webm|mov)$/i.test(src)) {
        const v = document.createElement('video');
        v.src = src; v.muted = true; v.playsInline = true; v.loop = true; v.autoplay = true;
        th.appendChild(v);
      } else {
        const i = document.createElement('img'); i.src = src; th.appendChild(i);
      }
      row.appendChild(th); row.appendChild(label);
      row.onclick = () => setHero(src);
      grid.appendChild(row);
    });
  }

  function populateHeroSelect() {
    const sel = $('#uiHero');
    if (!sel) return;
    sel.innerHTML = '';
    const all = [...new Set(Object.values(state.library).flat())];
    all.forEach(src => {
      const o = new Option(src, src, src === state.heroSrc, src === state.heroSrc);
      sel.add(o);
    });
    sel.value = state.heroSrc;
  }

  /* ---------------- Customize Panel (no auto-open) ---------------- */
  function initCustomize() {
    const btn = $('#btnCustomize');
    const panel = $('#panel');
    if (btn && panel) btn.onclick = () => panel.showModal();

    const saveBtn = $('#save');
    const resetBtn = $('#reset');

    // Wiring sliders/selects if present
    const bind = (id, apply) => {
      const el = $(id);
      if (!el) return;
      el.oninput = ev => { apply(ev.target.value); save(); };
    };

    bind('#uiAccent', v => { state.accent = v; cssSet('--accent', v); });
    bind('#uiAccent2', v => { state.accent2 = v; cssSet('--accent-2', v); });
    bind('#uiInk', v => { state.ink = v; cssSet('--ink', v); });
    bind('#uiSoft', v => { state.soft = v; cssSet('--soft', v); });
    bind('#uiCard', v => { state.card = v; cssSet('--card', v); });
    bind('#uiPanel', v => { state.panel = v; cssSet('--panel', v); });
    bind('#uiBgA', v => { state.bgA = v; cssSet('--bg-a', v); });
    bind('#uiBgB', v => { state.bgB = v; cssSet('--bg-b', v); });
    bind('#uiRing', v => { state.ring = +v; cssSet('--ring', v); });
    bind('#uiRadius', v => { state.radius = +v; cssSet('--radius', v + 'px'); });
    bind('#uiFont', v => { state.font = +v; cssSet('--fontScale', v); });
    bind('#uiSpace', v => { state.space = +v; cssSet('--space', v); });
    bind('#uiVignette', v => { state.vignette = +v; cssSet('--vignette', v); });
    bind('#uiHero', v => { setHero(v); });

    if (saveBtn) saveBtn.onclick = () => { save(); alert('Saved to this device.'); };
    if (resetBtn) resetBtn.onclick = () => { localStorage.removeItem(STORAGE_KEY); location.reload(); };
  }

  /* ---------------- Plans: details + confetti ---------------- */
  const PLAN_DETAILS = {
    basic: `
      <ul>
        <li>Starter templates & blocks to get online fast</li>
        <li>Access to media library (videos/images/logos)</li>
        <li>Email support within 48 hours</li>
      </ul>`,
    silver: `
      <ul>
        <li>Everything in Basic</li>
        <li>Advanced effects & presets (social-first)</li>
        <li>Priority email within 24 hours</li>
      </ul>`,
    gold: `
      <ul>
        <li>Full customization session</li>
        <li>Admin toolkit + automations</li>
        <li>1:1 onboarding (45 min)</li>
      </ul>`,
    diamond: `
      <ul>
        <li>Custom pipelines & integrations</li>
        <li>Hands-on help building your stack</li>
        <li>Priority roadmap & turnaround</li>
      </ul>`
  };

  function initPlans() {
    const detailsBtns = $$('.details');
    const chooseBtns = $$('.choose');
    const modal = $('#planModal');
    const mTitle = $('#mTitle');
    const mBody = $('#mBody');

    detailsBtns.forEach(b => {
      b.onclick = e => {
        const card = e.currentTarget.closest('.plan');
        if (!card || !modal) return;
        const tier = card.dataset.tier || 'basic';
        if (mTitle) mTitle.textContent = tier.toUpperCase() + ' plan';
        if (mBody) mBody.innerHTML = PLAN_DETAILS[tier] || '';
        modal.showModal();
      };
    });

    chooseBtns.forEach(b => {
      b.onclick = e => {
        const card = e.currentTarget.closest('.plan');
        if (!card) return;
        confettiBurst(card);
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      };
    });
  }

  /* ---------------- Confetti (from both sides, tasteful) ---------------- */
  let confettiParts = [];
  let FXctx, FXW = 0, FXH = 0, FXdpr = 1;

  function initConfettiCanvas() {
    const canvas = $('#fx');
    if (!canvas) return;
    FXctx = canvas.getContext('2d');
    function size() {
      FXdpr = Math.max(1, devicePixelRatio || 1);
      canvas.width = FXW = innerWidth * FXdpr;
      canvas.height = FXH = innerHeight * FXdpr;
    }
    addEventListener('resize', size, { passive: true });
    size();
    requestAnimationFrame(confettiTick);
  }

  function confettiBurst(el) {
    if (!FXctx) return;
    const r = el.getBoundingClientRect();
    const y = (r.top + r.height * 0.25) * FXdpr;
    const leftX = (r.left - 10) * FXdpr;
    const rightX = (r.right + 10) * FXdpr;
    const n = Math.max(10, state.confetti.density | 0);
    const s = +state.confetti.speed || 1;

    const colors = [
      state.accent, '#ffffff',
      '#d2d8ea', // light ink
      '#9ec5ff'  // cool accent
    ];

    for (let i = 0; i < n; i++) {
      confettiParts.push(makeShard(leftX, y, 1, s, colors));
      confettiParts.push(makeShard(rightX, y, -1, s, colors));
    }
  }

  function makeShard(x, y, dir, s, colors) {
    const sz = 3 + Math.random() * 6;
    return {
      x, y,
      vx: (1.5 + Math.random() * 1.6) * dir * s,
      vy: (-2.2 - Math.random() * 2.2) * s,
      g: 0.09 * s,
      r: Math.random() * Math.PI,
      w: sz,
      h: sz * (0.5 + Math.random() * 0.6),
      life: 140 + Math.random() * 60,
      c: colors[(Math.random() * colors.length) | 0],
      a: 1
    };
  }

  function confettiTick() {
    if (!FXctx) return;
    FXctx.clearRect(0, 0, FXW, FXH);
    confettiParts = confettiParts.filter(p => p.life > 0);

    confettiParts.forEach(p => {
      p.vy += p.g;
      p.x += p.vx; p.y += p.vy; p.r += .12;
      p.life--;
      p.a = Math.max(0, p.life / 160);

      FXctx.save();
      FXctx.translate(p.x, p.y);
      FXctx.rotate(p.r);
      FXctx.globalAlpha = p.a;
      FXctx.fillStyle = p.c;
      FXctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      FXctx.restore();
    });

    requestAnimationFrame(confettiTick);
  }

  /* ---------------- Init sequence ---------------- */
  function init() {
    load();
    applyStateToCSS();
    setGreeting();
    setLogo();
    initBackgroundFX();
    initConfettiCanvas();
    renderHero();
    loadManifest();
    initCustomize();
    initPlans();

    // Join Now behavior (no payment yet; just a clear action)
    const join = $('#btnJoin');
    if (join) {
      join.onclick = () => {
        const plans = $('#plans');
        if (plans) plans.scrollIntoView({ behavior: 'smooth' });
      };
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
