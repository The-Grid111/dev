/* ========= tiny helpers + state ========= */
const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const css = (k,v)=>document.documentElement.style.setProperty(k,v);
const get = k => getComputedStyle(document.documentElement).getPropertyValue(k).trim();
const save = ()=> localStorage.setItem('thegrid.settings', JSON.stringify(state));
const load = ()=> {
  try{
    const s = JSON.parse(localStorage.getItem('thegrid.settings')||'null');
    if(s) Object.assign(state,s);
  }catch{}
};

const state = {
  accent:get('--accent'), accent2:get('--accent-2'),
  ink:get('--ink'), soft:get('--soft'),
  bgA:get('--bg-a'), bgB:get('--bg-b'),
  panel:get('--panel'), card:get('--card'),
  ring:+get('--ring'), radius:parseInt(get('--radius')),
  font:+get('--fontScale'), space:+get('--space'),
  vignette:+get('--vignette'),
  tagline:'Black & Gold',                  // ← editable in panel
  heroSrc:'assets/videos/hero_1.mp4',
  confetti:{density:44, speed:1.1},
  library:{ Hero:[], 'Reels 9:16':[], 'Reels 16:9':[], Backgrounds:[], Logos:[], Images:[] },
  tags:[]
};

/* ========= greeting + header compact ========= */
(function greeting(){
  const h = new Date().getHours();
  const word = h<12?'Good morning':h<18?'Good afternoon':'Good evening';
  $('#hello').textContent = `${word} — THE GRID`;
  $('#tagline').textContent = state.tagline;
})();

(function compactHeader(){
  let last = 0;
  addEventListener('scroll', ()=>{
    const y = scrollY;
    const bar = document.querySelector('header');
    bar.style.boxShadow = y>10 ? '0 6px 22px rgba(0,0,0,.45)' : 'none';
    // nothing else needed — header is already short via CSS
    last = y;
  }, {passive:true});
})();

/* ========= logo (video → img fallback) ========= */
(function logo(){
  const v = $('#logoVid');
  v.src = 'assets/videos/gc_spin.mp4';
  v.onerror = ()=> v.replaceWith(Object.assign(document.createElement('img'),{src:'assets/images/gc_logo.png',alt:'Logo'}));
})();

/* ========= FX backgrounds (safe for iOS screenshots) ========= */
(function bgFX(){
  const grad = $('#bgGrad'), g = grad.getContext('2d');
  const p = $('#bgParticles'), q = p.getContext('2d');
  let W,H,t=0,dots=[];
  function size(){
    W=grad.width=innerWidth*devicePixelRatio; H=grad.height=innerHeight*devicePixelRatio;
    p.width=W; p.height=H;
    dots = Array.from({length:Math.min(70, Math.round(innerWidth/14))}, ()=>({
      x:Math.random()*W, y:Math.random()*H, r:1+Math.random()*2.5,
      vx:(Math.random()-.5)*.2, vy:(Math.random()-.5)*.2, a:.08+Math.random()*.12
    }));
  }
  function tick(){
    t+=.0025;
    const x = Math.sin(t)*W*0.2 + W*0.5;
    const y = Math.cos(t*1.2)*H*0.2 + H*0.5;
    const grd = g.createRadialGradient(x,y,0, W/2,H/2, Math.hypot(W,H)/1.2);
    grd.addColorStop(0, get('--bg-a')); grd.addColorStop(1, get('--bg-b'));
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
})();

/* ========= Hero ========= */
function setHero(src){ state.heroSrc = src; save(); renderHero(); }
function renderHero(){
  const box = $('#hero'); box.innerHTML = '<div class="heroOverlay"></div>';
  if(/\.(mp4|webm|mov)$/i.test(state.heroSrc)){
    const v = Object.assign(document.createElement('video'), {
      src:state.heroSrc, controls:true, playsInline:true, className:'hero-media'
    });
    v.setAttribute('poster',''); // prevents iOS “black flash”
    box.prepend(v);
  }else{
    const i = Object.assign(document.createElement('img'), {src:state.heroSrc, alt:'hero', className:'hero-media'});
    box.prepend(i);
  }
}

/* ========= Library (manifest-aware) ========= */
const defaultManifest = {
  "Hero":[
    "assets/videos/hero_1.mp4",
    "assets/images/hero_1.jpg"
  ],
  "Reels 9:16":[],
  "Reels 16:9":[
    "assets/videos/hero_1.mp4"
  ],
  "Backgrounds":[
    "assets/images/grid_natural_1.jpg"
  ],
  "Logos":[
    "assets/videos/gc_spin.mp4",
    "assets/images/gc_logo.png"
  ],
  "Images":[
    "assets/images/hero_1.jpg","assets/images/hero_2.jpg","assets/images/hero_3.jpg"
  ]
};

async function loadManifest(){
  let data = defaultManifest;
  try{
    const res = await fetch('assets/manifest.json',{cache:'no-store'});
    if(res.ok){
      const j = await res.json();
      data = {...defaultManifest, ...j}; // sensible defaults + your file list
    }
  }catch{}
  state.library = data;
  buildLibrary();
  fillHeroSelect();
}

function pill(txt, active){
  const b = Object.assign(document.createElement('div'),{className:'pill'+(active?' active':''),textContent:txt});
  return b;
}
function buildLibrary(){
  const tabs = $('#libTabs'); tabs.innerHTML='';
  const grid = $('#libGrid'); grid.innerHTML='';
  const cats = Object.keys(state.library);
  const active = localStorage.getItem('thegrid.activeTab') || cats[0];

  cats.forEach(cat=>{
    const b = pill(cat, cat===active);
    b.onclick = ()=>{ localStorage.setItem('thegrid.activeTab',cat); buildLibrary(); };
    tabs.appendChild(b);
  });

  const all = state.library[active] || [];
  // tags from filenames
  const tagBar = $('#libTags'); tagBar.innerHTML='';
  const tags = [...new Set(all.flatMap(x=>x.split('/').pop().toLowerCase().split(/[_\-.]/g).filter(w=>w.length>2 && !/mp4|jpg|png|jpeg|webm|mov/.test(w))))].slice(0,6);
  state.tags = tags;
  tags.forEach(t=>{
    const b = pill(t,false); b.style.opacity=.9;
    b.onclick = ()=> renderGrid(all.filter(x=>x.toLowerCase().includes(t)));
    tagBar.appendChild(b);
  });

  renderGrid(all);
}
function renderGrid(list){
  const grid = $('#libGrid'); grid.innerHTML='';
  if(!list.length){ grid.innerHTML = '<div class="muted">No items listed here yet — add paths in <b>assets/manifest.json</b>.</div>'; return; }
  list.forEach(src=>{
    const row = document.createElement('div'); row.className='tile';
    const th = document.createElement('div'); th.className='thumb';
    const label = document.createElement('div');
    label.innerHTML = `<b>${src.split('/').pop()}</b><div class="meta">${src}</div>`;
    if(/\.(mp4|webm|mov)$/i.test(src)){
      const v = document.createElement('video'); v.src=src; v.muted=true; v.playsInline=true; v.loop=true; v.autoplay=true;
      th.appendChild(v);
    }else{
      const i = document.createElement('img'); i.src=src; th.appendChild(i);
    }
    row.appendChild(th); row.appendChild(label);
    row.onclick=()=>setHero(src);
    grid.appendChild(row);
  });
}
function fillHeroSelect(){
  const sel = $('#uiHero'); if(!sel) return;
  sel.innerHTML='';
  const all = [...new Set(Object.values(state.library).flat())];
  all.forEach(src=> sel.add(new Option(src, src, src===state.heroSrc, src===state.heroSrc)));
}

/* ========= Customize Panel ========= */
$('#btnCustomize').onclick = ()=>panel.showModal();
$('#save').onclick = ()=>{ save(); alert('Saved to this device.'); };
$('#reset').onclick = ()=>{ localStorage.removeItem('thegrid.settings'); location.reload(); };

function applyState(){
  css('--accent',state.accent);   css('--accent-2',state.accent2);
  css('--ink',state.ink);         css('--soft',state.soft);
  css('--bg-a',state.bgA);        css('--bg-b',state.bgB);
  css('--panel',state.panel);     css('--card',state.card);
  css('--ring',state.ring);       css('--radius',state.radius+'px');
  css('--fontScale',state.font);  css('--space',state.space);
  css('--vignette',state.vignette);
  $('#tagline').textContent = state.tagline;

  // mirror to controls (when panel first opens)
  $('#uiAccent').value = state.accent;   $('#uiAccent2').value = state.accent2;
  $('#uiInk').value = state.ink;         $('#uiSoft').value = state.soft;
  $('#uiCard').value = state.card;       $('#uiPanel').value = state.panel;
  $('#uiBgA').value = state.bgA;         $('#uiBgB').value = state.bgB;
  $('#uiRing').value = state.ring;       $('#uiRadius').value = state.radius;
  $('#uiFont').value = state.font;       $('#uiSpace').value = state.space;
  $('#uiVignette').value = state.vignette;
}
['uiAccent','uiAccent2','uiInk','uiSoft','uiCard','uiPanel','uiBgA','uiBgB','uiRing','uiRadius','uiFont','uiSpace','uiVignette']
.forEach(id=>{
  const el = document.getElementById(id);
  el && (el.oninput = e=>{
    const m = {
      uiAccent:'accent', uiAccent2:'accent2', uiInk:'ink', uiSoft:'soft',
      uiCard:'card', uiPanel:'panel', uiBgA:'bgA', uiBgB:'bgB',
      uiRing:'ring', uiRadius:'radius', uiFont:'font', uiSpace:'space', uiVignette:'vignette'
    }[id];
    state[m] = id==='uiRadius'||id==='uiRing'||id==='uiFont'||id==='uiSpace'||id==='uiVignette' ? +e.target.value : e.target.value;
    applyState(); save();
  });
});
// extra control: tagline + hero
const taglineInput = document.getElementById('uiTagline');
if(taglineInput){
  taglineInput.value = state.tagline;
  taglineInput.oninput = e=>{ state.tagline = e.target.value; applyState(); save(); };
}
$('#uiHero') && ($('#uiHero').oninput = e=> setHero(e.target.value));

/* ========= Plans modal, CTAs, init ========= */
const planCopy = {
  basic:{ title:'BASIC plan',
    who:`Creators getting started or teams who want a clean base fast.`,
    gets:[ 'Starter templates & blocks','Access to the media library (videos, images, logos)','Email support within 48h','7-day refund guarantee','Upgrade anytime — keep your settings, no rebuilds' ] },
  silver:{ title:'SILVER plan',
    who:`Growing creators who want better visuals and faster support.`,
    gets:[ 'Everything in Basic','Advanced visual effects & presets','Priority email support within 24h','Quarterly tune-ups' ] },
  gold:{ title:'GOLD plan',
    who:`Teams that need hands-on help and admin tools.`,
    gets:[ 'Hands-on customization session','Admin toolkit & automation setup','Onboarding call (45 min)','Template & block requests' ] },
  diamond:{ title:'DIAMOND plan',
    who:`Creators/businesses needing custom pipelines and priority turnaround.`,
    gets:[ 'Custom pipelines & integrations','Hands-on help building your stack','Priority roadmap & turnaround','Private components when needed' ] },
};
function openPlan(tier){
  const p = planCopy[tier];
  $('#mTitle').textContent = p.title;
  $('#mBody').innerHTML = `
    <p class="muted"><b>Who it’s for</b><br>${p.who}</p>
    <p class="muted"><b>What you get</b></p>
    <ul>${p.gets.map(x=>`<li>${x}</li>`).join('')}</ul>
    <button class="btn primary" onclick="planModal.close()">Sounds good</button>
  `;
  planModal.showModal();
}

function bindPlans(){
  $$('.plan .details').forEach((b,i)=>{
    const tier = b.closest('.plan').dataset.tier;
    b.onclick = ()=> openPlan(tier);
  });
}
function bindCTAs(){
  $('a[href="#library"]')?.addEventListener('click', e=>{ e.preventDefault(); $('#library').scrollIntoView({behavior:'smooth'}); });
  $('a[href="#plans"]')?.addEventListener('click', e=>{ e.preventDefault(); $('#plans').scrollIntoView({behavior:'smooth'}); });
  $('#btnJoin')?.addEventListener('click', ()=> alert('Thanks! We’ll be in touch.'));
}

/* ========= boot ========= */
function applyAndInit(){
  applyState();
  renderHero();
  loadManifest();
  bindPlans();
  bindCTAs();
}
load();
addEventListener('DOMContentLoaded', applyAndInit);
