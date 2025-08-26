/* main.js — hooks for Library previews & basic telemetry */

(function () {
  const log = (...a) => console.log('[GRID]', ...a);

  // Demo preview buttons (no external deps)
  document.querySelectorAll('[data-action="preview"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      log('Preview clicked:', id);
      btn.textContent = 'Loading…';
      setTimeout(() => {
        btn.textContent = 'Preview';
        alert(`This would open the ${id} preview.\n(Attach routing when ready).`);
      }, 350);
    });
  });

  // Simple hash routing on initial load
  const hash = (location.hash || '').replace('#', '');
  if (hash) {
    const target = document.getElementById(hash);
    if (target) {
      target.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  }
})();
