/* Shortcuts */
const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];

/* Elements */
const overlay = $('#ui-overlay');
const sheet   = $('#design-panel');
const details = $('#details-modal');
const heroVid = $('#heroVideo');
const playBtn = $('#playHero');

/* Open / close layers */
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
overlay.addEventListener('click', closeLayers);
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeLayers(); });
$$('[data-close]').forEach(b=>b.addEventListener('click', closeLayers));
$$('[data-action="customize"]').forEach(b=>b.addEventListener('click', e=>{e.preventDefault(); openLayer(sheet);}));
$$('[data-details]').forEach(btn=>{
  btn.addEventListener('click', e=>{
    e.preventDefault();
    try{
      const payload = JSON.parse(btn.getAttribute('data-details'));
      $('#details-title').textContent = payload.title || 'Details';
      const ul = $('#details-list'); ul.innerHTML = '';
      (payload.points||[]).forEach(p => { const li = document.createElement('li'); li.textContent = p; ul.appendChild(li); });
      openLayer(details);
    }catch(err){ console.error('Invalid details', err); }
  });
});

/* Hero video controls */
if (playBtn && heroVid){
  playBtn.addEventListener('click', ()=>{
    if (heroVid.paused){ heroVid.play(); playBtn.textContent = '⏸'; }
    else { heroVid.pause(); playBtn.textContent = '▶'; }
  });
}

/* Library tiles -> swap hero video/poster */
$$('.grid.tiles .tile').forEach(tile=>{
  tile.addEventListener('click', ()=>{
    const v = tile.dataset.video, p = tile.dataset.poster;
    if (v){ heroVid.src = v; heroVid.load(); heroVid.play().catch(()=>{}); playBtn.textContent = '⏸'; }
    if (p){ heroVid.setAttribute('poster', p); }
    const t = tile.dataset.title || tile.textContent.trim();
    console.log('Hero set to:', t);
  });
});

/* ===== Customizer (no-code) ===== */
const root = document.documentElement;
const head = document.querySelector('.site-head');

/* Inputs */
const ctrlAccent  = $('#ctrl-accent');
const ctrlGlow    = $('#ctrl-glow');
const ctrlRadius  = $('#ctrl-radius');
const ctrlPattern = $('#ctrl-pattern');

/* Presets */
const PRESETS = {
  gold:     { accent:'#f3c545', bg:'#0b0f14', panel:'#0e1116', card:'#11161f' },
  midnight: { accent:'#76a7ff', bg:'#070a0f', panel:'#0b0f14', card:'#0f141b' },
  emerald:  { accent:'#38f2b0', bg:'#07100e', panel:'#0b1311', card:'#0e1916' },
  silver:   { accent:'#d6dee9', bg:'#0c0f14', panel:'#10141b', card:'#131923' }
};
$('#themeChips')?.addEventListener('click', e=>{
  const chip = e.target.closest('.chip'); if(!chip) return;
  const p = PRESETS[chip.dataset.preset]; if(!p) return;
  root.style.setProperty('--accent', p.accent);
  root.style.setProperty('--bg', p.bg);
  root.style.setProperty('--panel', p.panel);
  root.style.setProperty('--card', p.card);
  persistTheme();
});

/* Header style */
$('#headerChips')?.addEventListener('click', e=>{
  const chip = e.target.closest('.chip'); if(!chip) return;
  head?.setAttribute('data-style', chip.dataset.header);
  persistTheme();
});

/* Live sliders */
ctrlAccent?.addEventListener('input', e=>{ root.style.setProperty('--accent', e.target.value); persistThemeDebounced(); });
ctrlGlow?.addEventListener('input',   e=>{ root.style.setProperty('--glow', e.target.value);   persistThemeDebounced(); });
ctrlRadius?.addEventListener('input', e=>{ root.style.setProperty('--card-radius', `${e.target.value}px`); persistThemeDebounced(); });
ctrlPattern?.addEventListener('input',e=>{ root.style.setProperty('--pattern', e.target.value); persistThemeDebounced(); });

/* Pattern strength affects body bg via CSS var (already wired) */

/* Persist to localStorage so your choices stick while testing */
const KEY='thegrid_theme_v1';
function persistTheme(){
  const s = getComputedStyle(root);
  const data = {
    vars:{
      accent:s.getPropertyValue('--accent').trim(),
      bg:    s.getPropertyValue('--bg').trim(),
      panel: s.getPropertyValue('--panel').trim(),
      card:  s.getPropertyValue('--card').trim(),
      glow:  s.getPropertyValue('--glow').trim(),
      radius:s.getPropertyValue('--card-radius').trim(),
      pattern:s.getPropertyValue('--pattern').trim()
    },
    header: head?.getAttribute('data-style') || 'glass'
  };
  localStorage.setItem(KEY, JSON.stringify(data));
}
let persistThemeDebounced = (()=>{ let t; return ()=>{ clearTimeout(t); t=setTimeout(persistTheme,150);} })();
function loadTheme(){
  try{
    const data = JSON.parse(localStorage.getItem(KEY)||'{}');
    if(data.vars){
      Object.entries(data.vars).forEach(([k,v])=>{
        const cssName = k==='radius' ? '--card-radius' : `--${k}`;
        root.style.setProperty(cssName, v);
      });
    }
    if(data.header) head?.setAttribute('data-style', data.header);
    if(ctrlAccent)  ctrlAccent.value = getComputedStyle(root).getPropertyValue('--accent').trim() || '#f3c545';
    if(ctrlGlow)    ctrlGlow.value   = parseFloat(getComputedStyle(root).getPropertyValue('--glow')) || 0.35;
    if(ctrlRadius)  ctrlRadius.value = parseInt(getComputedStyle(root).getPropertyValue('--card-radius')) || 18;
    if(ctrlPattern) ctrlPattern.value= parseFloat(getComputedStyle(root).getPropertyValue('--pattern')) || 0.25;
  }catch(e){}
}
loadTheme();
$('#resetTheme')?.addEventListener('click', ()=>{
  localStorage.removeItem(KEY); location.reload();
});
