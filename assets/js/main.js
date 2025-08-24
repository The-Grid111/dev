/* ================================
   THE GRID — Core JS (v2)
   Drop-in replacement for /assets/js/main.js
   ================================ */

/* ---------- Utilities ---------- */
const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const storeKey = 'grid:v2:ui';

/* ---------- Panels / overlay ---------- */
const overlay = $('#ui-overlay');
const sheet   = $('#design-panel');
const join    = $('#join-modal');
const details = $('#details-modal');
const detailsTitle = $('#details-title');
const detailsList  = $('#details-list');
const detailsChoose= $('#details-choose');

function openLayer(el){
  document.body.classList.add('no-scroll');
  overlay.classList.remove('hidden'); el.classList.remove('hidden');
  overlay.classList.add('show'); el.classList.add('show');
}
function closeLayers(){
  document.body.classList.remove('no-scroll');
  overlay.classList.remove('show');
  $$('.modal,.sheet').forEach(x=>x.classList.remove('show'));
  setTimeout(()=>{
    overlay.classList.add('hidden');
    $$('.modal,.sheet').forEach(x=>x.classList.add('hidden'));
  },200);
}

/* Header button wiring */
$$('[data-action="customize"]').forEach(b=>{
  b.addEventListener('click', e=>{e.preventDefault(); openLayer(sheet);}, {passive:false});
});
$$('[data-action="join"]').forEach(b=>{
  b.addEventListener('click', e=>{e.preventDefault(); openLayer(join);}, {passive:false});
});
overlay?.addEventListener('click', closeLayers);
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeLayers(); });
$$('[data-close]').forEach(b=>b.addEventListener('click', closeLayers));

/* ---------- State & persistence ---------- */
const DEFAULTS = {
  accent: '#f3c545',
  radius: 18,
  glow:   0.35,
  font:   1.00,     // scale
  wrap:   1100,     // px
  hero:   42,       // vh
  border: 1,        // px
  shadow: 40,       // px
  head:   'glass',  // glass | solid | floating
  preset: 'Gold'
};

function loadState(){
  try{
    const raw = localStorage.getItem(storeKey);
    if(!raw) return {...DEFAULTS};
    const parsed = JSON.parse(raw);
    return {...DEFAULTS, ...parsed};
  }catch(e){ return {...DEFAULTS}; }
}

function saveState(s){
  try{ localStorage.setItem(storeKey, JSON.stringify(s)); }
  catch(e){ /* storage might be blocked; non-fatal */ }
}

let STATE = loadState();

/* Apply state to CSS vars / attributes */
function applyState(s){
  root.style.setProperty('--accent', s.accent);
  root.style.setProperty('--card-radius', `${s.radius}px`);
  root.style.setProperty('--glow', String(s.glow));
  root.style.setProperty('--font-scale', String(s.font));
  root.style.setProperty('--wrap', `${s.wrap}px`);
  root.style.setProperty('--hero-h', `${s.hero}vh`);
  root.style.setProperty('--border-w', `${s.border}px`);
  root.style.setProperty('--shadow-depth', `${s.shadow}px`);
  root.setAttribute('data-head', s.head);
}

/* ---------- Customize controls ---------- */
const ctrl = {
  accent:  $('#ctrl-accent'),
  radius:  $('#ctrl-radius'),
  glow:    $('#ctrl-glow'),
  font:    $('#ctrl-font'),
  wrap:    $('#ctrl-wrap'),
  hero:    $('#ctrl-hero'),
  border:  $('#ctrl-border'),
  shadow:  $('#ctrl-shadow'),
  head:    $('#ctrl-headmode'),
  reset:   $('#ctrl-reset'),
  done:    $('#ctrl-done'),
};

function syncControlsFromState(s){
  if(ctrl.accent) ctrl.accent.value = s.accent;
  if(ctrl.radius) ctrl.radius.value = s.radius;
  if(ctrl.glow)   ctrl.glow.value   = s.glow;
  if(ctrl.font)   ctrl.font.value   = s.font;
  if(ctrl.wrap)   ctrl.wrap.value   = s.wrap;
  if(ctrl.hero)   ctrl.hero.value   = s.hero;
  if(ctrl.border) ctrl.border.value = s.border;
  if(ctrl.shadow) ctrl.shadow.value = s.shadow;
  if(ctrl.head)   ctrl.head.value   = s.head;
}

function wireControl(el, key, transform=(v)=>v){
  el?.addEventListener('input', e=>{
    STATE[key] = transform(e.target.value);
    applyState(STATE); saveState(STATE);
  });
}

wireControl(ctrl.accent, 'accent', v=>v);
wireControl(ctrl.radius, 'radius', v=>parseInt(v,10));
wireControl(ctrl.glow,   'glow',   v=>parseFloat(v));
wireControl(ctrl.font,   'font',   v=>parseFloat(v));
wireControl(ctrl.wrap,   'wrap',   v=>parseInt(v,10));
wireControl(ctrl.hero,   'hero',   v=>parseInt(v,10));
wireControl(ctrl.border, 'border', v=>parseInt(v,10));
wireControl(ctrl.shadow, 'shadow', v=>parseInt(v,10));
wireControl(ctrl.head,   'head',   v=>v);

/* Presets */
const PRESETS = {
  Gold:     { accent:'#f3c545', head:'glass'   },
  Midnight: { accent:'#86a7ff', head:'solid'   },
  Emerald:  { accent:'#3ad3a3', head:'glass'   },
  Silver:   { accent:'#cfd6df', head:'floating'}
};
$$('[data-preset]').forEach(btn=>{
  btn.addEventListener('click', e=>{
    e.preventDefault();
    const name = btn.dataset.preset;
    const p = PRESETS[name]; if(!p) return;
    STATE = {...STATE, ...p, preset:name};
    applyState(STATE); saveState(STATE); syncControlsFromState(STATE);
    // quick visual affordance
    btn.animate([{transform:'scale(1)'},{transform:'scale(0.96)'},{transform:'scale(1)'}],{duration:160});
  }, {passive:false});
});

/* Reset / Done */
ctrl.reset?.addEventListener('click', ()=>{
  STATE = {...DEFAULTS};
  applyState(STATE); saveState(STATE); syncControlsFromState(STATE);
});
ctrl.done?.addEventListener('click', closeLayers);

/* Keep the customize drawer scrollable on mobile: focus trapping is avoided for simplicity */

/* ---------- Library clicks (confirm hero/source) ---------- */
$$('.grid.tiles .tile').forEach(tile=>{
  tile.addEventListener('click', ()=>{
    const t = tile.dataset.title || tile.textContent.trim();
    alert(`Set hero to: ${t}`);
  });
});

/* ---------- Plan Details + Choose ---------- */
function showDetails(payload, planCode){
  detailsTitle.textContent = payload.title || 'Plan Details';
  detailsList.innerHTML = '';
  (payload.points||[]).forEach(p=>{
    const li=document.createElement('li'); li.textContent=p; detailsList.appendChild(li);
  });
  detailsChoose.onclick = () => { closeLayers(); confirmChoice(planCode || payload.title); };
  openLayer(details);
}
function confirmChoice(code){
  // Simulated checkout + pre-fill contact subject
  const subject = $('#subject');
  if(subject) subject.value = `Join ${code}`;
  alert(`Selected: ${code}`);
}
$$('[data-choose]').forEach(btn=>{
  btn.addEventListener('click', e=>{
    e.preventDefault(); confirmChoice(btn.dataset.choose);
  }, {passive:false});
});
$$('[data-details]').forEach(btn=>{
  btn.addEventListener('click', e=>{
    e.preventDefault();
    const json = btn.getAttribute('data-details');
    try{
      const payload = JSON.parse(json);
      const article = btn.closest('.plan');
      const code = article?.dataset?.plan || payload.title;
      showDetails(payload, code);
    }catch(err){ console.error('Invalid details payload', err); }
  }, {passive:false});
});

/* ---------- Simple checkout stubs (replace with Stripe/PayPal later) ---------- */
function wireCheckout(){
  $$('[data-checkout]').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      e.preventDefault();
      const plan = btn.dataset.checkout;
      // Example payload you’d hand to Stripe/PayPal
      const payload = {
        plan,
        amount: btn.dataset.amount || null,
        currency: 'GBP',
        source: 'site-v2',
        ts: Date.now()
      };
      console.info('[checkout:init]', payload);
      alert(`Checkout init for: ${plan}`);
    }, {passive:false});
  });
}
wireCheckout();

/* ---------- Boot ---------- */
applyState(STATE);
syncControlsFromState(STATE);

/* ---------- Quantifiable telemetry (console only, lightweight) ---------- */
(function logMetrics(){
  const metrics = {
    device: ( screen?.width || window.innerWidth ) + 'x' + ( screen?.height || window.innerHeight ),
    dpr: window.devicePixelRatio || 1,
    scrollY: () => Math.round(window.scrollY),
    wrap: STATE.wrap,
    font: STATE.font,
    hero: STATE.hero,
  };
  console.info('[ui:metrics]', { ...metrics, scrollY: metrics.scrollY() });
  window.addEventListener('scroll', ()=> {
    // sparse logs
    if(Math.random()<0.02) console.info('[ui:scroll]', metrics.scrollY());
  }, {passive:true});
})();
