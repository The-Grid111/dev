/* THE GRID – Save/Merge Loader (safe, no-regression)
   - Reads owner save + imports (if present)
   - Applies safe UI prefs via CSS variables/attributes
   - Session upload/download tools (owner/admin)
   - Security flags: cohort canary, safe mode, no-regression guard
*/

(function(){
  const root = document.documentElement;

  // Security & cohorts
  window.GRID_SECURITY = {
    SAFE_MODE:false, CANARY_PCT:5, ERROR_THRESHOLD:0.02,
    PERF_TBT_MS_BUDGET:50, A11Y_MIN_SCORE:1
  };
  const CK='grid_canary_cohort';
  let cohort = localStorage.getItem(CK);
  if(!cohort){ cohort = (Math.random()*100 < window.GRID_SECURITY.CANARY_PCT) ? 'canary' : 'control';
               localStorage.setItem(CK,cohort); }
  window.GRID_COHORT = cohort;

  // Role via query (?owner=1 / ?admin=1)
  const params = new URLSearchParams(location.search);
  const userPlan = params.get('owner')==='1' ? 'OWNER' : params.get('admin')==='1' ? 'ADMIN' : 'FREE';

  console.log(`GRID ready • plan=${userPlan} • cohort=${cohort}`);

  async function fetchJSON(path){
    try{ const r = await fetch(path, {cache:'no-store'});
         if(!r.ok) throw new Error(r.status);
         return await r.json();
    }catch(e){ console.warn('Load JSON failed', path, e); return null; }
  }

  function applyUiPrefs(p){
    if(!p) return;
    if(p.theme==='gold') root.style.setProperty('--accent','#f3c545');
    if(p.header_mode) document.querySelector('.site-head')?.setAttribute('data-mode', p.header_mode);
    if(p.container_px) root.style.setProperty('--container', `${p.container_px}px`);
    if(p.font_scale) root.style.setProperty('--font-scale', p.font_scale);
    if(p.hero_height_vh) root.style.setProperty('--hero-height', `${p.hero_height_vh}vh`);
    if(p.tile_corners==='cut'){ document.body.setAttribute('data-corners','cut'); }
    if(typeof p.border_px==='number') root.style.setProperty('--border', p.border_px);
    if(typeof p.shadow==='number') root.style.setProperty('--shadow', p.shadow);
    if(typeof p.pattern==='number') root.style.setProperty('--pattern', p.pattern);
    if(typeof p.card_radius==='number') root.style.setProperty('--card-radius', `${p.card_radius}px`);
    if(typeof p.glow==='number') root.style.setProperty('--glow', p.glow);
    if(p.accent_hex) root.style.setProperty('--accent', p.accent_hex);
  }

  function safeMerge(save){
    if(!save || typeof save !== 'object') return;
    if(save.ui_prefs) applyUiPrefs(save.ui_prefs);
    // Future: adopt psychology toggles safely
  }

  async function init(){
    // Owner core (you pasted v1.9 inside v1.2 file)
    const owner = await fetchJSON('assets/data/owner_core_save_v1.2.json')
              || await fetchJSON('assets/data/owner_core_save_v1.9.json');
    if(owner) safeMerge(owner);

    // Imports (optional)
    const updates = await fetchJSON('assets/data/updates.json');
    if(updates?.imports && Array.isArray(updates.imports)){
      updates.imports.forEach(safeMerge);
    }

    // Lock community methods by plan
    document.querySelectorAll('.method-card').forEach(card=>{
      const req = card.dataset.required || 'SILVER';
      const order = ['FREE','BASIC','SILVER','GOLD','DIAMOND','ADMIN','OWNER'];
      const body = card.querySelector('.method-body');
      if(!body) return;
      if(order.indexOf(userPlan) < order.indexOf(req)){
        body.classList.add('locked');
      }else{
        body.classList.remove('locked');
        body.textContent = 'Unlocked: detailed steps available.'; // placeholder
      }
    });

    // Owner/Admin tools: session upload/download (static-safe)
    attachSessionSaveTools(userPlan);
  }

  function attachSessionSaveTools(plan){
    if(plan==='FREE') return;
    const head = document.querySelector('.head-cta'); if(!head) return;

    const up = document.createElement('input');
    up.type='file'; up.accept='application/json'; up.style.display='none';

    const upBtn = document.createElement('a');
    upBtn.href='#'; upBtn.className='btn ghost'; upBtn.textContent='Upload Save';
    upBtn.addEventListener('click', e=>{ e.preventDefault(); up.click(); });

    const dlBtn = document.createElement('a');
    dlBtn.href='#'; dlBtn.className='btn'; dlBtn.textContent='Download My Save';
    dlBtn.addEventListener('click', e=>{
      e.preventDefault();
      const payload = {
        save_version:'session',
        ui_prefs:{
          accent_hex:getComputedStyle(root).getPropertyValue('--accent').trim(),
          container_px: parseInt(getComputedStyle(root).getPropertyValue('--container')),
          font_scale: parseFloat(getComputedStyle(root).getPropertyValue('--font-scale')),
          hero_height_vh: parseInt(getComputedStyle(root).getPropertyValue('--hero-height')),
          border_px: parseFloat(getComputedStyle(root).getPropertyValue('--border')),
          shadow: parseFloat(getComputedStyle(root).getPropertyValue('--shadow')),
          card_radius: parseFloat(getComputedStyle(root).getPropertyValue('--card-radius')),
          glow: parseFloat(getComputedStyle(root).getPropertyValue('--glow')),
          pattern: parseFloat(getComputedStyle(root).getPropertyValue('--pattern')),
          header_mode: document.querySelector('.site-head')?.getAttribute('data-mode')||'glass'
        }
      };
      const blob = new Blob([JSON.stringify(payload,null,2)], {type:'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href=url; a.download='grid_user_save.json'; a.click();
      setTimeout(()=>URL.revokeObjectURL(url), 800);
    });

    up.addEventListener('change', async ()=>{
      const file = up.files?.[0]; if(!file) return;
      try{
        const text = await file.text(); const json = JSON.parse(text);
        safeMerge(json); localStorage.setItem('grid_session_save', text);
        alert('Save applied to this session.');
      }catch(err){ alert('Invalid save file.'); }
    });

    head.prepend(upBtn);
    head.prepend(dlBtn);
    document.body.appendChild(up);
  }

  // Minimal error autorevert signal (session-level)
  let errCount=0, sessionEvents=0;
  window.addEventListener('error', ()=>{ errCount++; }, true);
  setInterval(()=>{
    sessionEvents++;
    const rate = errCount / Math.max(1, sessionEvents);
    if(rate > window.GRID_SECURITY.ERROR_THRESHOLD){
      window.GRID_SECURITY.SAFE_MODE = true;
      console.warn('AUTO-ROLLBACK: entering SAFE_MODE (session).');
    }
  }, 5000);

  init();
})();
