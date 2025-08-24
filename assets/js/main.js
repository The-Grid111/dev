(() => {
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
  const store = {
    get() { try { return JSON.parse(localStorage.getItem("grid:settings")||"{}"); } catch { return {}; } },
    set(v){ localStorage.setItem("grid:settings", JSON.stringify(v)); },
    merge(patch){ const v = {...store.get(), ...patch}; store.set(v); return v; }
  };

  // --- apply settings to DOM/CSS vars
  function applySettings(s){
    if (!s) s = store.get();
    const r = document.documentElement;
    if (s.css){
      for (const [k,v] of Object.entries(s.css)) r.style.setProperty(k, v);
    }
    if (s.headerMode){
      const hdr = $('[data-header]');
      hdr.dataset.mode = s.headerMode;
      hdr.style.background = s.headerMode==="solid" ? "#0b0f12" : "";
      hdr.style.boxShadow = s.headerMode==="float" ? "0 14px 28px rgba(0,0,0,.35)" : "";
    }
    if (s.fontFamily){
      document.body.style.fontFamily = s.fontFamily==="inter"
        ? 'Inter, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial'
        : s.fontFamily==="mono"
        ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
        : 'Inter, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial';
      $$('.name,h1,h2,h3').forEach(el=>{
        el.style.fontFamily = s.fontFamily==="space"
          ? '"Space Grotesk", Inter, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial'
          : document.body.style.fontFamily;
      });
    }
    if (s.gridDensity){ $('.top-grid').style.setProperty('--density', s.gridDensity+'px'); }
    if (s.userName){ $('[data-welcome]').textContent = `Welcome, ${s.userName}. Launch experiences that never regress.`; }
  }

  // --- controls wiring
  function initControls(){
    const panel = $('[data-controls]');
    $('[data-open-controls]')?.addEventListener('click', ()=> panel.classList.remove('hidden'));
    $('[data-close-controls]')?.addEventListener('click', ()=> panel.classList.add('hidden'));

    // inputs mapping
    $$('[data-var]').forEach(input=>{
      input.addEventListener('input', e=>{
        const key = input.dataset.var, val = input.value + (key.includes('px')?'px':'');
        const css = {...(store.get().css||{}), [key]: input.type==="range" ? String(input.value) + (key.includes('px')?'px':'') : input.value };
        document.documentElement.style.setProperty(key, input.type==="range" ? css[key] : input.value);
        store.merge({css});
      });
    });

    $$('[data-setting]').forEach(input=>{
      input.addEventListener('input', ()=>{
        const s = store.merge({ [input.dataset.setting]: input.type==="range" ? Number(input.value) : input.value });
        applySettings(s);
      });
    });

    $('[data-save]')?.addEventListener('click', ()=>{
      alert("Saved! Settings persist on this device. Export coming next.");
    });
    $('[data-reset]')?.addEventListener('click', ()=>{
      localStorage.removeItem('grid:settings'); location.reload();
    });
  }

  // --- pricing modal + choose fallback
  const PLAN_DETAILS = {
    BASIC: [
      "Starter hero & sections",
      "Access to Library + manifest system",
      "Email support within 48h",
      "Cancel/upgrade anytime"
    ],
    SILVER: [
      "Everything in Basic",
      "Advanced effects & presets",
      "Priority email (24h)",
      "Quarterly tune-ups"
    ],
    GOLD: [
      "Monthly collab session",
      "Admin toolkit & automations",
      "1:1 onboarding (45 min)",
      "Priority hotfix"
    ],
    DIAMOND: [
      "Custom pipelines (Notion/Airtable/Zapier)",
      "Hands-on stack build",
      "Priority roadmap & fast turnaround",
      "Quarterly strategy review"
    ]
  };

  function openDetails(plan){
    const m = $('[data-modal]'); m.classList.remove('hidden');
    $('[data-modal-title]').textContent = plan;
    const body = $('[data-modal-body]');
    body.innerHTML = `<ul>${PLAN_DETAILS[plan].map(li=>`<li>${li}</li>`).join('')}</ul>`;
    $('[data-modal-choose]').onclick = ()=> choosePlan(plan);
  }
  function choosePlan(plan){
    const subject = encodeURIComponent(`[GRID] Subscribe: ${plan}`);
    const body = encodeURIComponent(`Plan: ${plan}\nName:\nEmail:\nNotes:\n\n(We’ll send a Stripe link.)`);
    window.location.href = `mailto:gridcoresystems@gmail.com?subject=${subject}&body=${body}`;
  }
  $$('[data-details]').forEach(btn => btn.addEventListener('click', ()=> openDetails(btn.dataset.plan)));
  $$('[data-choose]').forEach(btn => btn.addEventListener('click', ()=> choosePlan(btn.dataset.plan)));
  $$('[data-close-modal]').forEach(b=> b.addEventListener('click', ()=> $('[data-modal]').classList.add('hidden')));

  // --- contact (no backend yet)
  $('[data-contact]')?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const subject = encodeURIComponent(`[GRID] Contact from ${fd.get('name')||'Visitor'}`);
    const body = encodeURIComponent(`${fd.get('message')||''}\n\nFrom: ${fd.get('name')||''} <${fd.get('email')||''}>`);
    window.location.href = `mailto:gridcoresystems@gmail.com?subject=${subject}&body=${body}`;
  });

  // --- init
  applySettings();
  initControls();
})();
