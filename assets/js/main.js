/* assets/js/main.js — GridCoreSystems core */

const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

/* ---------------- State & helpers ---------------- */
const CSS = (k,v)=> (v===undefined? getComputedStyle(document.documentElement).getPropertyValue(k).trim()
                                   : document.documentElement.style.setProperty(k,v));

const STORE_KEY = 'thegrid.settings';
const state = {
  theme: null, // "light" | "dark" | null (auto)
  accent: CSS('--accent'),
  accent2: CSS('--accent-2'),
  ink: CSS('--ink'),
  soft: CSS('--soft'),
  bgA: CSS('--bg-a'),
  bgB: CSS('--bg-b'),
  panel: CSS('--panel'),
  card: CSS('--card'),
  ring: +CSS('--ring'),
  radius: parseInt(CSS('--radius')),
  font: +CSS('--fontScale'),
  space: +CSS('--space'),
  vignette: +CSS('--vignette'),
  heroSrc: 'assets/videos/hero_1.mp4',
  confetti: { density: 44, speed: 1.1 },
  library: { Hero:[], 'Reels 9:16':[], 'Reels 16:9':[], Backgrounds:[], Logos:[], Images:[] },
  tags: []
};

const save = ()=> localStorage.setItem(STORE_KEY, JSON.stringify(state));
const load = ()=>{
  try{
    const s = JSON.parse(localStorage.getItem(STORE_KEY)||'null');
    if(!s) return;
    Object.assign(state, s);
  }catch{}
};

/* ---------------- Greeting & Header ---------------- */
(function greeting(){
  const h = new Date().getHours();
  const word = h<12?'Good morning':h<18?'Good afternoon':'Good evening';
  const el = $('#hello'); if(el) el.textContent = `${word} — THE GRID`;
})();

(function logo(){
  const v = $('#logoVid'); if(!v) return;
  v.src = 'assets/videos/gc_spin.mp4';
  v.onerror = () => {
    const img = document.createElement('img');
    img.src = 'assets/images/gc_logo.png';
    img.alt = 'Logo';
    v.replaceWith(img);
  };
})();

/* ---------------- Theme toggle ---------------- */
(function themeInit(){
  load();
  // apply saved theme
  if(state.theme === 'light') document.body.setAttribute('data-theme','light');
  if(state.theme === 'dark')  document.body.setAttribute('data-theme','dark');

  const btn = $('#themeToggle');
  if(btn){
    const apply = next=>{
      if(next==='auto'){ document.body.removeAttribute('data-theme'); state.theme=null; }
      else { document.body.setAttribute('data-theme', next); state.theme=next; }
      save();
      btn.textContent = (state.theme==='light'?'Dark':'Light') + ' Mode';
    };
    // initial label
    btn.textContent = (state.theme==='light'?'Dark':'Light') + ' Mode';
    btn.addEventListener('click', ()=>{
      const cur = state.theme ?? (matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');
      apply(cur==='light'?'dark':'light');
    });
  }
})();

/* ---------------- Hero render ---------------- */
function setHero(src){ state.heroSrc = src; save(); renderHero(); }
function renderHero(){
  const box = $('#hero'); if(!box) return;
  box.innerHTML = '<div class="heroOverlay"></div>';
  if(/\.(mp4|webm|mov)$/i.test(state.heroSrc)){
    const v = Object.assign(document.createElement('video'), {
      src: state.heroSrc, controls:true, playsInline:true, className:'hero-media'
    });
    box.prepend(v);
  }else{
    const i = Object.assign(document.createElement('img'), {
      src: state.heroSrc, alt: 'hero', className:'hero-media'
    });
    box.prepend(i);
  }
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
  "Logos": ["assets/videos/gc_spin.mp4","assets/images/gc_logo.png"],
  "Images": [
    "assets/images/hero_1.jpg",
    "assets/images/hero_2.jpg",
    "assets/images/hero_3.jpg",
    "assets/images/grid_interaction_1.jpg",
    "assets/images/grid_pour_1.jpg"
  ]
};

async function loadManifest(){
  try{
    const res = await fetch('assets/manifest.json',{cache:'no-store'});
    if(res.ok){
      const data = await res.json();
      Object.assign(state.library, data);
    }else{
      Object.assign(state.library, defaultManifest);
    }
  }catch{
    Object.assign(state.library, defaultManifest);
  }
  buildLibrary();
  populateHeroSelect();
}

function pill(txt, active){
  const b = document.createElement('div');
  b.className = 'pill' + (active?' active':'');
  b.textContent = txt;
  return b;
}

function buildLibrary(){
  const tabs = $('#libTabs'), grid = $('#libGrid'), tagBar = $('#libTags');
  if(!tabs || !grid) return;
  tabs.innerHTML = ''; grid.innerHTML = ''; if(tagBar) tagBar.innerHTML='';

  const cats = Object.keys(state.library);
  let active = localStorage.getItem('thegrid.activeTab') || cats[0];

  cats.forEach(cat=>{
    const b = pill(cat, cat===active);
    b.onclick = ()=>{ localStorage.setItem('thegrid.activeTab',cat); buildLibrary(); };
    tabs.appendChild(b);
  });

  const list = state.library[active] || [];
  // quick tags from filenames
  const tags = [...new Set(list.flatMap(x=>{
    const name = x.split('/').pop().toLowerCase();
    return name.split(/[_\-\.]/g).filter(w=>w.length>2 && !/mp4|jpg|jpeg|png|webm|mov/.test(w));
  }))].slice(0,6);
  state.tags = tags;

  if(tagBar){
    tags.forEach(t=>{
      const b = pill(t,false); b.style.opacity=.9;
      b.onclick = ()=> renderGrid(list.filter(x=>x.toLowerCase().includes(t)));
      tagBar.appendChild(b);
    });
  }
  renderGrid(list);
}

function renderGrid(list){
  const grid = $('#libGrid'); if(!grid) return;
  grid.innerHTML='';
  list.forEach(src=>{
    const row = document.createElement('div'); row.className='tile';
    const th  = document.createElement('div'); th.className='thumb';
    const label = document.createElement('div');
    label.innerHTML = `<b>${src.split('/').pop()}</b><div class="meta">${src}</div>`;
    if(/\.(mp4|webm|mov)$/i.test(src)){
      const v = document.createElement('video'); Object.assign(v,{src,muted:true,playsInline:true,loop:true,autoplay:true});
      th.appendChild(v);
    }else{
      const i = document.createElement('img'); i.src = src; th.appendChild(i);
    }
    row.appendChild(th); row.appendChild(label);
    row.onclick = ()=> setHero(src);
    grid.appendChild(row);
  });
}

function populateHeroSelect(){
  const sel = $('#uiHero'); if(!sel) return;
  sel.innerHTML='';
  const all = [...new Set(Object.values(state.library).flat())];
  all.forEach(src=>{
    const o = new Option(src, src, src===state.heroSrc, src===state.heroSrc);
    sel.add(o);
  });
}

/* ---------------- Customize panel ---------------- */
function bind(id, handler){
  const el = $('#'+id); if(el) el.oninput = handler;
}

function applyState(){
  CSS('--accent', state.accent);
  CSS('--accent-2', state.accent2);
  CSS('--ink', state.ink);
  CSS('--soft', state.soft);
  CSS('--bg-a', state.bgA);
  CSS('--bg-b', state.bgB);
  CSS('--panel', state.panel);
  CSS('--card', state.card);
  CSS('--ring', state.ring);
  CSS('--radius', state.radius+'px');
  CSS('--fontScale', state.font);
  CSS('--space', state.space);
  CSS('--vignette', state.vignette);
  renderHero();

  // reflect to inputs if present
  const map = {
    uiAccent:'accent', uiAccent2:'accent2', uiInk:'ink', uiSoft:'soft',
    uiCard:'card', uiPanel:'panel', uiBgA:'bgA', uiBgB:'bgB',
    uiRing:'ring', uiRadius:'radius', uiFont:'font', uiSpace:'space', uiVignette:'vignette'
  };
  Object.entries(map).forEach(([input, key])=>{
    const el = $('#'+input);
    if(el){ el.value = state[key]; }
  });
}

function setupCustomize(){
  const open = $('#btnCustomize'), saveBtn = $('#save'), resetBtn=$('#reset');
  if(open) open.onclick = ()=> panel.showModal();
  if(saveBtn) saveBtn.onclick = ()=>{ save(); alert('Saved to this device.'); };
  if(resetBtn) resetBtn.onclick = ()=>{ localStorage.removeItem(STORE_KEY); location.reload(); };

  bind('uiAccent',  e=>{ state.accent=e.target.value; CSS('--accent',state.accent); save(); });
  bind('uiAccent2', e=>{ state.accent2=e.target.value; CSS('--accent-2',state.accent2); save(); });
  bind('uiInk',     e=>{ state.ink=e.target.value; CSS('--ink',state.ink); save(); });
  bind('uiSoft',    e=>{ state.soft=e.target.value; CSS('--soft',state.soft); save(); });
  bind('uiCard',    e=>{ state.card=e.target.value; CSS('--card',state.card); save(); });
  bind('uiPanel',   e=>{ state.panel=e.target.value; CSS('--panel',state.panel); save(); });
  bind('uiBgA',     e=>{ state.bgA=e.target.value; CSS('--bg-a',state.bgA); save(); });
  bind('uiBgB',     e=>{ state.bgB=e.target.value; CSS('--bg-b',state.bgB); save(); });
  bind('uiRing',    e=>{ state.ring=+e.target.value; CSS('--ring',state.ring); save(); });
  bind('uiRadius',  e=>{ state.radius=+e.target.value; CSS('--radius',state.radius+'px'); save(); });
  bind('uiFont',    e=>{ state.font=+e.target.value; CSS('--fontScale',state.font); save(); });
  bind('uiSpace',   e=>{ state.space=+e.target.value; CSS('--space',state.space); save(); });
  bind('uiVignette',e=>{ state.vignette=+e.target.value; CSS('--vignette',state.vignette); save(); });

  const heroSel = $('#uiHero'); if(heroSel) heroSel.oninput = e=> setHero(e.target.value);
}

/* ---------------- Pricing: details + confetti ---------------- */
const DETAILS = {
  basic:`<ul><li>Starter templates & blocks</li><li>Library access (videos, images, logos)</li><li>Email support (48h)</li></ul>`,
  silver:`<ul><li>Everything in Basic</li><li>Advanced effects & presets</li><li>Priority email (24h)</li></ul>`,
  gold:`<ul><li>Full customization session</li><li>Admin toolkit & automations</li><li>Onboarding call (45 min)</li></ul>`,
  diamond:`<ul><li>Custom pipelines & integrations</li><li>Hands-on help building your stack</li><li>Priority roadmap & turnaround</li></ul>`
};

function setupPlans(){
  $$('.details').forEach(b=>{
    b.onclick = e=>{
      const card = e.currentTarget.closest('.plan');
      const tier = card.dataset.tier;
      $('#mTitle').textContent = tier.toUpperCase() + ' plan';
      $('#mBody').innerHTML = DETAILS[tier] + `<div class="ctaRow"><button class="btn primary" onclick="planModal.close()">Sounds good</button></div>`;
      planModal.showModal();
    };
  });
  $$('.choose').forEach(b=>{
    b.onclick = e=>{
      const card = e.currentTarget.closest('.plan');
      card.scrollIntoView({behavior:'smooth', block:'center'});
      confettiBurst(card);
    };
  });
}

/* ---------------- Confetti FX (gold-first, faster, tasteful) ---------------- */
const fx = $('#fx'); const ctx = fx ? fx.getContext('2d') : null;
let W=0,H=0, parts=[];
function resizeFX(){
  if(!fx) return;
  W=fx.width=innerWidth*devicePixelRatio;
  H=fx.height=innerHeight*devicePixelRatio;
}
function rand(a,b){ return a + Math.random()*(b-a); }

function confettiBurst(el){
  if(!ctx) return;
  const r = el.getBoundingClientRect();
  const y = (r.top + r.height*0.2) * devicePixelRatio;
  const leftX  = (r.left - 8) * devicePixelRatio;
  const rightX = (r.right + 8) * devicePixelRatio;
  const n = Math.max(8, Math.min(180, state.confetti.density|0));
  const s = +state.confetti.speed;

  const colors = [
    state.accent, '#fff8e6', '#f4d27a',
    '#c9d2e8', '#9ec5ff'
  ];

  for(let i=0;i<n;i++){
    parts.push(drop(leftX,  y,  1, s, colors));
    parts.push(drop(rightX, y, -1, s, colors));
  }
}

function drop(x,y,dir,s,colors){
  const sz = rand(3,7);
  return {
    x, y,
    vx: (rand(1.2,2.2))*dir*s,
    vy: (rand(-3.2,-1.5))*s,
    g:  .10*s,
    r:  Math.random()*Math.PI,
    w:  sz,
    h:  sz*rand(.5,.9),
    life: 120+Math.random()*60,
    c: colors[(Math.random()*colors.length)|0],
    a: rand(.8,1)
  };
}

function tick(){
  if(!ctx) return;
  ctx.clearRect(0,0,W,H);
  parts = parts.filter(p=>p.life>0);
  for(const p of parts){
    p.vy += p.g; p.x += p.vx; p.y += p.vy; p.r += .18; p.life--;
    ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.r);
    ctx.globalAlpha = Math.max(0, p.life/160) * p.a;
    ctx.fillStyle = p.c;
    ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);
    ctx.restore();
  }
  requestAnimationFrame(tick);
}

/* ---------------- Boot ---------------- */
function boot(){
  resizeFX(); addEventListener('resize', resizeFX);

  load();          // load saved settings first
  applyState();    // apply saved CSS/state to UI + hero
  loadManifest();  // build library (manifest-aware)
  setupCustomize();
  setupPlans();
}
boot();
requestAnimationFrame(tick);
