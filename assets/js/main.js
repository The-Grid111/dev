/* =========================================================
   THE GRID — Main JS (full file replace)
   Works with:
   - assets/css/style.css   (your File 6)
   - assets/manifest.json   (optional, auto-loaded)
   - assets/videos/gc_spin.mp4 (logo, optional)
   - assets/images/gc_logo.png (logo fallback)
   - assets/videos/hero_1.mp4  (default hero)
   Folders you showed: /assets/css /assets/js /assets/images /assets/videos /data
   ========================================================= */

(() => {
  /* ---------- Quick DOM helpers ---------- */
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];

  /* ---------- State ---------- */
  const state = {
    accent: readCSS('--accent'),
    heroSrc: 'assets/videos/hero_1.mp4',
    confetti: { density: 60, speed: 1.1, size: [3, 8] },
    library: { Hero:[], 'Reels 9:16':[], 'Reels 16:9':[], Backgrounds:[], Logos:[], Images:[] },
    activeTab: null
  };

  /* ---------- Init ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    setGreeting();
    mountLogo();
    mountHero(state.heroSrc);
    bootCustomize();
    bootPricing();
    bootConfettiCanvas();
    bootLibrary().then(() => {
      // populate hero selector after library ready
      populateHeroSelect();
    });
  });

  /* =======================================================
     GREETING + LOGO
  ======================================================= */
  function setGreeting(){
    const h = new Date().getHours();
    const word = h<12?'Good morning':h<18?'Good afternoon':'Good evening';
    const hello = $('#hello');
    if (hello) hello.textContent = `${word} — THE GRID`;
  }

  function mountLogo(){
    const v = $('#logoVid');
    if (!v) return;
    v.src = 'assets/videos/gc_spin.mp4';
    v.playsInline = true; v.muted = true; v.autoplay = true; v.loop = true;
    v.onerror = () => {
      const img = document.createElement('img');
      img.src = 'assets/images/gc_logo.png';
      img.alt = 'Logo';
      v.replaceWith(img);
    };
  }

  /* =======================================================
     HERO
  ======================================================= */
  function mountHero(src){
    state.heroSrc = src;
    const hero = $('#hero');
    if (!hero) return;
    hero.innerHTML = '<div class="heroOverlay"></div>';
    if (/\.(mp4|webm|mov)$/i.test(src)) {
      const vid = document.createElement('video');
      vid.src = src; vid.controls = true; vid.playsInline = true; vid.className = 'hero-media';
      hero.prepend(vid);
    } else {
      const img = document.createElement('img');
      img.src = src; img.alt = 'hero'; img.className = 'hero-media';
      hero.prepend(img);
    }
  }

  /* =======================================================
     CUSTOMIZE PANEL
  ======================================================= */
  function bootCustomize(){
    const panel = $('#panel');
    const btnCustomize = $('#btnCustomize');
    if (btnCustomize && panel) {
      btnCustomize.onclick = () => panel.showModal();
    }

    bindColor('#uiAccent','--accent', v => { state.accent=v; });
    bindSelect('#uiHero', v => mountHero(v));

    // density/speed sliders (stored but read by confettiBurst on click)
    const d = $('#uiConfettiDensity'); const s = $('#uiConfettiSpeed');
    if (d) d.oninput = e => state.confetti.density = +e.target.value;
    if (s) s.oninput = e => state.confetti.speed   = +e.target.value;

    const saveBtn = $('#save');
    const resetBtn = $('#reset');
    if (saveBtn) saveBtn.onclick = () => { localStorage.setItem('thegrid.settings', JSON.stringify(state)); alert('Saved to this device.'); };
    if (resetBtn) resetBtn.onclick = () => { localStorage.removeItem('thegrid.settings'); location.reload(); };

    // restore persisted state (accent + hero)
    const saved = localStorage.getItem('thegrid.settings');
    if (saved) {
      try {
        const loaded = JSON.parse(saved);
        if (loaded.accent) setCSS('--accent', loaded.accent);
        if (loaded.heroSrc) mountHero(loaded.heroSrc);
        if (loaded.confetti) state.confetti = loaded.confetti;
        Object.assign(state, loaded);
      } catch {}
    }
  }

  function bindColor(inputSel, cssVar, onState){
    const el = $(inputSel);
    if (!el) return;
    el.oninput = e => { const v = e.target.value; setCSS(cssVar, v); onState(v); };
  }
  function bindSelect(sel, on){
    const el = $(sel);
    if (!el) return;
    el.oninput = e => on(e.target.value);
  }

  /* =======================================================
     LIBRARY (manifest-aware)
  ======================================================= */
  async function bootLibrary(){
    // Try assets/manifest.json first, else fallback to reasonable defaults
    let manifest = {
      "Hero": ["assets/videos/hero_1.mp4","assets/images/hero_1.jpg"],
      "Reels 9:16": [],
      "Reels 16:9": [],
      "Backgrounds": [],
      "Logos": ["assets/videos/gc_spin.mp4","assets/images/gc_logo.png"],
      "Images": ["assets/images/hero_1.jpg","assets/images/hero_2.jpg","assets/images/hero_3.jpg"]
    };
    try {
      const res = await fetch('assets/manifest.json', { cache: 'no-store' });
      if (res.ok) manifest = await res.json();
    } catch {}

    state.library = manifest;
    buildTabsAndGrid();
  }

  function buildTabsAndGrid(){
    const tabs = $('#libTabs');
    const grid = $('#libGrid');
    if (!tabs || !grid) return;

    tabs.innerHTML = '';
    grid.innerHTML = '';

    const cats = Object.keys(state.library);
    const active = state.activeTab || localStorage.getItem('thegrid.activeTab') || cats[0];
    state.activeTab = active;

    cats.forEach(cat => {
      const pill = document.createElement('div');
      pill.className = 'pill' + (cat===active ? ' active' : '');
      pill.textContent = cat;
      pill.onclick = () => {
        localStorage.setItem('thegrid.activeTab', cat);
        state.activeTab = cat;
        buildTabsAndGrid();
      };
      tabs.appendChild(pill);
    });

    renderGrid(active);
  }

  function renderGrid(category){
    const grid = $('#libGrid');
    if (!grid) return;
    grid.innerHTML = '';

    (state.library[category] || []).forEach(src => {
      const row = document.createElement('div');
      row.className = 'tile';
      const th = document.createElement('div'); th.className = 'thumb';
      const label = document.createElement('div');
      label.innerHTML = `<b>${basename(src)}</b><div class="meta">${src}</div>`;

      if (/\.(mp4|webm|mov)$/i.test(src)) {
        const v = document.createElement('video');
        v.src = src; v.muted = true; v.playsInline = true; v.loop = true; v.autoplay = true;
        th.appendChild(v);
      } else {
        const i = document.createElement('img');
        i.src = src; th.appendChild(i);
      }

      row.appendChild(th); row.appendChild(label);
      row.onclick = () => {
        // Set as hero media when a tile is chosen
        mountHero(src);
        state.heroSrc = src;
        persist();
      };
      grid.appendChild(row);
    });
  }

  function populateHeroSelect(){
    const sel = $('#uiHero'); if (!sel) return;
    sel.innerHTML = '';
    const all = [...new Set(Object.values(state.library).flat())];
    all.forEach(src => sel.add(new Option(src, src, src===state.heroSrc, src===state.heroSrc)));
  }

  /* =======================================================
     PRICING: Details modal + Confetti burst on choose
  ======================================================= */
  function bootPricing(){
    const detailsByTier = {
      basic:   `<ul><li>Starter templates & blocks</li><li>Library access (videos, images, logos)</li><li>Email support (48h)</li></ul>`,
      silver:  `<ul><li>Everything in Basic</li><li>Advanced effects & presets</li><li>Priority email (24h)</li></ul>`,
      gold:    `<ul><li>Full customization session</li><li>Admin toolkit & automations</li><li>1:1 onboarding (45 min)</li></ul>`,
      diamond: `<ul><li>Custom pipelines & integrations</li><li>Hands-on help building your stack</li><li>Priority roadmap & turnaround</li></ul>`
    };

    $$('.details').forEach(btn => {
      btn.onclick = e => {
        const card = e.currentTarget.closest('.plan');
        const tier = card?.dataset?.tier || 'Plan';
        $('#mTitle').textContent = `${tier.toUpperCase()} plan`;
        $('#mBody').innerHTML = detailsByTier[tier] || 'Details coming soon.';
        $('#planModal')?.showModal();
      };
    });

    $$('.choose').forEach(btn => {
      btn.onclick = e => {
        const card = e.currentTarget.closest('.plan');
        if (!card) return;
        // scroll to center and celebrate
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        confettiBurst(card);
      };
    });

    // Join Now scrolls to plans
    const join = $('#btnJoin');
    if (join) join.onclick = () => {
      $('#plans')?.scrollIntoView({ behavior:'smooth' });
      // tasteful small confetti to tease
      confettiBurst($('#plans'), {density: 40, speed: 1, size:[2,6]});
    };
  }

  /* =======================================================
     CONFETTI (two-side, denser, faster but efficient)
  ======================================================= */
  let fx, ctx, W=0, H=0, parts=[];
  function bootConfettiCanvas(){
    fx = $('#fx');
    if (!fx) return;
    ctx = fx.getContext('2d');
    onResize();
    addEventListener('resize', onResize);
    tick();
  }
  function onResize(){
    const dpr = Math.max(1, devicePixelRatio || 1);
    W = fx.width  = innerWidth  * dpr;
    H = fx.height = innerHeight * dpr;
  }
  function confettiBurst(anchor, opts={}){
    if (!ctx) return;
    const rect = (anchor?.getBoundingClientRect?.() || {left:0,right:innerWidth,top:innerHeight/2,height:0});
    const dpr = Math.max(1, devicePixelRatio || 1);
    const originY = (rect.top + rect.height*0.25) * dpr;
    const leftX   = (rect.left - 12) * dpr;
    const rightX  = (rect.right + 12) * dpr;

    const density = (opts.density ?? state.confetti.density) | 0;
    const speed   = +(opts.speed ?? state.confetti.speed);
    const sizeMin = (opts.size?.[0] ?? state.confetti.size[0]);
    const sizeMax = (opts.size?.[1] ?? state.confetti.size[1]);
    const colors  = [ readCSS('--accent'), '#ffffff', '#c9d2e8', '#9ec5ff' ];

    for (let i=0;i<density;i++){
      parts.push(makeBit(leftX,  originY,  1, speed, sizeMin, sizeMax, colors));
      parts.push(makeBit(rightX, originY, -1, speed, sizeMin, sizeMax, colors));
    }
  }
  function makeBit(x,y,dir,s,szMin,szMax,colors){
    const w = szMin + Math.random()*(szMax - szMin);
    const h = w*0.6;
    return {
      x, y,
      vx:(1.6+Math.random()*1.6)*dir*s,
      vy:(-2.2 - Math.random()*2.2)*s,
      g:.09*s,
      r:Math.random()*Math.PI,
      w, h,
      life: 120 + Math.random()*40,
      c: colors[(Math.random()*colors.length)|0],
      a: 0.9
    };
  }
  function tick(){
    if (!ctx){ requestAnimationFrame(tick); return; }
    ctx.clearRect(0,0,W,H);
    const alive = [];
    for (let i=0;i<parts.length;i++){
      const p = parts[i];
      p.vy += p.g;
      p.x  += p.vx;
      p.y  += p.vy;
      p.r  += .12;
      p.life--;
      if (p.life > 0 && p.y < H+40){
        alive.push(p);
        ctx.save();
        ctx.translate(p.x,p.y); ctx.rotate(p.r);
        ctx.globalAlpha = Math.max(0, p.life/160) * p.a;
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);
        ctx.restore();
      }
    }
    parts = alive;
    requestAnimationFrame(tick);
  }

  /* =======================================================
     UTIL
  ======================================================= */
  function readCSS(v){ return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }
  function setCSS(v,val){ document.documentElement.style.setProperty(v,val); persist(); }
  function persist(){ localStorage.setItem('thegrid.settings', JSON.stringify(state)); }
  function basename(p){ return (p||'').split('/').pop(); }

})();
