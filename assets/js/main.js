/* THE GRID — main.js
   - News bar (persist dismissal)
   - Customize drawer + CSS variables
   - Library boot (placeholder)
*/

(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ---- News bar
  const news = $('#newsbar');
  if (news) {
    const key = news.dataset.lsKey || 'grid_news';
    const closed = localStorage.getItem(key) === '1';
    if (closed) news.style.display = 'none';
    $('.newsbar__close', news)?.addEventListener('click', () => {
      news.style.display = 'none';
      localStorage.setItem(key, '1');
    });
  }

  // ---- Customize drawer
  const drawer = $('#customize');
  $('#open-customize')?.addEventListener('click', () => {
    drawer?.setAttribute('aria-hidden', 'false');
  });
  $('#close-customize')?.addEventListener('click', () => {
    drawer?.setAttribute('aria-hidden', 'true');
  });

  // controls → CSS variables
  const setVar = (k, v) => document.documentElement.style.setProperty(k, v);

  const ctl = {
    accent: $('#ctl-accent'),
    font: $('#ctl-font'),
    mode: $('#ctl-mode'),
    radius: $('#ctl-radius'),
    container: $('#ctl-container'),
    header: $('#ctl-header'),
    glow: $('#ctl-glow'),
    border: $('#ctl-border'),
    shadow: $('#ctl-shadow'),
    gridOpacity: $('#ctl-grid-opacity'),
    gridDensity: $('#ctl-grid-density'),
    welcome: $('#ctl-welcome'),
    save: $('#ctl-save'),
    reset: $('#ctl-reset'),
  };

  function applyFromState(state) {
    if (!state) return;
    if (state.accent) setVar('--accent', state.accent);
    if (state.font) document.body.style.fontFamily = state.font;
    if (state.mode) {
      document.body.classList.remove('theme-light', 'theme-dark');
      document.body.classList.add(state.mode);
    }
    if (state.radius) setVar('--radius', state.radius + 'px');
    if (state.container) setVar('--container', state.container + 'px');
    if (state.glow) setVar('--glow', `0 0 28px rgba(229,193,88,${state.glow})`);
    if (state.border) setVar('--border-w', state.border + 'px');
    if (state.shadow) setVar('--shadow', `0 10px 24px rgba(0,0,0,${state.shadow})`);
    if (state.gridOpacity != null) setVar('--grid-opacity', state.gridOpacity);
    if (state.gridDensity) setVar('--grid-density', state.gridDensity);
    if (state.header) {
      const header = $('.site-header');
      header.classList.remove('glass','solid');
      header.classList.add(state.header);
    }
    if (state.welcome) {
      const title = $('.hero__title');
      if (title) title.innerHTML = `<span class="muted">${state.welcome}.</span> Launch experiences that <span class="nowrap">never regress.</span>`;
    }
    // reflect controls
    Object.entries(ctl).forEach(([k, el]) => {
      if (!el || k === 'save' || k === 'reset') return;
      const key = k === 'gridOpacity' ? 'gridOpacity'
                : k === 'gridDensity' ? 'gridDensity'
                : k;
      if (state[key] != null) el.value = state[key];
    });
  }

  function buildState() {
    return {
      accent: ctl.accent?.value,
      font: ctl.font?.value,
      mode: ctl.mode?.value,
      radius: +ctl.radius?.value,
      container: +ctl.container?.value,
      header: ctl.header?.value,
      glow: +ctl.glow?.value,
      border: +ctl.border?.value,
      shadow: +ctl.shadow?.value,
      gridOpacity: +ctl.gridOpacity?.value,
      gridDensity: +ctl.gridDensity?.value,
      welcome: ctl.welcome?.value?.trim(),
    };
  }

  // Live bindings
  ctl.accent?.addEventListener('input', () => setVar('--accent', ctl.accent.value));
  ctl.font?.addEventListener('change', () => document.body.style.fontFamily = ctl.font.value);
  ctl.mode?.addEventListener('change', () => {
    document.body.classList.toggle('theme-dark', ctl.mode.value === 'theme-dark');
    document.body.classList.toggle('theme-light', ctl.mode.value === 'theme-light');
  });
  ctl.radius?.addEventListener('input', () => setVar('--radius', ctl.radius.value + 'px'));
  ctl.container?.addEventListener('input', () => setVar('--container', ctl.container.value + 'px'));
  ctl.header?.addEventListener('change', () => {
    const header = $('.site-header');
    header.classList.remove('glass','solid');
    header.classList.add(ctl.header.value);
  });
  ctl.glow?.addEventListener('input', () => setVar('--glow', `0 0 28px rgba(229,193,88,${ctl.glow.value})`));
  ctl.border?.addEventListener('input', () => setVar('--border-w', ctl.border.value + 'px'));
  ctl.shadow?.addEventListener('input', () => setVar('--shadow', `0 10px 24px rgba(0,0,0,${ctl.shadow.value})`));
  ctl.gridOpacity?.addEventListener('input', () => setVar('--grid-opacity', ctl.gridOpacity.value));
  ctl.gridDensity?.addEventListener('input', () => setVar('--grid-density', ctl.gridDensity.value));
  ctl.welcome?.addEventListener('input', () => {
    const v = ctl.welcome.value.trim();
    const title = $('.hero__title');
    if (title) title.innerHTML = `<span class="muted">${v || 'Welcome'}.</span> Launch experiences that <span class="nowrap">never regress.</span>`;
  });

  // Save / Reset (local)
  const LS_KEY = 'grid_customize_v2';
  ctl.save?.addEventListener('click', () => {
    localStorage.setItem(LS_KEY, JSON.stringify(buildState()));
    alert('Saved.');
  });
  ctl.reset?.addEventListener('click', () => {
    localStorage.removeItem(LS_KEY);
    location.reload();
  });

  // Boot from saved state
  try { applyFromState(JSON.parse(localStorage.getItem(LS_KEY))); } catch {}

  // Library placeholder (upgrade later to read assets/videos/manifest.json)
  const lib = $('#library-grid');
  if (lib && lib.children.length === 0) {
    const card = document.createElement('div');
    card.className = 'card card--hollow';
    card.innerHTML = `<div class="media-placeholder">No videos yet</div>`;
    lib.appendChild(card);
  }

  // Pricing: details (simple modal via alert; your modal.css/js can replace)
  $$('.plan-details').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const plan = btn.dataset.plan?.toUpperCase();
      const copy = {
        BASIC: ['Starter hero & sections','Access to Library + manifest system','Email support within 48h','Cancel/upgrade anytime'],
        SILVER:['Everything in Basic','Advanced effects & presets','Priority email (24h)','Quarterly tune-ups'],
        GOLD:['Monthly collab session','Admin toolkit & automations','1:1 onboarding (45 min)','Priority hotfix'],
        DIAMOND:['Custom pipelines (Notion/Airtable/Zapier)','Hands-on stack build','Priority roadmap & fast turnaround','Quarterly strategy review']
      }[plan] || [];
      alert(`${plan}\n\n• ${copy.join('\n• ')}`);
    });
  });
})();
