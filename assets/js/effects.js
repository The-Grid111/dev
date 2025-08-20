<script>
// ===== LIGHT EFFECTS & MICRO-INTERACTIONS (safe, no hard deps) =====
(() => {
  document.addEventListener('DOMContentLoaded', () => {
    // Soft hover lift on all .card-like sections
    document.querySelectorAll('.card, .panel, .section-card').forEach(el => {
      el.addEventListener('pointerenter', () => el.classList.add('lift'));
      el.addEventListener('pointerleave', () => el.classList.remove('lift'));
    });

    // Hero subtle vignette glow if hero becomes ready
    const hero = document.querySelector('[data-hero]');
    if (hero) {
      const obs = new MutationObserver(() => {
        if (hero.classList.contains('hero-ready')) hero.classList.add('hero-glow');
      });
      obs.observe(hero, { attributes: true, attributeFilter: ['class'] });
    }
  });
})();
</script>
