/* THE GRID — Quantifiable Metrics (static-safe)
   - Captures: nav/cta/tile clicks, dwell per section, scroll depth, perf marks
   - Stores in localStorage; Owner/Admin can download JSON for commit
*/

(function(){
  const SID = (localStorage.getItem('grid_sid')) || (()=>{ const s='sid_'+Math.random().toString(36).slice(2); localStorage.setItem('grid_sid', s); return s; })();
  const START = performance.now();
  const METRICS_KEY = 'grid_metrics_log';

  function readLog(){
    try{ return JSON.parse(localStorage.getItem(METRICS_KEY)||'[]'); }catch{ return []; }
  }
  function writeLog(arr){
    try{ localStorage.setItem(METRICS_KEY, JSON.stringify(arr).slice(0, 2_000_000)); }catch(e){ /* capped */ }
  }
  function push(event, payload={}){
    const log = readLog();
    log.push({sid:SID, t:Date.now(), event, ...payload});
    writeLog(log);
  }

  // Public API
  window.GRID_METRICS = {
    track: push,
    download(){
      const blob = new Blob([JSON.stringify(readLog(), null, 2)], {type:'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href=url; a.download='grid_metrics.json'; a.click();
      setTimeout(()=>URL.revokeObjectURL(url), 800);
    },
    clear(){ localStorage.removeItem(METRICS_KEY); }
  };

  // Section dwell via IntersectionObserver
  const obs = new IntersectionObserver((ents)=>{
    ents.forEach(ent=>{
      if(ent.isIntersecting) push('section_view', {id: ent.target.id || ent.target.className});
    });
  }, {threshold:0.33});
  document.querySelectorAll('section').forEach(s=>obs.observe(s));

  // Scroll depth
  let maxY = 0;
  window.addEventListener('scroll', ()=>{
    maxY = Math.max(maxY, Math.round((window.scrollY + window.innerHeight) / document.body.scrollHeight * 100));
  }, {passive:true});
  window.addEventListener('beforeunload', ()=>{
    push('session_end', {dur_ms: Math.round(performance.now()-START), max_scroll_pct:maxY});
  });

  // Owner/Admin toolbar for metrics (session only)
  const params = new URLSearchParams(location.search);
  if(params.get('owner')==='1' || params.get('admin')==='1'){
    const head = document.querySelector('.head-cta');
    if(head){
      const dl = document.createElement('a'); dl.href='#'; dl.className='btn ghost'; dl.textContent='Download Metrics';
      dl.addEventListener('click', e=>{ e.preventDefault(); window.GRID_METRICS.download(); });
      const clr = document.createElement('a'); clr.href='#'; clr.className='btn ghost'; clr.textContent='Clear Metrics';
      clr.addEventListener('click', e=>{ e.preventDefault(); window.GRID_METRICS.clear(); alert('Cleared session metrics'); });
      head.appendChild(dl); head.appendChild(clr);
    }
  }

  // Perf marker
  window.addEventListener('load', ()=> push('load', {t_ms: Math.round(performance.now()-START)}));
})();
