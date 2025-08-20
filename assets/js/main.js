/* THE GRID — main.js (full redo)
   - Wires buttons (Join/Customize)
   - Loads plans/services from assets/data/*.json
   - Builds pricing UI + Details modal
   - Library hooks (reads assets/manifest.json if present)
   - Confetti (left+right tasteful, faster)
   - Logo mp4 with image fallback
   - Safe: skips parts if elements aren’t on page
*/
(function () {
  const $  = (s,p=document)=>p.querySelector(s);
  const $$ = (s,p=document)=>Array.from(p.querySelectorAll(s));

  /* ---------- Logo video (mp4 -> fallback image) ---------- */
  const logoVid = $('#logoVid');
  if (logoVid) {
    logoVid.src = 'assets/videos/gc_spin.mp4';
    logoVid.onerror = () => {
      const img = document.createElement('img');
      img.alt = 'Logo';
      img.src = 'assets/images/gc_logo.png';
      logoVid.replaceWith(img);
    };
  }

  /* ---------- Greeting ---------- */
  const hello = $('#hello');
  if (hello) {
    const h = new Date().getHours();
    const word = h<12?'Good morning':h<18?'Good afternoon':'Good evening';
    hello.textContent = `${word} — THE GRID`;
  }

  /* ---------- Customize Panel + Save ---------- */
  const panel = $('#panel');
  const btnCustomize = $('#btnCustomize');
  if (btnCustomize && panel) {
    btnCustomize.addEventListener('click', () => panel.showModal());
    const save = $('#save');
    const reset = $('#reset');

    const setCSS = (v,val)=>document.documentElement.style.setProperty(v,val);
    const state = JSON.parse(localStorage.getItem('thegrid.settings')||'{}');

    // Bind controls if present
    const binds = [
      ['#uiAccent','--accent'],
      ['#uiAccent2','--accent-2'],
      ['#uiInk','--ink'],
      ['#uiSoft','--soft'],
      ['#uiCard','--card'],
      ['#uiPanel','--panel'],
      ['#uiBgA','--bg-a'],
      ['#uiBgB','--bg-b'],
    ];
    binds.forEach(([sel, varName])=>{
      const el = $(sel);
      if (!el) return;
      if (state[varName]) { el.value = state[varName]; setCSS(varName, state[varName]); }
      el.addEventListener('input', e=>{
        const val = e.target.value;
        state[varName] = val;
        setCSS(varName, val);
        localStorage.setItem('thegrid.settings', JSON.stringify(state));
      });
    });

    function bindNum(id, varName, suffix=''){
      const el = $(id);
      if (!el) return;
      if (state[varName]) { el.value = state[varName]; setCSS(varName, state[varName]+suffix); }
      el.addEventListener('input', e=>{
        const val = e.target.value;
        state[varName] = +val;
        setCSS(varName, val + suffix);
        localStorage.setItem('thegrid.settings', JSON.stringify(state));
      });
    }
    bindNum('#uiRing','--ring');
    bindNum('#uiRadius','--radius','px');
    bindNum('#uiFont','--fontScale');
    bindNum('#uiSpace','--space');

    const uiVig = $('#uiVignette');
    if (uiVig) {
      if (state['--vignette']) { uiVig.value = state['--vignette']; setCSS('--vignette', state['--vignette']); }
      uiVig.addEventListener('input', e=>{
        setCSS('--vignette', e.target.value);
        state['--vignette']=e.target.value;
        localStorage.setItem('thegrid.settings', JSON.stringify(state));
      });
    }

    const saveBtn = $('#save');
    if (saveBtn) saveBtn.onclick = ()=> alert('Saved to this device.');
    const resetBtn = $('#reset');
    if (resetBtn) resetBtn.onclick = ()=>{ localStorage.removeItem('thegrid.settings'); location.reload(); };
  }

  /* ---------- Hero + Library ---------- */
  const heroBox = $('#hero');
  function setHero(src){
    if (!heroBox) return;
    heroBox.innerHTML = '<div class="heroOverlay"></div>';
    if (/\.(mp4|webm|mov)$/i.test(src)) {
      const v = document.createElement('video');
      v.className = 'hero-media';
      v.src = src; v.controls = true; v.playsInline = true;
      heroBox.prepend(v);
    } else {
      const i = document.createElement('img');
      i.className = 'hero-media';
      i.src = src; i.alt = 'hero';
      heroBox.prepend(i);
    }
    localStorage.setItem('thegrid.hero', src);
  }
  // restore previous hero if any
  const savedHero = localStorage.getItem('thegrid.hero');
  if (savedHero) setHero(savedHero);

  // Build library grid if elements exist
  const libTabs = $('#libTabs');
  const libGrid = $('#libGrid');
  const uiHero  = $('#uiHero');

  async function loadManifest() {
    // try assets/manifest.json else fallback
    const fallback = {
      "Hero":["assets/videos/hero_1.mp4","assets/images/hero_1.jpg"],
      "Reels 9:16":[],
      "Reels 16:9":[],
      "Backgrounds":[],
      "Logos":["assets/videos/gc_spin.mp4","assets/images/gc_logo.png"],
      "Images":["assets/images/hero_1.jpg"]
    };
    try {
      const res = await fetch('assets/manifest.json', {cache:'no-store'});
      if (!res.ok) return fallback;
      return await res.json();
    } catch { return fallback; }
  }

  function buildLibrary(manifest){
    if (!libTabs || !libGrid) return;
    libTabs.innerHTML=''; libGrid.innerHTML='';
    const cats = Object.keys(manifest);
    const active = localStorage.getItem('thegrid.activeTab') || cats[0];

    cats.forEach(cat=>{
      const b = document.createElement('div');
      b.className = 'pill' + (cat===active?' active':'' );
      b.textContent = cat;
      b.onclick = ()=>{ localStorage.setItem('thegrid.activeTab', cat); buildLibrary(manifest); };
      libTabs.appendChild(b);
    });

    const list = manifest[active] || [];
    libGrid.innerHTML='';
    list.forEach(src=>{
      const row = document.createElement('div');
      row.className = 'tile';
      row.innerHTML = `
        <div class="thumb">${/\.(mp4|webm|mov)$/i.test(src) ? `<video src="${src}" muted autoplay loop playsinline></video>` : `<img src="${src}"/>`}</div>
        <div><b>${src.split('/').pop()}</b><div class="meta">${src}</div></div>
      `;
      row.onclick = ()=> setHero(src);
      libGrid.appendChild(row);
    });

    if (uiHero) {
      uiHero.innerHTML='';
      const all = [...new Set(Object.values(manifest).flat())];
      all.forEach(src=>{
        uiHero.add(new Option(src,src, src===savedHero, src===savedHero));
      });
      uiHero.oninput = e=> setHero(e.target.value);
    }
  }

  Promise.resolve().then(loadManifest).then(buildLibrary);

  /* ---------- Pricing (plans + services) ---------- */
  const plansWrap = $('#plans .grid');
  const planModal = $('#planModal');
  const mTitle = $('#mTitle');
  const mBody  = $('#mBody');

  async function loadJSON(path, fallback){
    try {
      const r = await fetch(path, {cache:'no-store'});
      if (!r.ok) throw 0;
      return await r.json();
    } catch { return fallback; }
  }

  async function buildPlans() {
    if (!plansWrap) return;
    const plans = await loadJSON('assets/data/plans.json', []);
    plansWrap.innerHTML = '';
    plans.forEach(p=>{
      const card = document.createElement('article');
      card.className = 'plan' + (p.tier==='gold'?' gold': p.tier==='diamond'?' diamond':'');
      card.dataset.tier = p.tier;
      card.innerHTML = `
        <div class="head">
          <div class="price">£${p.price}<span class="muted">/${p.period}</span></div>
          <span class="badge">${p.tier.toUpperCase()}</span>
        </div>
        <ul>${p.features.map(f=>`<li>${f}</li>`).join('')}</ul>
        <div class="row">
          <button class="btn primary choose">Choose</button>
          <button class="btn ghost details">Details</button>
        </div>
      `;
      plansWrap.appendChild(card);
    });

    // wire buttons
    $$('.choose', plansWrap).forEach(btn=>{
      btn.onclick = (e)=>{
        const card = e.currentTarget.closest('.plan');
        confettiBurst(card);
        card.scrollIntoView({behavior:'smooth', block:'center'});
      };
    });
    $$('.details', plansWrap).forEach(btn=>{
      btn.onclick = (e)=>{
        const card = e.currentTarget.closest('.plan');
        const tier = card.dataset.tier;
        const item = plans.find(x=>x.tier===tier);
        if (!planModal || !mTitle || !mBody) return;
        mTitle.textContent = `${tier.toUpperCase()} — details`;
        mBody.innerHTML = `
          <p class="muted">${item.description||'Plan details'}</p>
          <ul>${item.features.map(f=>`<li>${f}</li>`).join('')}</ul>
          <div class="ctaRow" style="margin-top:10px"><button class="btn primary" onclick="document.querySelector('#planModal').close()">Sounds good</button></div>
        `;
        planModal.showModal();
      };
    });
  }
  buildPlans();

  /* ---------- Join Now scroll ---------- */
  const btnJoin = $('#btnJoin');
  if (btnJoin) {
    btnJoin.addEventListener('click', ()=>{
      const target = $('#plans') || document.body;
      target.scrollIntoView({behavior:'smooth', block:'start'});
    });
  }

  /* ---------- Confetti (tasteful, faster) ---------- */
  const fx = $('#fx');
  let ctx, W, H, parts = [];
  if (fx) {
    ctx = fx.getContext('2d');
    const size = ()=>{ W=fx.width=innerWidth*devicePixelRatio; H=fx.height=innerHeight*devicePixelRatio; };
    addEventListener('resize', size); size();
    requestAnimationFrame(tick);
  }
  function confettiBurst(el){
    if (!ctx) return;
    const r = el.getBoundingClientRect();
    const y = (r.top + r.height*0.3) * devicePixelRatio;
    const lx = (r.left - 8) * devicePixelRatio;
    const rx = (r.right + 8) * devicePixelRatio;
    const n = 60; // density
    const speed = 1.2;
    const colors = [getVar('--accent')||'#E7B84B','#ffffff','#d7e0ff','#c8d0ea'];
    for (let i=0;i<n;i++){ parts.push(drop(lx,y, 1,speed,colors)); parts.push(drop(rx,y,-1,speed,colors)); }
  }
  function drop(x,y,dir,s,colors){
    const sz = 3 + Math.random()*5.5;
    return {x,y,vx:(1.6+Math.random()*1.8)*dir*s, vy:(-2.4-Math.random()*2.2)*s, g:.1*s, r:Math.random()*6.28, w:sz, h:sz*.65, life:100+Math.random()*40, c:colors[(Math.random()*colors.length)|0], a:.9};
  }
  function tick(){
    if (!ctx) return;
    ctx.clearRect(0,0,W,H);
    parts = parts.filter(p=>p.life>0);
    parts.forEach(p=>{
      p.vy+=p.g; p.x+=p.vx; p.y+=p.vy; p.r+=.2; p.life--;
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.r);
      ctx.globalAlpha = Math.max(0, p.life/140) * p.a;
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);
      ctx.restore();
    });
    requestAnimationFrame(tick);
  }
  function getVar(name){ return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

  /* ---------- Library select -> hero ---------- */
  const heroSelect = $('#uiHero');
  if (heroSelect) heroSelect.oninput = e => setHero(e.target.value);

  /* ---------- Prevent auto-opening panel on load ---------- */
  // (Some previous builds opened it automatically; keep closed by default)
})();
