<script>
/* THE GRID — Auto Save + Import/Export + Remote Updates merge (local-first, privacy-first) */
(() => {
  const KEY = "gc_owner_core_save_v1.3";
  const UPDATE_PATHS = [
    "/dev/assets/data/updates.json","dev/assets/data/updates.json",
    "/assets/data/updates.json","assets/data/updates.json"
  ];

  // Baseline schema
  const BASE = {
    meta: { version: "1.3", createdAt: Date.now(), updatedAt: Date.now() },
    ui:   { accent:"#d8b15a", radius:18, glow:0.35, theme:"dark" },
    flags:{ learning:true, autosave:true, share_anon:false },
    profile:{ owner:true, admin_invite:false },
    language:{ ref:"/dev/assets/data/language.json", seeds:{}, format_forcers:{}, workflows:{}, prompts:{} },
    trials:[],           // { ts, app, model, seed, duration, refs:[], prompt, notes, mediaHints:[] }
    telemetry:{ clicks:0, dwell:{}, scroll:{}, lastSession: Date.now(), scores:{} }
  };

  // Utilities
  const clamp = (n,min,max)=>Math.max(min,Math.min(max,n));
  const now = ()=>Date.now();
  const load = () => {
    try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch(_) { return null; }
  };
  const save = (data) => {
    data.meta.updatedAt = now();
    localStorage.setItem(KEY, JSON.stringify(data));
  };

  // Merge helpers (shallow for known trees)
  function shallowMerge(dst, src, keys){
    keys.forEach(k=>{ if (src && src[k]!==undefined){ dst[k] = { ...(dst[k]||{}), ...(src[k]||{}) }; }});
  }

  async function fetchUpdates(){
    for (const p of UPDATE_PATHS){
      try{ const r=await fetch(p,{cache:"no-store"}); if(r.ok) return await r.json(); }catch(_){}
    }
    return null;
  }

  async function init(){
    let S = load() || structuredClone(BASE);

    // Remote updates merge (defaults & copy)
    try{
      const U = await fetchUpdates();
      if (U){
        if (U.defaults?.ui)      S.ui = { ...U.defaults.ui, ...S.ui };
        if (U.flags){ S.flags.learning = U.flags.learning_enabled_default ?? S.flags.learning;
                      S.flags.autosave  = U.flags.autosave_enabled_default ?? S.flags.autosave; }
        if (U.defaults?.language_ref){ S.language.ref = U.defaults.language_ref; }
        S.meta.updatesVersion = U.version;
      }
    }catch(_){}

    // Pull language ref if available
    try{
      const res = await fetch(S.language.ref, {cache:"no-store"});
      if (res.ok){
        const L = await res.json();
        S.language.seeds         = { ...L.seeds, ...(S.language.seeds||{}) };
        S.language.format_forcers= { ...L.format_forcers, ...(S.language.format_forcers||{}) };
        S.language.workflows     = { ...L.workflows, ...(S.language.workflows||{}) };
        S.language.prompts       = { ...L.prompts, ...(S.language.prompts||{}) };
      }
    }catch(_){}

    // Apply UI vars to document
    applyUI(S.ui);

    // Persist initial state
    save(S);

    // Wire UI controls if present
    wireControls(S);
    startAutosaveLoop(S);
    window.__GC_SAVE__ = { get:()=>load(), set:(d)=>save(d), export:exportSave, import:importSave };
  }

  function applyUI(ui){
    const r = document.documentElement;
    if (ui.accent) r.style.setProperty('--accent', ui.accent);
    if (ui.radius!==undefined) r.style.setProperty('--card-radius', ui.radius + "px");
    if (ui.glow!==undefined)   r.style.setProperty('--glow', ui.glow);
    document.body.dataset.theme = ui.theme || 'dark';
  }

  function wireControls(S){
    const accent = document.getElementById('ctrl-accent');
    const radius = document.getElementById('ctrl-radius');
    const glow   = document.getElementById('ctrl-glow');
    const theme  = document.getElementById('ctrl-theme');
    const learn  = document.getElementById('ctrl-learn');
    const autos  = document.getElementById('ctrl-autosave');

    accent && accent.addEventListener('input', e=>{ S.ui.accent = e.target.value; applyUI(S.ui); save(S); });
    radius && radius.addEventListener('input', e=>{ S.ui.radius = clamp(+e.target.value,0,28); applyUI(S.ui); save(S); });
    glow   && glow.addEventListener('input', e=>{ S.ui.glow   = clamp(+e.target.value,0,1);   applyUI(S.ui); save(S); });
    theme  && theme.addEventListener('change',e=>{ S.ui.theme = e.target.value; applyUI(S.ui); save(S); });
    learn  && learn.addEventListener('change',e=>{ S.flags.learning = !!e.target.checked; save(S); });
    autos  && autos.addEventListener('change',e=>{ S.flags.autosave = !!e.target.checked; save(S); });

    // Export / Import
    const ex = document.getElementById('save-export');
    const im = document.getElementById('save-import');
    const imf= document.getElementById('save-import-file');

    ex && ex.addEventListener('click', async ()=>{
      const blob = new Blob([JSON.stringify(load(),null,2)], {type:'application/json'});
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement('a'), {href:url, download:'owner_core_save_v1.3.json'});
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    });

    im && im.addEventListener('click', ()=> imf?.click());
    imf && imf.addEventListener('change', async (e)=>{
      const file = e.target.files?.[0]; if(!file) return;
      const text = await file.text();
      try{ const incoming = JSON.parse(text); importSave(incoming); location.reload(); }
      catch(err){ alert("Invalid save file"); console.error(err); }
    });
  }

  function startAutosaveLoop(S){
    if (!S.flags.autosave) return;
    let last = Date.now();
    setInterval(()=>{
      const cur = load(); if (!cur) return;
      // keep fresh timestamp to ensure persist
      cur.meta.touchedAt = Date.now();
      save(cur);
    }, 30000); // 30s
  }

  function exportSave(){ return JSON.stringify(load(), null, 2); }

  function importSave(obj){
    if (!obj || typeof obj !== 'object') return;
    let cur = load() || structuredClone(BASE);
    // Merge known top-levels
    cur.ui       = { ...cur.ui, ...(obj.ui||{}) };
    cur.flags    = { ...cur.flags, ...(obj.flags||{}) };
    cur.profile  = { ...cur.profile, ...(obj.profile||{}) };
    cur.language = { ...cur.language, ...(obj.language||{}) };
    if (Array.isArray(obj.trials)) cur.trials = obj.trials;
    if (obj.telemetry) cur.telemetry = { ...cur.telemetry, ...obj.telemetry };
    save(cur);
  }

  // Public trial add (used by learn.js)
  window.__GC_ADD_TRIAL__ = (trial)=>{
    const cur = load() || structuredClone(BASE);
    cur.trials.unshift({ ts: Date.now(), ...trial });
    save(cur);
  };

  document.addEventListener('DOMContentLoaded', init);
})();
</script>
