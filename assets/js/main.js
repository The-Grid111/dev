/* =========================================================
   THE GRID — single controller that loads JSON content
   Files: assets/data/site.json, plans.json, services.json,
          assets/manifest.json (media library)
   ========================================================= */
const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const get = async (url) => (await fetch(url, {cache:"no-store"})).json();
const setCSS = (v,val)=>document.documentElement.style.setProperty(v,val);
const getCSS = (v)=>getComputedStyle(document.documentElement).getPropertyValue(v).trim();

const state = {
  site:null, plans:[], services:[],
  library:{}, heroSrc:null,
  confetti:{density:44, speed:1.1}
};

/* -------------------- boot -------------------- */
window.addEventListener('DOMContentLoaded', init);

async function init(){
  await loadData();
  applyTheme();
  buildHeader();
  renderHero();
  await buildLibrary();
  buildPlans();
  buildServices();
  wireCustomizePanel();
  bgFX();
  confettiFX(); // idle but only fires on Choose clicks
}

/* -------------------- data -------------------- */
async function loadData(){
  state.site = await get('assets/data/site.json');
  // manifest can live at assets/manifest.json (preferred); if missing, fallback
  try { state.library = await get('assets/manifest.json'); }
  catch { state.library = defaultManifest(); }
  try { state.plans = await get('assets/data/plans.json'); } catch { state.plans = []; }
  try { state.services = await get('assets/data/services.json'); } catch { state.services = []; }
  state.heroSrc = state.site?.defaultHero || 'assets/videos/hero_1.mp4';
}

function defaultManifest(){
  return {
    "Hero":[
      "assets/videos/hero_1.mp4",
      "assets/videos/interaction_1.mp4",
      "assets/videos/pour_1.mp4",
      "assets/images/hero_1.jpg",
      "assets/images/hero_2.jpg",
      "assets/images/hero_3.jpg"
    ],
    "Reels 9:16":[],
    "Reels 16:9":[
      "assets/videos/hero_1.mp4",
      "assets/videos/natural_1.mp4",
      "assets/videos/spread_1.mp4",
      "assets/videos/transform_1.mp4"
    ],
    "Backgrounds":[
      "assets/images/grid_natural_1.jpg",
      "assets/images/grid_spread_1.jpg",
      "assets/images/grid_transform_1.jpg"
    ],
    "Logos":[
      "assets/videos/gc_spin.mp4",
      "assets/images/gc_logo.png"
    ],
    "Images":[
      "assets/images/hero_1.jpg",
      "assets/images/hero_2.jpg",
      "assets/images/hero_3.jpg",
      "assets/images/grid_interaction_1.jpg",
      "assets/images/grid_pour_1.jpg"
    ]
  };
}

/* -------------------- theme + header -------------------- */
function applyTheme(){
  const t = state.site?.theme || {};
  setCSS('--accent', t.accent || getCSS('--accent'));
  setCSS('--accent-2', t.accent2 || getCSS('--accent-2'));
  setCSS('--ink', t.ink || getCSS('--ink'));
  setCSS('--soft', t.soft || getCSS('--soft'));
  setCSS('--bg-a', t.bgA || getCSS('--bg-a'));
  setCSS('--bg-b', t.bgB || getCSS('--bg-b'));
  setCSS('--panel', t.panel || getCSS('--panel'));
  setCSS('--card', t.card || getCSS('--card'));
  setCSS('--ring', t.ring ?? getCSS('--ring') || 24);
  setCSS('--radius', (t.radius ?? 20) + 'px');
  setCSS('--fontScale', t.fontScale ?? 1);
  setCSS('--space', t.space ?? 1);
  setCSS('--vignette', t.vignette ?? 1);
}

function buildHeader(){
  // greeting
  const h = new Date().getHours();
  const word = h<12 ? 'Good morning' : h<18 ? 'Good afternoon' : 'Good evening';
  $('#hello').textContent = `${word} — ${state.site?.brand || 'THE GRID'}`;
  // logo video with fallback image
  const v = $('#logoVid');
  if(!v) return;
  v.src = state.site?.logoVideo || 'assets/videos/gc_spin.mp4';
  v.onerror = () => {
    const img = document.createElement('img');
    img.src = state.site?.logoFallback || 'assets/images/gc_logo.png';
    img.alt = 'Logo';
    v.replaceWith(img);
  };
  // join now anchor
  const j = $('#btnJoin');
  if (j && state.site?.joinHref) j.href = state.site.joinHref;
}

/* -------------------- hero -------------------- */
function setHero(src){ state.heroSrc = src; renderHero(); }
function renderHero(){
  const box = $('#hero'); if(!box) return;
  box.innerHTML = '<div class="heroOverlay"></div>';
  const isVideo = /\.(mp4|webm|mov)$/i.test(state.heroSrc || '');
  const node = document.createElement(isVideo ? 'video' : 'img');
  if(isVideo){
    Object.assign(node, {src:state.heroSrc, controls:true, playsInline:true, className:'hero-media'});
  }else{
    Object.assign(node, {src:state.heroSrc, alt:'hero', className:'hero-media'});
  }
  box.prepend(node);
  $('#heroTitle').textContent = state.site?.heroTitle || 'Black & Gold';
  const lede = $('.lede'); if(lede) lede.textContent = state.site?.heroLede || lede.textContent;
}

/* -------------------- library -------------------- */
function buildLibrary(){
  const tabs = $('#libTabs'); const grid = $('#libGrid'); const tagsBar = $('#libTags');
  if(!tabs || !grid) return;
  tabs.innerHTML = ''; grid.innerHTML = ''; tagsBar.innerHTML = '';

  const cats = Object.keys(state.library);
  const active = localStorage.getItem('thegrid.activeTab') || cats[0];

  cats.forEach(cat=>{
    const b = pill(cat, cat===active);
    b.onclick = ()=>{ localStorage.setItem('thegrid.activeTab',cat); buildLibrary(); };
    tabs.appendChild(b);
  });

  const list = state.library[active] || [];
  // tag cloud
  const tags = [...new Set(list.flatMap(x=>{
    const n = x.split('/').pop().toLowerCase();
    return n.split(/[_\-\.]/g).filter(w=>w.length>2 && !/mp4|jpg|png|jpeg|webm|mov/.test(w));
  }))].slice(0,6);

  tags.forEach(t=>{
    const b = pill(t,false); b.style.opacity=.9;
    b.onclick = ()=> renderGrid(list.filter(x=>x.toLowerCase().includes(t)));
    tagsBar.appendChild(b);
  });

  renderGrid(list);

  function pill(txt, active){ const d=document.createElement('div'); d.className='pill'+(active?' active':''); d.textContent=txt; return d; }
  function renderGrid(items){
    grid.innerHTML='';
    items.forEach(src=>{
      const row = document.createElement('div'); row.className='tile';
      const th = document.createElement('div'); th.className='thumb';
      const label = document.createElement('div');
      label.innerHTML = `<b>${src.split('/').pop()}</b><div class="meta">${src}</div>`;
      if(/\.(mp4|webm|mov)$/i.test(src)){
        const v = document.createElement('video'); Object.assign(v,{src,muted:true,loop:true,autoplay:true,playsInline:true});
        th.appendChild(v);
      }else{
        const i = document.createElement('img'); i.src=src; th.appendChild(i);
      }
      row.appendChild(th); row.appendChild(label);
      row.onclick=()=>setHero(src);
      grid.appendChild(row);
    });
  }
}

/* -------------------- plans + modal -------------------- */
function buildPlans(){
  const plansWrap = $('#plans .grid'); if(!plansWrap) return;
  plansWrap.innerHTML = '';
  state.plans.forEach(p=>{
    const el = document.createElement('article');
    el.className = `plan${p.tier==='gold'?' gold':''}${p.tier==='diamond'?' diamond':''}`;
    el.dataset.tier = p.tier;
    el.innerHTML = `
      <div class="head">
        <div class="price">${p.price.replace('/mo','<span class="muted">/mo</span>')}</div>
        <span class="badge">${p.badge}</span>
      </div>
      <ul>${p.bullets.map(b=>`<li>${b}</li>`).join('')}</ul>
      <div class="row">
        <button class="btn primary choose">Choose</button>
        <button class="btn ghost details">Details</button>
      </div>
    `;
    plansWrap.appendChild(el);
  });

  // wire buttons
  $$('.choose').forEach(btn=>{
    btn.onclick = (e)=>{ blastConfetti(e.clientX, e.clientY); };
  });
  $$('.details').forEach(btn=>{
    btn.onclick = (e)=>{
      const tier = e.target.closest('.plan').dataset.tier;
      openPlanModal(tier);
    };
  });
}

function openPlanModal(tier){
  const data = state.plans.find(p=>p.tier===tier); if(!data) return;
  $('#mTitle').textContent = `${data.badge} plan`;
  $('#mBody').innerHTML = `
    <h3>Who it’s for</h3>
    <p class="muted">${data.modal.who}</p>
    <h3>What you get</h3>
    <ul>${data.modal.gets.map(x=>`<li>${x}</li>`).join('')}</ul>
    <div class="ctaRow"><button class="btn primary">Sounds good</button></div>
  `;
  planModal.showModal();
}

/* -------------------- services -------------------- */
function buildServices(){
  // find the À-la-carte section grid (3rd card section). If not found, skip.
  const sections = $$('main > section.card');
  const svcSection = sections[3] || sections.find(s=>s.querySelector('h2')?.textContent?.includes('À-la-carte'));
  if(!svcSection) return;
  const grid = svcSection.querySelector('.grid'); if(!grid) return;
  grid.innerHTML='';
  state.services.forEach(s=>{
    const el = document.createElement('article');
    el.className='plan';
    el.innerHTML = `
      <div class="head"><div class="price" style="font-size:28px">${s.price}</div><span class="badge">${s.badge}</span></div>
      <ul>${s.bullets.map(b=>`<li>${b}</li>`).join('')}</ul>
      <button class="btn primary">${s.cta}</button>
    `;
    grid.appendChild(el);
  });
}

/* -------------------- customize panel bindings -------------------- */
function wireCustomizePanel(){
  const p = $('#panel'); if(!p) return;

  const bind = (id, cssVar, transform = (v)=>v)=>{
    const el = $('#'+id); if(!el) return;
    const apply = v=> setCSS(cssVar, transform(v));
    el.oninput = e=> apply(e.target.value);
    // set initial UI if present in site.theme
    const t = state.site?.theme || {};
    if(id==='uiRadius' && t.radius!=null) el.value = t.radius;
    if(id==='uiRing' && t.ring!=null) el.value = t.ring;
  };

  $('#btnCustomize')?.addEventListener('click', ()=> p.showModal());
  $('#reset')?.addEventListener('click', ()=>{ localStorage.removeItem('thegrid.settings'); location.reload(); });

  bind('uiAccent','--accent');
  bind('uiAccent2','--accent-2');
  bind('uiInk','--ink');
  bind('uiSoft','--soft');
  bind('uiCard','--card');
  bind('uiPanel','--panel');
  bind('uiBgA','--bg-a');
  bind('uiBgB','--bg-b');
  bind('uiRing','--ring', v=>v);
  bind('uiRadius','--radius', v=>v+'px');
  bind('uiFont','--fontScale');
  bind('uiSpace','--space');
  const vg = $('#uiVignette'); if(vg){ vg.oninput = e=> setCSS('--vignette', e.target.value); }
  const heroSel = $('#uiHero');
  if(heroSel){
    const all = [...new Set(Object.values(state.library).flat())];
    all.forEach(src=> heroSel.add(new Option(src, src, src===state.heroSrc, src===state.heroSrc)));
    heroSel.oninput = e=> setHero(e.target.value);
  }
}

/* -------------------- FX: background + confetti -------------------- */
function bgFX(){
  const grad = $('#bgGrad'), g = grad.getContext('2d');
  const part = $('#bgParticles'), q = part.getContext('2d');
  let W,H,t=0, dots=[];
  function size(){
    W=grad.width=innerWidth*devicePixelRatio; H=grad.height=innerHeight*devicePixelRatio;
    part.width=W; part.height=H;
    dots = Array.from({length:Math.min(70, Math.round(innerWidth/14))}, ()=>({
      x:Math.random()*W, y:Math.random()*H, r:1+Math.random()*2.5, vx:(Math.random()-.5)*.2, vy:(Math.random()-.5)*.2, a:.08+Math.random()*.12
    }));
  }
  function tick(){
    t+=.0025;
    const x = Math.sin(t)*W*0.2 + W*0.5;
    const y = Math.cos(t*1.2)*H*0.2 + H*0.5;
    const grd = g.createRadialGradient(x,y,0, W/2,H/2, Math.hypot(W,H)/1.2);
    grd.addColorStop(0, getCSS('--bg-a')); grd.addColorStop(1, getCSS('--bg-b'));
    g.fillStyle = grd; g.fillRect(0,0,W,H);

    q.clearRect(0,0,W,H);
    dots.forEach(d=>{
      d.x+=d.vx; d.y+=d.vy;
      if(d.x<0||d.x>W) d.vx*=-1; if(d.y<0||d.y>H) d.vy*=-1;
      q.beginPath(); q.fillStyle = `rgba(231,184,75,${d.a})`; q.arc(d.x,d.y,d.r,0,6.283); q.fill();
    });
    requestAnimationFrame(tick);
  }
  addEventListener('resize', size); size(); tick();
}

function confettiFX(){
  const fx = $('#fx'); const ctx = fx.getContext('2d');
  function size(){ fx.width=innerWidth*devicePixelRatio; fx.height=innerHeight*devicePixelRatio; }
  addEventListener('resize', size); size();

  let pieces = [];
  function step(){
    ctx.clearRect(0,0,fx.width,fx.height);
    pieces.forEach(p=>{
      p.y += p.vy; p.x += p.vx; p.r += 0.08;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.fillStyle = p.c; ctx.fillRect(-p.s/2, -p.s/2, p.s, p.s);
      ctx.restore();
    });
    pieces = pieces.filter(p=>p.y < fx.height + 40);
    requestAnimationFrame(step);
  }
  step();

  // public trigger
  window.blastConfetti = (x,y)=>{
    const dpr = devicePixelRatio||1;
    const n = 70; // tighter than before
    for(let i=0;i<n;i++){
      pieces.push({
        x: x*dpr + (Math.random()*40-20),
        y: y*dpr + (Math.random()*20-10),
        vx: (Math.random()*2-1)*2,
        vy: (Math.random()*1.5+1),
        s: Math.random()*8+4,
        r: Math.random()*6.28,
        c: ['#E7B84B','#d7dbea','#95B2FF','#ffffff'][Math.floor(Math.random()*4)]
      });
    }
  };
}
