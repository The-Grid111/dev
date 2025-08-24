/* Utility */
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

function openLayer(el){
  document.body.classList.add('no-scroll');
  overlay.classList.remove('hidden'); el.classList.remove('hidden');
  requestAnimationFrame(()=>{ overlay.classList.add('show'); el.classList.add('show'); });
}
function closeLayers(){
  document.body.classList.remove('no-scroll');
  overlay.classList.remove('show'); $$('.modal,.sheet').forEach(x=>x.classList.remove('show'));
  setTimeout(()=>{ overlay.classList.add('hidden'); $$('.modal,.sheet').forEach(x=>x.classList.add('hidden')); },200);
}

/* Wire header buttons */
$$('[data-action="customize"]').forEach(b=>{
  b.addEventListener('click', e=>{e.preventDefault(); openLayer(sheet);}, {passive:false});
});
$$('[data-action="join"]').forEach(b=>{
  b.addEventListener('click', e=>{e.preventDefault(); openLayer(join);}, {passive:false});
});
overlay.addEventListener('click', closeLayers);
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeLayers(); });
$$('[data-close]').forEach(b=>b.addEventListener('click', closeLayers));

/* Live design controls -> CSS variables */
const root = document.documentElement;
function setVar(name, val){ root.style.setProperty(name, val); }
function bindRange(id, varName, suffix=''){
  const el = $(id); if(!el) return;
  el.addEventListener('input', e=> setVar(varName, `${e.target.value}${suffix}`));
}
function bindColor(id, varName){
  const el = $(id); if(!el) return;
  el.addEventListener('input', e=> setVar(varName, e.target.value));
}
function bindSelect(id, apply){
  const el = $(id); if(!el) return;
  el.addEventListener('change', e=> apply(e.target.value));
}
function bindCheck(id, apply){
  const el = $(id); if(!el) return;
  el.addEventListener('change', e=> apply(e.target.checked));
}

/* Controls */
bindColor('#ctrl-accent', '--accent');
bindRange('#ctrl-radius', '--card-radius', 'px');
bindRange('#ctrl-glow', '--glow');
bindRange('#ctrl-font', '--font-scale');
bindRange('#ctrl-container', '--container', 'px');
bindSelect('#ctrl-header', v => $('.site-head')?.setAttribute('data-mode', v));
bindRange('#ctrl-hero-h', '--hero-height', 'vh');
bindRange('#ctrl-border', '--border');
bindRange('#ctrl-shadow', '--shadow');
bindCheck('#ctrl-pattern', on => setVar('--pattern', on ? 1 : 0));

/* Library demo */
$$('.grid.tiles .tile').forEach(tile=>{
  tile.addEventListener('click', ()=>{
    const t = tile.dataset.title || tile.textContent.trim();
    alert(`Set hero to: ${t}`);
    window.GRID_METRICS?.track('tile_click', {title:t, surface:'library'});
  });
});

/* Plan Choose + Details */
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
  const subject = $('#subject'); if(subject) subject.value = `Join ${code}`;
  alert(`Selected: ${code}`);
  window.GRID_METRICS?.track('choose_plan', {code});
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
      window.GRID_METRICS?.track('view_details', {code});
    }catch(err){ console.error('Invalid details payload', err); }
  }, {passive:false});
});

/* Nav & CTA metrics */
$$('[data-nav]').forEach(a=>a.addEventListener('click', ()=>window.GRID_METRICS?.track('nav_click',{to:a.getAttribute('href')})));
$$('[data-cta]').forEach(b=>b.addEventListener('click', ()=>window.GRID_METRICS?.track('cta_click',{label:b.textContent.trim()})));
