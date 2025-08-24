(function () {
  const $ = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

  // Year
  $('#year').textContent = new Date().getFullYear();

  // Announcement
  $('#dismissAnnounce').addEventListener('click', () => {
    $('#announceBar').style.display = 'none';
  });

  // Welcome name from control
  const welcome = localStorage.getItem('grid:welcome') || 'Welcome';
  $('#welcomeName').textContent = welcome;

  // Library (reads manifest if present)
  const libEl = $('#libraryGrid');
  fetch('assets/videos/manifest.json')
    .then(r => r.ok ? r.json() : { items: [] })
    .then(({items=[]}) => {
      if (!items.length) return;
      libEl.innerHTML = '';
      const grid = document.createElement('div');
      grid.className = 'cards two';
      items.forEach(v => {
        const card = document.createElement('article');
        card.className = 'card';
        card.innerHTML = `<h3>${v.title || 'Untitled'}</h3><p class="muted">${v.caption||''}</p>`;
        grid.appendChild(card);
      });
      libEl.appendChild(grid);
    })
    .catch(()=>{});

  // Plans modal
  const modal = $('#planModal');
  const planTitle = $('#planTitle');
  const planList = $('#planList');
  $$('.open-plan').forEach(btn=>{
    btn.addEventListener('click', e=>{
      const plan = e.currentTarget.closest('.plan').dataset.plan;
      planTitle.textContent = plan;
      planList.innerHTML = '';
      const bullets = {
        BASIC: ['Starter hero & sections','Access Library + manifest system','Email support within 48h','Cancel/upgrade anytime'],
        SILVER: ['Everything in Basic','Advanced effects & presets','Priority email (24h)','Quarterly tune-ups'],
        GOLD: ['Monthly collab session','Admin toolkit & automations','1:1 onboarding (45 min)','Priority hotfix'],
        DIAMOND: ['Custom pipelines (Notion/Airtable/Zapier)','Hands-on stack build','Priority roadmap & fast turnaround','Quarterly strategy review']
      }[plan];
      bullets.forEach(b=>{
        const li = document.createElement('li'); li.textContent = b; planList.appendChild(li);
      });
      modal.showModal();
    });
  });
  $('#closePlan').onclick = ()=>modal.close();
  $('#closePlan2').onclick = ()=>modal.close();
  $('#choosePlan').onclick = ()=>{
    // Stripe hook placeholder:
    alert('This would open Stripe Checkout for: ' + planTitle.textContent);
  };

  // Header mode
  const header = $('.site-header');
  function setHeaderMode(mode){
    header.classList.remove('solid','minimal','glass');
    if (mode === 'solid') header.classList.add('solid');
    if (mode === 'minimal') header.classList.add('minimal');
    if (mode === 'glass') header.classList.add('glass');
  }

  // Controls
  const dlg = $('#controls');
  $('#openControls').onclick = ()=>dlg.showModal();

  // Palette swatches
  const palettes = [
    {name:'Gold Dark', bg:'#101214', surface:'#171a1d', text:'#eaeef2', accent:'#f2c94c'},
    {name:'Slate Light', bg:'#f6f7f9', surface:'#fff', text:'#1b1f24', accent:'#0ea5e9'},
    {name:'Emerald', bg:'#0e1412', surface:'#111a17', text:'#e6f5ee', accent:'#34d399'},
    {name:'Royal', bg:'#0f1324', surface:'#131937', text:'#e8edff', accent:'#8b5cf6'}
  ];
  const swatches = $('#paletteSwatches');
  palettes.forEach(p=>{
    const b = document.createElement('button');
    b.title = p.name;
    b.style.background = p.accent;
    b.addEventListener('click', ()=>{
      setVar('--bg', p.bg);
      setVar('--surface', p.surface);
      setVar('--text', p.text);
      setVar('--accent', p.accent);
      persist();
    });
    swatches.appendChild(b);
  });

  // Wire inputs -> CSS vars
  const map = {
    accentPicker: v => setVar('--accent', v),
    fontFamily: v => {
      if (v.includes('Space')) {
        document.documentElement.style.setProperty('--font-display', '"Space Grotesk", var(--font-body)');
        document.documentElement.style.setProperty('--font-body', '"Inter", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif');
      } else if (v.includes('Inter')) {
        document.documentElement.style.setProperty('--font-display', '"Inter", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif');
        document.documentElement.style.setProperty('--font-body', '"Inter", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif');
      } else {
        document.documentElement.style.setProperty('--font-display', 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif');
        document.documentElement.style.setProperty('--font-body', 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif');
      }
    },
    fontScale: v => setVar('--scale', v),
    radius: v => setVar('--radius', `${v}px`),
    containerW: v => setVar('--container', `${v}px`),
    heroH: v => $('.hero').style.minHeight = `${v}vh`,
    headerMode: v => setHeaderMode(v),
    glow: v => setVar('--glow', v),
    shadow: v => setVar('--shadow', v),
    borderW: v => setVar('--border-w', `${v}px`),
    borderStyle: v => {
      const style = v === 'none' ? 'var(--border-none)' :
                    v === 'hard' ? 'var(--border-hard)' :
                    v === 'glow' ? `0 0 0 1px color-mix(in oklab, var(--accent) 50%, transparent) inset, 0 0 24px color-mix(in oklab, var(--accent) 25%, transparent)` :
                    'var(--border-soft)';
      setVar('--border-style', style);
    },
    gridOpacity: v => setVar('--grid-opacity', v),
    gridDensity: v => setVar('--grid-size', `${v}px`),
    bgColor: v => setVar('--bg', v),
    cardColor: v => setVar('--surface', v),
    textColor: v => setVar('--text', v),
    yourName: v => {
      localStorage.setItem('grid:welcome', v || 'Welcome');
      $('#welcomeName').textContent = v || 'Welcome';
    },
    lightMode: v => document.body.toggleAttribute('data-theme','light', v)
  };

  // Helper: set CSS var
  function setVar(name, value){
    document.documentElement.style.setProperty(name, value);
  }

  // Patch toggleAttribute with optional value param
  Element.prototype.toggleAttribute = function(name, value){
    if (value === undefined) value = !this.hasAttribute(name);
    if (value) this.setAttribute(name,''); else this.removeAttribute(name);
  };

  // Init controls with current values
  [
    'accentPicker','fontFamily','fontScale','radius','containerW','heroH','headerMode',
    'glow','shadow','borderW','borderStyle','gridOpacity','gridDensity',
    'bgColor','cardColor','textColor','yourName','lightMode'
  ].forEach(id=>{
    const el = document.getElementById(id);
    if (!el) return;
    const apply = () => {
      const v = (el.type === 'checkbox') ? el.checked : el.value;
      map[id](v);
    };
    el.addEventListener('input', apply);
  });

  // Save / Reset (JSON Save like before)
  const saveBtn = $('#save');
  const resetBtn = $('#reset');
  saveBtn.addEventListener('click', (e)=>{
    e.preventDefault();
    const save = {
      vars: {
        bg: getVar('--bg'), surface: getVar('--surface'), text: getVar('--text'),
        accent: getVar('--accent'), radius: getVar('--radius'), container: getVar('--container'),
        shadow: getVar('--shadow'), glow: getVar('--glow'), borderStyle: getVar('--border-style'),
        gridOpacity: getVar('--grid-opacity'), gridSize: getVar('--grid-size'),
        theme: document.body.getAttribute('data-theme') || 'dark',
      },
      welcome: localStorage.getItem('grid:welcome') || 'Welcome',
      ts: Date.now()
    };
    navigator.clipboard.writeText(JSON.stringify(save, null, 2));
    alert('Save copied to clipboard.');
  });

  resetBtn.addEventListener('click', (e)=>{
    e.preventDefault();
    location.reload();
  });

  function getVar(n){ return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }

  // Expose paste-to-apply (optional)
  window.applySave = function(saveJSON){
    try{
      const s = typeof saveJSON === 'string' ? JSON.parse(saveJSON) : saveJSON;
      Object.entries(s.vars||{}).forEach(([k,v])=>{
        if (k === 'theme') {
          document.body.toggleAttribute('data-theme','light', v === 'light');
        } else {
          setVar(`--${k}`, v);
        }
      });
      if (s.welcome) {
        localStorage.setItem('grid:welcome', s.welcome);
        $('#welcomeName').textContent = s.welcome;
      }
    }catch(e){ console.warn('Invalid Save', e); }
  };

  // Contact alignment safety
  // (No JS needed; CSS centers it. This guard re-measures on resize if someone changes container width drastically.)
  new ResizeObserver(()=>{}).observe(document.body);
})();
