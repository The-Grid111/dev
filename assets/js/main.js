/* ===== Utilities ===== */
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const root = document.documentElement;

/* ===== Layer helpers ===== */
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
  overlay.offsetHeight; // force reflow
  overlay.classList.add('show'); el.classList.add('show');
}
function closeLayers(){
  document.body.classList.remove('no-scroll');
  overlay.classList.remove('show'); $$('.modal,.sheet').forEach(x=>x.classList.remove('show'));
  setTimeout(()=>{ overlay.classList.add('hidden'); $$('.modal,.sheet').forEach(x=>x.classList.add('hidden')); },200);
}

/* ===== Owner mode (no password; URL or localStorage) ===== */
(function ownerBoot(){
  const url = new URL(location.href);
  if(url.searchParams.get('owner')==='1'){ localStorage.isOwner = '1'; }
  if(url.searchParams.get('owner')==='0'){ localStorage.removeItem('isOwner'); }
  const isOwner = localStorage.getItem('isOwner') === '1';
  if(isOwner){ document.body.classList.add('owner'); $('#owner-hint')?.style.setProperty('display','block'); }
})();

/* ===== Header buttons ===== */
$$('[data-action="customize"]').forEach(b=>b.addEventListener('click', e=>{e.preventDefault(); openLayer(sheet);},{passive:false}));
$$('[data-action="join"]').forEach(b=>b.addEventListener('click', e=>{e.preventDefault(); openLayer(join);},{passive:false}));
overlay.addEventListener('click', closeLayers);
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeLayers(); });
$$('[data-close]').forEach(b=>b.addEventListener('click', closeLayers));

/* ===== Theme persistence ===== */
const THEME_KEY = 'tgTheme.v1';
function applyTheme(t){
  if(!t) return;
  Object.entries(t.css||{}).forEach(([k,v])=>root.style.setProperty(k,v));
  const head = $('#siteHead');
  if(t.header) head.className = `site-head head--${t.header}`;
}
function saveTheme(part){
  const current = JSON.parse(localStorage.getItem(THEME_KEY) || '{"css":{}}');
  const next = {...current, ...part, css:{...current.css, ...(part.css||{})}};
  localStorage.setItem(THEME_KEY, JSON.stringify(next));
}
(function loadTheme(){
  // local save
  try{ applyTheme(JSON.parse(localStorage.getItem(THEME_KEY)||'{}')); }catch{}
  // optional repo save (won’t error if missing)
  fetch('assets/data/owner_core_save_v1.2.json').then(r=>r.ok?r.json():null).then(j=>{
    if(j && j.theme){ applyTheme(j.theme); }
  }).catch(()=>{});
})();

/* ===== Live controls ===== */
function bindRange(id, cssVar, unit=''){
  const el = $(id); if(!el) return;
  el.addEventListener('input', e=>{
    const val = unit ? `${e.target.value}${unit}` : e.target.value;
    root.style.setProperty(cssVar, val);
    saveTheme({css:{[cssVar]:val}});
  });
}
bindRange('#ctrl-accent','--accent');
bindRange('#ctrl-glow','--glow');
bindRange('#ctrl-radius','--card-radius','px');
bindRange('#ctrl-depth','--depth');
bindRange('#ctrl-font','--base-font','px');
bindRange('#ctrl-wrap','--wrap-max','px');
bindRange('#ctrl-pattern','--pattern');

$('#ctrl-reset')?.addEventListener('click', ()=>{
  localStorage.removeItem(THEME_KEY);
  location.reload();
});

/* Presets */
const PRESETS = {
  gold:     { css:{'--accent':'#f3c545','--card':'#121821','--pattern':.15}, header:'glass' },
  midnight: { css:{'--accent':'#6aa3ff','--card':'#0f141d','--pattern':.12}, header:'solid' },
  emerald:  { css:{'--accent':'#31d39a','--card':'#102018','--pattern':.10}, header:'floating' },
  silver:   { css:{'--accent':'#d7dde7','--card':'#141820','--pattern':.08}, header:'glass' }
};
$$('[data-preset]').forEach(b=>{
  b.addEventListener('click', ()=>{
    const p = PRESETS[b.dataset.preset]; if(!p) return;
    applyTheme(p); saveTheme(p);
  });
});
$$('[data-head]').forEach(b=>{
  b.addEventListener('click', ()=>{
    const mode = b.dataset.head;
    $('#siteHead').className = `site-head head--${mode}`;
    saveTheme({header:mode});
  });
});

/* ===== Library click (visual confirmation for now) ===== */
$$('.grid.tiles .tile').forEach(tile=>{
  tile.addEventListener('click', ()=>{
    const t = tile.dataset.title || tile.textContent.trim();
    alert(`Set hero to: ${t}`);
  });
});

/* ===== Plans: choose + details ===== */
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
