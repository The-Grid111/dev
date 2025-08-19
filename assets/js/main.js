/* =========================================================
   THE GRID — main.js (full redo)
   - Greeting + logo fallback
   - Background FX (moving gradient + soft particles)
   - Library (manifest-aware) + hero picker
   - Customize panel (colors, spacing, radius, vignette, hero, confetti)
   - Plans: details modal + tasteful confetti on Choose
   - Save/Load owner settings (localStorage)
   - Smooth scroll and small UX helpers
   ========================================================= */

(() => {
  /* ---------- Shorthands ---------- */
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const cssGet = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const cssSet = (v, val) => document.documentElement.style.setProperty(v, val);

  /* ---------- Persistent state ---------- */
  const state = {
    // UI tokens
    accent: cssGet('--accent') || '#E7B84B',
    accent2: cssGet('--accent-2') || '#95B2FF',
    ink: cssGet('--ink') || '#E9ECF3',
    soft: cssGet('--soft') || '#b9c0cf',
    bgA: cssGet('--bg-a') || '#0b0b0f',
    bgB: cssGet('--bg-b') || '#0a0b10',
    panel: cssGet('--panel') || '#0f1219',
    card: cssGet('--card') || '#10131b',
    ring: +(cssGet('--ring') || 24),
    radius: parseInt(cssGet('--radius') || '20', 10),
    font: +(cssGet('--fontScale') || 1),
    space: +(cssGet('--space') || 1),
    vignette: +(cssGet('--vignette') || 1),

    // App
    heroSrc: 'assets/videos/hero_1.mp4',
    confetti: { density: 44, speed: 1.1 },

    // Library
    library: { Hero:[], 'Reels 9:16':[], 'Reels 16:9':[], Backgrounds:[], Logos:[], Images:[] },
    activeTab: null,
  };

  const LS_KEY = 'thegrid.settings';

  const save = () => localStorage.setItem(LS_KEY, JSON.stringify(state));
  const load = () => {
    try {
      const s = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
      if (!s) return;
      Object.assign(state, s);
    } catch {}
  };

  /* ---------- Greeting + Logo ---------- */
  function setGreeting() {
    const h = new Date().getHours();
    const word = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
    const el = $('#hello');
    if (el) el.textContent = `${word} — THE GRID`;
  }
  function setLogo() {
    const v = $('#logoVid');
    if (!v) return;
    v.muted = true; v.autoplay = true; v.loop = true; v.playsInline = true;
    v.src = 'assets/videos/gc_spin.mp4';
    v.onerror = () => {
      const img = document.createElement('img');
      img.src = 'assets/images/gc_logo.png';
      img.alt = 'Logo';
      v.replaceWith(img);
    };
  }

  /* ---------- Background FX (two canvases) ---------- */
  function startBackgroundFX() {
    const grad = $('#bgGrad'), g = grad ? grad.getContext('2d') : null;
    const part = $('#bgParticles'), p = part ? part.getContext('2d') : null;
    if (!g || !p) return;

    let W, H, t = 0, dots = [];

    function size() {
      W = grad.width  = innerWidth * devicePixelRatio;
      H = grad.height = innerHeight * devicePixelRatio;
      part.width = W; part.height = H;

      const count = Math.min(70, Math.round(innerWidth / 14));
      dots = Array.from({ length: count }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 1 + Math.random() * 2.6,
        vx: (Math.random() - .5) * .22,
        vy: (Math.random() - .5) * .22,
        a: .08 + Math.random() * .12,
      }));
    }

    function tick() {
      t += .0025;
      const x = Math.sin(t) * W * 0.2 + W * 0.5;
      const y = Math.cos(t * 1.2) * H * 0.2 + H * 0.5;
      const grd = g.createRadialGradient(x, y, 0, W/2, H/2, Math.hypot(W, H) / 1.15);
      grd.addColorStop(0, state.bgA);
      grd.addColorStop(1, state.bgB);
      g.fillStyle = grd; g.fillRect(0,0,W,H);

      p.clearRect(0,0,W,H);
      dots.forEach(d => {
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0 || d.x > W) d.vx *= -1;
        if (d.y < 0 || d.y > H) d.vy *= -1;
        p.beginPath();
        p.fillStyle = `rgba(231,184,75,${d.a})`;
        p.arc(d.x, d.y, d.r, 0, 6.283); p.fill();
      });
      requestAnimationFrame(tick);
    }

    addEventListener('resize', size);
    size(); tick();
  }

  /* ---------- Hero renderer ---------- */
  function setHero(src) {
    state.heroSrc = src; save(); renderHero();
  }
  function renderHero() {
    const box = $('#hero');
    if (!box) return;
    box.innerHTML = '<div class="heroOverlay"></div>';
    if (/\.(mp4|webm|mov)$/i.test(state.heroSrc)) {
      const v = Object.assign(document.createElement('video'), {
        src: state.heroSrc, controls: true, playsInline: true, className: 'hero-media'
      });
      box.prepend(v);
    } else {
      const i = Object.assign(document.createElement('img'), {
        src: state.heroSrc, alt: 'hero', className: 'hero-media'
      });
      box.prepend(i);
    }
  }

  /* ---------- Library (manifest-aware) ---------- */
  const DEFAULT_MANIFEST = {
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
    "Logos": ["assets/videos/gc_spin.mp4","assets/images/gc_logo.png"],
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
      if (res.ok) {
        const data = await res.json();
        Object.assign(state.library, data);
      } else {
        Object.assign(state.library, DEFAULT_MANIFEST);
      }
    } catch {
      Object.assign(state.library, DEFAULT_MANIFEST);
    }
    buildLibrary();
    fillHeroSelect();
  }

  function pill(text, active=false) {
    const el = document.createElement('div');
    el.className = 'pill' + (active ? ' active' : '');
    el.textContent = text;
    return el;
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
    if (!state.activeTab) state.activeTab = cats[0];

    // Tabs
    cats.forEach(cat => {
      const b = pill(cat, cat === state.activeTab);
      b.onclick = () => { state.activeTab = cat; save(); buildLibrary(); };
      tabs.appendChild(b);
    });

    // Tag cloud from filenames
    const list = state.library[state.activeTab] || [];
    if (tagBar) {
      const tags = [...new Set(list.flatMap(x => {
        const name = x.split('/').pop().toLowerCase();
        return name.split(/[_\-\.]/g).filter(w => w.length > 2 && !/mp4|jpg|jpeg|png|webm|mov/.test(w));
      }))].slice(0, 6);

      tags.forEach(t => {
        const b = pill(t);
        b.style.opacity = .9;
        b.onclick = () => renderLibGrid(list.filter(x => x.toLowerCase().includes(t)));
        tagBar.appendChild(b);
      });
    }

    renderLibGrid(list);
  }

  function renderLibGrid(list) {
    const grid = $('#libGrid');
    if (!grid) return;
    grid.innerHTML = '';

    list.forEach(src => {
      const row = document.createElement('div');
      row.className = 'tile';

      const th = document.createElement('div');
      th.className = 'thumb';

      if (/\.(mp4|webm|mov)$/i.test(src)) {
        const v = document.createElement('video');
        Object.assign(v, { src, muted: true, loop: true, playsInline: true });
        v.autoplay = true;
        th.appendChild(v);
      } else {
        const i = document.createElement('img');
        i.src = src;
        i.alt = src.split('/').pop();
        th.appendChild(i);
      }

      const label = document.createElement('div');
      label.innerHTML = `<b>${src.split('/').pop()}</b><div class="meta">${src}</div>`;

      row.appendChild(th);
      row.appendChild(label);
      row.onclick = () => setHero(src);

      grid.appendChild(row);
    });
  }

  function fillHeroSelect() {
    const sel = $('#uiHero');
    if (!sel) return;
    sel.innerHTML = '';
    const all = [...new Set(Object.values(state.library).flat())];
    all.forEach(src => {
      const opt = new Option(src, src, src === state.heroSrc, src === state.heroSrc);
      sel.add(opt);
    });
  }

  /* ---------- Customize panel ---------- */
  function bindCustomize() {
    const panel = $('#panel');
    const btn = $('#btnCustomize');
    if (btn && panel) btn.onclick = () => panel.showModal();

    const map = [
      ['#uiAccent',  'accent',  '--accent'],
      ['#uiAccent2', 'accent2', '--accent-2'],
      ['#uiInk',     'ink',     '--ink'],
      ['#uiSoft',    'soft',    '--soft'],
      ['#uiCard',    'card',    '--card'],
      ['#uiPanel',   'panel',   '--panel'],
      ['#uiBgA',     'bgA',     '--bg-a'],
      ['#uiBgB',     'bgB',     '--bg-b'],
    ];
    map.forEach(([sel, key, varName]) => {
      const el = $(sel);
      if (!el) return;
      el.addEventListener('input', e => { state[key] = e.target.value; cssSet(varName, state[key]); save(); });
    });

    const ranges = [
      ['#uiRing',   'ring',   v => cssSet('--ring', v)],
      ['#uiRadius', 'radius', v => cssSet('--radius', `${v}px`)],
      ['#uiFont',   'font',   v => cssSet('--fontScale', v)],
      ['#uiSpace',  'space',  v => cssSet('--space', v)],
    ];
    ranges.forEach(([sel, key, apply]) => {
      const el = $(sel);
      if (!el) return;
      el.addEventListener('input', e => { const v = +e.target.value; state[key] = v; apply(v); save(); });
    });

    const vignette = $('#uiVignette');
    if (vignette) vignette.oninput = e => { state.vignette = +e.target.value; cssSet('--vignette', state.vignette); save(); };

    const heroSel = $('#uiHero');
    if (heroSel) heroSel.oninput = e => setHero(e.target.value);

    const dens = $('#uiConfettiDensity');
    if (dens) dens.oninput = e => { state.confetti.density = +e.target.value; save(); };
    const speed = $('#uiConfettiSpeed');
    if (speed) speed.oninput = e => { state.confetti.speed = +e.target.value; save(); };

    const saveBtn = $('#save');
    if (saveBtn) saveBtn.onclick = () => { save(); alert('Saved to this device.'); };

    const resetBtn = $('#reset');
    if (resetBtn) resetBtn.onclick = () => { localStorage.removeItem(LS_KEY); location.reload(); };
  }

  function applyStateToDOM() {
    cssSet('--accent', state.accent);
    cssSet('--accent-2', state.accent2);
    cssSet('--ink', state.ink);
    cssSet('--soft', state.soft);
    cssSet('--bg-a', state.bgA);
    cssSet('--bg-b', state.bgB);
    cssSet('--panel', state.panel);
    cssSet('--card', state.card);
    cssSet('--ring', state.ring);
    cssSet('--radius', `${state.radius}px`);
    cssSet('--fontScale', state.font);
    cssSet('--space', state.space);
    cssSet('--vignette', state.vignette);

    // Mirror values into controls (if present)
    const setVal = (sel, v) => { const el = $(sel); if (el) el.value = v; };
    setVal('#uiAccent', state.accent);
    setVal('#uiAccent2', state.accent2);
    setVal('#uiInk', state.ink);
    setVal('#uiSoft', state.soft);
    setVal('#uiCard', state.card);
    setVal('#uiPanel', state.panel);
    setVal('#uiBgA', state.bgA);
    setVal('#uiBgB', state.bgB);
    setVal('#uiRing', state.ring);
    setVal('#uiRadius', state.radius);
    setVal('#uiFont', state.font);
    setVal('#uiSpace', state.space);
    setVal('#uiVignette', state.vignette);
    setVal('#uiConfettiDensity', state.confetti.density);
    setVal('#uiConfettiSpeed', state.confetti.speed);

    renderHero();
  }

  /* ---------- Plans (Details modal + Choose confetti) ---------- */
  const PLAN_DETAILS = {
    basic:   `<ul><li>Starter templates & blocks</li><li>Library access</li><li>Email support (48h)</li></ul>`,
    silver:  `<ul><li>Everything in Basic</li><li>Advanced effects & presets</li><li>Priority email (24h)</li></ul>`,
    gold:    `<ul><li>Full customization session</li><li>Admin toolkit & automations</li><li>Onboarding (45 min)</li></ul>`,
    diamond: `<ul><li>Custom pipelines & integrations</li><li>Hands-on build support</li><li>Priority roadmap</li></ul>`,
  };

  function wirePlans() {
    const modal = $('#planModal');
    const mTitle = $('#mTitle');
    const mBody = $('#mBody');

    $$('.details').forEach(b => {
      b.onclick = e => {
        const card = e.currentTarget.closest('.plan');
        const tier = (card?.dataset?.tier || '').toLowerCase();
        if (!tier) return;
        if (mTitle) mTitle.textContent = `${tier.toUpperCase()} plan`;
        if (mBody)  mBody.innerHTML = PLAN_DETAILS[tier] || '';
        if (modal?.showModal) modal.showModal();
      };
    });

    $$('.choose').forEach(b => {
      b.onclick = e => {
        const card = e.currentTarget.closest('.plan');
        if (!card) return;
        confettiBurst(card);
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      };
    });
  }

  /* ---------- Confetti (left + right, subtle) ---------- */
  const fx = $('#fx');
  const ctx = fx ? fx.getContext('2d') : null;
  let W = 0, H = 0, parts = [];

  function sizeCanvas() {
    if (!fx || !ctx) return;
    W = fx.width  = innerWidth * devicePixelRatio;
    H = fx.height = innerHeight * devicePixelRatio;
  }

  function confettiBurst(anchorEl) {
    if (!fx || !ctx) return;
    const r = anchorEl.getBoundingClientRect();
    const originY = (r.top + r.height * 0.25) * devicePixelRatio;
    const leftX  = (r.left - 10) * devicePixelRatio;
    const rightX = (r.right + 10) * devicePixelRatio;
    const n = state.confetti.density | 0;
    const s = +state.confetti.speed;
    const colors = [state.accent, '#fff', '#c9d2e8', '#9ec5ff'];
    for (let i=0; i<n; i++) {
      parts.push(makeShard(leftX, originY,  1, s, colors));
      parts.push(makeShard(rightX, originY, -1, s, colors));
    }
  }
  function makeShard(x,y,dir,s,colors) {
    const sz = 3 + Math.random() * 6;
    return {
      x, y,
      vx: (1.5 + Math.random() * 1.5) * dir * s,
      vy: (-2  - Math.random() * 2)  * s,
      g: .08 * s,
      r: Math.random() * Math.PI,
      w: sz, h: sz * .6,
      life: 120 + Math.random() * 40,
      c: colors[(Math.random() * colors.length) | 0]
    };
  }
  function tickConfetti() {
    if (!fx || !ctx) return;
    ctx.clearRect(0,0,W,H);
    parts = parts.filter(p => p.life > 0);
    parts.forEach(p => {
      p.vy += p.g; p.x += p.vx; p.y += p.vy; p.r += .12; p.life--;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.fillStyle = p.c; ctx.globalAlpha = Math.max(0, p.life / 160);
      ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
      ctx.restore();
    });
    requestAnimationFrame(tickConfetti);
  }

  /* ---------- Misc UX ---------- */
  function smoothAnchors() {
    $$('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const id = a.getAttribute('href');
        const tgt = id && $(id);
        if (tgt) {
          e.preventDefault();
          tgt.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  function wireJoin() {
    const b = $('#btnJoin');
    if (b) b.onclick = () => {
      confettiBurst(b);
      $('#plans')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
  }

  /* ---------- Init ---------- */
  function applyStateToControls() {
    // ensure controls reflect state (called after build)
    const setVal = (sel, v) => { const el = $(sel); if (el) el.value = v; };
    setVal('#uiConfettiDensity', state.confetti.density);
    setVal('#uiConfettiSpeed',   state.confetti.speed);
    setVal('#uiVignette',        state.vignette);
  }

  function init() {
    load();
    setGreeting();
    setLogo();
    applyStateToDOM();
    startBackgroundFX();

    // Canvas for confetti
    sizeCanvas(); tickConfetti();
    addEventListener('resize', sizeCanvas);

    // Library + hero
    loadManifest();

    // Customize + controls
    bindCustomize();
    applyStateToControls();

    // Plans + modals + join
    wirePlans();
    wireJoin();

    // Smooth scroll for internal links
    smoothAnchors();

    // If owner had a saved hero, render it
    renderHero();
  }

  // Start
  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init, { once:true })
    : init();
})();
