<script>
/* THE GRID — Self-Improve Engine (on-device)
   - Logs behavior (clicks, dwell time, scroll depth)
   - Scores variants (anti-regression)
   - Captures Trial metadata with screenshots/notes (manual attach)
   - Builds/upgrades prompt language from usage
*/
(() => {
  const getSave = () => (window.__GC_SAVE__?.get?.() || null);
  const setSave = (s) => window.__GC_SAVE__?.set?.(s);

  // --- Telemetry: clicks
  document.addEventListener('click', (e)=>{
    const S = getSave(); if (!S || !S.flags.learning) return;
    S.telemetry.clicks = (S.telemetry.clicks||0)+1;
    setSave(S);
  }, {capture:true});

  // --- Telemetry: dwell per section
  const dwell = {};
  const obs = new IntersectionObserver((entries)=>{
    const now = Date.now();
    entries.forEach(ent=>{
      const id = ent.target.id || ent.target.dataset.track || 'unknown';
      dwell[id] = dwell[id] || { t:0, last:null, vis:false };
      if (ent.isIntersecting){ dwell[id].last = now; dwell[id].vis = true; }
      else if (dwell[id].vis){ dwell[id].t += (now - (dwell[id].last||now)); dwell[id].vis = false; }
    });
  }, {threshold:0.35});
  window.addEventListener('load', ()=>{
    document.querySelectorAll('section[id], [data-track]').forEach(el=>obs.observe(el));
    setInterval(()=>{
      const S = getSave(); if (!S || !S.flags.learning) return;
      S.telemetry.dwell = dwell;
      setSave(S);
    }, 5000);
  });

  // --- Telemetry: scroll depth
  window.addEventListener('scroll', ()=>{
    const S = getSave(); if (!S || !S.flags.learning) return;
    const h = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const depth = Math.round((window.scrollY / h) * 100);
    S.telemetry.scroll = { depth: Math.max(S.telemetry.scroll?.depth||0, depth) };
    setSave(S);
  }, {passive:true});

  // --- Trial capture UI (lightweight, local only)
  function wireTrialForm(){
    const form = document.getElementById('trial-form');
    if (!form) return;
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      // normalize
      const trial = {
        app: data.app || 'Runway',
        model: data.model || 'Gen-4',
        seed: data.seed ? +data.seed : undefined,
        duration: data.duration ? +data.duration : undefined,
        prompt: data.prompt || '',
        format_forcer: data.format_forcer || '',
        notes: data.notes || ''
      };
      window.__GC_ADD_TRIAL__?.(trial);
      form.reset();
      alert('Trial saved locally ✅  (Export any time from Save Manager)');
      renderTrialList();
    });
  }

  function renderTrialList(){
    const list = document.getElementById('trial-list'); if (!list) return;
    const S = getSave(); const trials = S?.trials || [];
    list.innerHTML = trials.slice(0,20).map(t=>(
      `<li>
        <strong>${t.app}</strong> • ${t.model || ''}${t.seed?` • seed ${t.seed}`:''}${t.duration?` • ${t.duration}s`:''}
        <div class="small">${(t.prompt||'').slice(0,160)}</div>
        ${t.format_forcer?`<div class="small muted">Forcer: ${t.format_forcer}</div>`:''}
        ${t.notes?`<div class="small">${t.notes}</div>`:''}
        <div class="small muted">${new Date(t.ts).toLocaleString()}</div>
      </li>`
    )).join('');
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    wireTrialForm();
    renderTrialList();
  });

})();
</script>
