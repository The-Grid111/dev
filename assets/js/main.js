<!-- FILE: assets/js/main.js -->
<script>
/* Tiny helpers */
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];

/* Panels / overlay */
const overlay = $('#ui-overlay');
const sheet   = $('#design-panel');
const join    = $('#join-modal');
const details = $('#details-modal');
const detailsTitle = $('#details-title');
const detailsList  = $('#details-list');
const detailsChoose= $('#details-choose');

/* === Layer controls === */
function openLayer(el){
  document.body.classList.add('no-scroll');
  overlay?.classList.remove('hidden'); el?.classList.remove('hidden');
  overlay?.classList.add('show'); el?.classList.add('show');
}
function closeLayers(){
  document.body.classList.remove('no-scroll');
  overlay?.classList.remove('show'); $$('.modal,.sheet').forEach(x=>x.classList.remove('show'));
  setTimeout(()=>{ overlay?.classList.add('hidden'); $$('.modal,.sheet').forEach(x=>x.classList.add('hidden')); },200);
}

/* Wire header buttons */
$$('[data-action="customize"]').forEach(b=>{
  b.addEventListener('click', e=>{e.preventDefault(); openLayer(sheet);}, {passive:false});
});
$$('[data-action="join"]').forEach(b=>{
  b.addEventListener('click', e=>{e.preventDefault(); openLayer(join);}, {passive:false});
});
overlay?.addEventListener('click', closeLayers);
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeLayers(); });
$$('[data-close]').forEach(b=>b.addEventListener('click', closeLayers));

/* === Live design controls (with persistence) === */
const root = document.documentElement;
const STORE_KEY = 'thegrid_ui_v2';
const state = {
  accent:  get('--accent') || '#f3c545',
  radius:  parseInt(get('--card-radius')) || 18,
  glow:    parseFloat(get('--glow')) || .35,
  pattern: parseFloat(get('--pattern') || '0.35'),
  header:  document.body.dataset.header || 'glass',
  theme:   document.body.dataset.theme  || 'gold'
};
load();

function set(v, val){ root.style.setProperty(v, val); }
function get(v){ return getComputedStyle(root).getPropertyValue(v).trim(); }
function save(){ localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
function load(){
  try{
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    Object.assign(state, saved);
    // apply
    set('--accent', state.accent);
    set('--card-radius', `${state.radius}px`);
    set('--glow', state.glow);
    set('--pattern', state.pattern);
    document.body.dataset.header = state.header;
    document.body.dataset.theme  = state.theme;
  }catch{}
}

/* Controls */
$('#ctrl-accent')?.addEventListener('input', e=>{
  state.accent = e.target.value; set('--accent', state.accent); save();
});
$('#ctrl-radius')?.addEventListener('input', e=>{
  state.radius = +e.target.value; set('--card-radius', `${state.radius}px`); save();
});
$('#ctrl-glow')?.addEventListener('input', e=>{
  state.glow = +e.target.value; set('--glow', state.glow); save();
});
$('#ctrl-pattern')?.addEventListener('input', e=>{
  state.pattern = +e.target.value; set('--pattern', state.pattern); save();
});
$$('[data-theme]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    state.theme = btn.dataset.theme; document.body.dataset.theme = state.theme; save();
  });
});
$$('[data-header]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    state.header = btn.dataset.header; document.body.dataset.header = state.header; save();
  });
});

/* Library tiles (visual confirmation for now) */
$$('.grid.tiles .tile').forEach(tile=>{
  tile.addEventListener('click', ()=>{
    const t = tile.dataset.title || tile.textContent.trim();
    alert(`Set hero to: ${t}`);
  });
});

/* Plan Details + Choose (hands off to commerce.js if present) */
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
  // If commerce.js defines buyPlan, use it; otherwise fall back to alert + subject fill.
  if (window.buyPlan) {
    window.buyPlan(code);
    return;
  }
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
</script>
