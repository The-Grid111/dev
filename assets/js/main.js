/* =========================================
   THE GRID — Main JS (v3, zero-regression)
   - Panels & modals
   - Live design controls (+ persistence)
   - Section loader (videos/images manifests)
   - Per-section dropdown filter (by category)
   - Graceful empty-states (no CSS changes needed)
   ========================================= */

/* ---------- tiny helpers ---------- */
const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const root = document.documentElement;

/* ---------- overlay / panels / modals ---------- */
const overlay       = $('#ui-overlay');
const sheet         = $('#design-panel');
const join          = $('#join-modal');
const details       = $('#details-modal');
const detailsTitle  = $('#details-title');
const detailsList   = $('#details-list');
const detailsChoose = $('#details-choose');

function openLayer(el){
  if(!el) return;
  document.body.classList.add('no-scroll');
  overlay?.classList.remove('hidden'); el.classList.remove('hidden');
  overlay?.classList.add('show'); el.classList.add('show');
}
function closeLayers(){
  document.body.classList.remove('no-scroll');
  overlay?.classList.remove('show');
  $$('.modal,.sheet').forEach(x=>x.classList.remove('show'));
  setTimeout(()=>{
    overlay?.classList.add('hidden');
    $$('.modal,.sheet').forEach(x=>x.classList.add('hidden'));
  },200);
}

/* header buttons */
$$('[data-action="customize"]').forEach(b=>{
  b.addEventListener('click', e=>{ e.preventDefault(); openLayer(sheet); }, {passive:false});
});
$$('[data-action="join"]').forEach(b=>{
  b.addEventListener('click', e=>{ e.preventDefault(); openLayer(join); }, {passive:false});
});
overlay?.addEventListener('click', closeLayers);
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeLayers(); });
$$('[data-close]').forEach(b=>b.addEventListener('click', closeLayers));

/* ---------- persistent UI state ---------- */
const STORE_KEY = 'grid:v3:ui';
const DEFAULTS = {
  accent: '#f3c545',
  radius: 18,
  glow:   0.35,
  font:   1.00,
  wrap:   1100,
  hero:   42,
  border: 1,
  shadow: 40,
  preset: 'Gold'
};
function loadState(){
  try{ return {...DEFAULTS, ...(JSON.parse(localStorage.getItem(STORE_KEY))||{})}; }
  catch{ return {...DEFAULTS}; }
}
function saveState(s){
  try{ localStorage.setItem(STORE_KEY, JSON.stringify(s)); }catch{}
}
let STATE = loadState();

function applyState(s){
  root.style.setProperty('--accent', s.accent);
  root.style.setProperty('--card-radius', `${s.radius}px`);
  root.style.setProperty('--glow', String(s.glow));
  root.style.setProperty('--font-scale', String(s.font));
  root.style.setProperty('--container', `${s.wrap}px`);
  root.style.setProperty('--hero-h', `${s.hero}vh`);
  root.style.setProperty('--border-w', `${s.border}px`);
  root.style.setProperty('--shadow-d', String(s.shadow));
}

/* ---------- controls ---------- */
const ctrl = {
  accent: $('#ctrl-accent'),
  radius: $('#ctrl-radius'),
  glow:   $('#ctrl-glow'),
  font:   $('#ctrl-font'),
  wrap:   $('#ctrl-wrap'),
  hero:   $('#ctrl-hero'),
  border: $('#ctrl-border'),
  shadow: $('#ctrl-shadow'),
  reset:  $('#ctrl-reset'),
  done:   $('#ctrl-done')
};
function syncControls(s){
  if(ctrl.accent) ctrl.accent.value = s.accent;
  if(ctrl.radius) ctrl.radius.value = s.radius;
  if(ctrl.glow)   ctrl.glow.value   = s.glow;
  if(ctrl.font)   ctrl.font.value   = s.font;
  if(ctrl.wrap)   ctrl.wrap.value   = s.wrap;
  if(ctrl.hero)   ctrl.hero.value   = s.hero;
  if(ctrl.border) ctrl.border.value = s.border;
  if(ctrl.shadow) ctrl.shadow.value = s.shadow;
}
function bind(el, key, cast=v=>v){
  el?.addEventListener('input', e=>{
    STATE[key] = cast(e.target.value);
    applyState(STATE); saveState(STATE);
  });
}
bind(ctrl.accent, 'accent', v=>v);
bind(ctrl.radius, 'radius', v=>parseInt(v,10));
bind(ctrl.glow,   'glow',   v=>parseFloat(v));
bind(ctrl.font,   'font',   v=>parseFloat(v));
bind(ctrl.wrap,   'wrap',   v=>parseInt(v,10));
bind(ctrl.hero,   'hero',   v=>parseInt(v,10));
bind(ctrl.border, 'border', v=>parseInt(v,10));
bind(ctrl.shadow, 'shadow', v=>parseInt(v,10));

/* presets (color themes) */
const PRESETS = {
  Gold:     { accent:'#f3c545' },
  Midnight: { accent:'#86a7ff' },
  Emerald:  { accent:'#3ad3a3' },
  Silver:   { accent:'#cfd6df' }
};
$$('[data-preset]').forEach(btn=>{
  btn.addEventListener('click', e=>{
    e.preventDefault();
    const p = PRESETS[btn.dataset.preset]; if(!p) return;
    STATE = {...STATE, ...p, preset: btn.dataset.preset};
    applyState(STATE); saveState(STATE); syncControls(STATE);
    btn.animate([{transform:'scale(1)'},{transform:'scale(.96)'},{transform:'scale(1)'}],{duration:140});
  }, {passive:false});
});
ctrl.reset?.addEventListener('click', ()=>{
  STATE = {...DEFAULTS}; applyState(STATE); saveState(STATE); syncControls(STATE);
});
ctrl.done?.addEventListener('click', closeLayers);

/* ---------- empty-state CSS injector (so no CSS file changes needed) ---------- */
(function injectEmptyCSS(){
  if($('#grid-empty-css')) return;
  const css = `
  .empty-state{display:grid;place-items:center;gap:10px;min-height:140px;padding:18px;text-align:center;border:1px dashed rgba(255,255,255,.15);background:rgba(255,255,255,.02);border-radius:var(--card-radius,16px)}
  .empty-state h4{margin:0;font-size:16px;color:#e8ecf3}
  .empty-state p{margin:0;font-size:14px;color:#aab3c2}
  .empty-state code{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono",monospace;background:rgba(255,255,255,.06);padding:2px 6px;border-radius:6px}
  .filter-row{display:flex;gap:10px;align-items:center;justify-content:flex-end;margin:0 0 10px}
  .filter-row select{background:#0c1118;border:1px solid var(--line);color:var(--text);border-radius:10px;padding:8px 10px}
  `;
  const tag = document.createElement('style');
  tag.id = 'grid-empty-css';
  tag.textContent = css;
  document.head.appendChild(tag);
})();

/* ---------- JSON fetch (safe) ---------- */
async function safeJson(url){
  try{
    const res = await fetch(url, {cache:'no-store'});
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }catch(err){
    console.warn('[manifest]', url, 'missing/invalid:', err.message);
    return null;
  }
}

/* ---------- render helpers ---------- */
function emptyState(into, kind){
  if(!into) return;
  into.innerHTML = '';
  const card = document.createElement('div');
  card.className = 'card empty-state';
  card.innerHTML = `
    <h4>No ${kind} yet</h4>
    <p>Drop files into <code>assets/${kind}/</code> and add entries to <code>assets/${kind}/manifest.json</code>.</p>
  `;
  into.appendChild(card);
}
function renderTiles(into, items){
  into.innerHTML = '';
  items.forEach(item=>{
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.dataset.title = item.title || item.id || 'Untitled';
    tile.textContent   = item.title || item.id || 'Untitled';
    tile.title = (item.tags && item.tags.length) ? `Tags: ${item.tags.join(', ')}` : '';
    tile.addEventListener('click', ()=>{
      const subject = $('#subject');
      if(subject) subject.value = `Use: ${item.title || item.id}`;
      alert(`Selected: ${item.title || item.id}`);
    });
    into.appendChild(tile);
  });
}
function addFilterRow(sectionEl, gridEl, dataset){
  const cats = [...new Set(dataset.map(x=>x.category).filter(Boolean))].sort();
  if(!cats.length) return; // nothing to filter

  const row = document.createElement('div');
  row.className = 'filter-row';
  const sel = document.createElement('select');
  const optAll = document.createElement('option'); optAll.value='*'; optAll.textContent='Show: All';
  sel.appendChild(optAll);
  cats.forEach(c=>{
    const o=document.createElement('option'); o.value='cat:'+c; o.textContent=c[0].toUpperCase()+c.slice(1);
    sel.appendChild(o);
  });
  sel.addEventListener('change', ()=>{
    if(sel.value==='*') return renderTiles(gridEl, dataset);
    const c = sel.value.slice(4);
    renderTiles(gridEl, dataset.filter(i=>i.category===c));
  });
  row.appendChild(sel);
  // place row right before the grid
  sectionEl.querySelector('.grid.tiles')?.insertAdjacentElement('beforebegin', row);
}

/* ---------- section loader ---------- */
async function initSections(){
  const sections = $$('[data-section]');
  if(!sections.length) return;

  // pull manifests once
  const vids = await safeJson('assets/videos/manifest.json') || {videos:[]};
  const imgs = await safeJson('assets/images/manifest.json') || {images:[]};

  sections.forEach(sec=>{
    const code = sec.getAttribute('data-section');      // e.g., 'featured'
    const kind = (sec.getAttribute('data-kind')||'videos').toLowerCase();
    const grid = $('.grid.tiles', sec) || sec;

    const pool = kind === 'images' ? (imgs.images||[]) : (vids.videos||[]);
    const items = pool.filter(x => (x.section||'') === code);

    if(!items.length){ emptyState(grid, kind); return; }

    addFilterRow(sec, grid, items);
    renderTiles(grid, items);
  });
}

/* ---------- plan modals (same UX as before) ---------- */
function showDetails(payload, planCode){
  if(!details) return;
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
    try{
      const payload = JSON.parse(btn.getAttribute('data-details'));
      const article = btn.closest('.plan');
      const code = article?.dataset?.plan || payload.title;
      showDetails(payload, code);
    }catch(err){ console.error('Invalid details payload', err); }
  }, {passive:false});
});

/* ---------- boot ---------- */
applyState(STATE);
syncControls(STATE);
document.addEventListener('DOMContentLoaded', initSections);
