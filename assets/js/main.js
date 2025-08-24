/* MAIN: theming, customize panel, UI behaviors */

(function () {
  const root = document.documentElement;
  const body = document.body;

  /* ---------- State helpers ---------- */
  const store = {
    get(k, def) { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
    del(k) { try { localStorage.removeItem(k); } catch {} }
  };

  const cfg = store.get('grid:ui', {
    theme: 'dark',
    accent: '#F2C94C',
    font: "'Space Grotesk', Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    radius: 18,
    border: 1,
    shadow: 0.35,
    gridOpacity: 0.22,
    gridSize: 28
  });

  /* ---------- Apply config ---------- */
  function applyConfig() {
    body.classList.toggle('theme-light', cfg.theme === 'light');
    root.style.setProperty('--accent', cfg.accent);
    root.style.setProperty('--radius', `${cfg.radius}px`);
    root.style.setProperty('--border', `rgba(255,255,255,${cfg.theme === 'light' ? 0.14 : 0.16})`);
    root.style.setProperty('--shadow', cfg.shadow);
    root.style.setProperty('--grid-opacity', cfg.gridOpacity);
    root.style.setProperty('--grid-size', `${cfg.gridSize}px`);
    root.style.setProperty('--font', cfg.font);
  }
  applyConfig();

  /* ---------- News ribbon ---------- */
  const ribbon = document.getElementById('newsRibbon');
  const dismissed = store.get('grid:newsDismissed', false);
  if (!dismissed && ribbon) {
    ribbon.classList.add('show');
    document.getElementById('newsDismiss').addEventListener('click', () => {
      ribbon.classList.remove('show');
      store.set('grid:newsDismissed', true);
    });
  }

  /* ---------- Header controls ---------- */
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      cfg.theme = (cfg.theme === 'light' ? 'dark' : 'light');
      applyConfig(); store.set('grid:ui', cfg);
      // sync panel checkbox if open
      const togg = document.getElementById('toggleLight');
      if (togg) togg.checked = (cfg.theme === 'light');
    });
  }

  /* ---------- Customize panel ---------- */
  const panel = document.getElementById('customizePanel');
  const openBtn = document.getElementById('customizeOpen');
  const closeBtn = document.getElementById('customizeClose');

  function openPanel(){ panel?.classList.add('open'); }
  function closePanel(){ panel?.classList.remove('open'); }

  openBtn?.addEventListener('click', openPanel);
  closeBtn?.addEventListener('click', closePanel);

  // Init panel controls with current cfg
  function initPanel() {
    const q = (id) => document.getElementById(id);
    q('toggleLight').checked = (cfg.theme === 'light');
    q('accentPicker').value = cfg.accent;
    q('fontFamily').value = cfg.font;
    q('radius').value = cfg.radius;
    q('border').value = cfg.border; // reserved if you add per-side borders later
    q('shadow').value = cfg.shadow;
    q('gridOpacity').value = cfg.gridOpacity;
    q('gridDensity').value = cfg.gridSize;

    q('toggleLight').addEventListener('change', (e) => {
      cfg.theme = e.target.checked ? 'light' : 'dark';
      applyConfig();
    });
    q('accentPicker').addEventListener('input', (e) => {
      cfg.accent = e.target.value; applyConfig();
    });
    q('fontFamily').addEventListener('change', (e) => {
      cfg.font = e.target.value; applyConfig();
    });
    q('radius').addEventListener('input', (e) => {
      cfg.radius = +e.target.value; applyConfig();
    });
    q('shadow').addEventListener('input', (e) => {
      cfg.shadow = +e.target.value; applyConfig();
    });
    q('gridOpacity').addEventListener('input', (e) => {
      cfg.gridOpacity = +e.target.value; applyConfig();
    });
    q('gridDensity').addEventListener('input', (e) => {
      cfg.gridSize = +e.target.value; applyConfig();
    });

    document.getElementById('customizeReset').addEventListener('click', () => {
      store.del('grid:ui');
      location.reload();
    });

    document.getElementById('customizeSave').addEventListener('click', () => {
      store.set('grid:ui', cfg);
      closePanel();
    });
  }
  initPanel();

  /* ---------- Plans: Choose & Details ---------- */
  function bindPlans() {
    document.querySelectorAll('.choose-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const plan = e.currentTarget.getAttribute('data-plan');
        window.Commerce.open(plan);
      });
    });

    document.querySelectorAll('.details-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const plan = e.currentTarget.getAttribute('data-plan');
        const copy = window.Commerce.describe(plan);
        alert(copy);
      });
    });
  }
  bindPlans();

  /* ---------- Accessibility niceties ---------- */
  // Close customize panel with Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePanel();
  });
})();
