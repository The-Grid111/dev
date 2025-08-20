<script>
// ===== PRICING & CTA WIRING (safe to run with empty plans) =====
(() => {
  const qs = (s, r=document) => r.querySelector(s);
  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    // Wire all buttons that should land on Contact (acts as “help”/“join”)
    document.querySelectorAll('[data-cta="choose"], [data-see-pricing], [data-join-now]')
      .forEach(btn => btn.addEventListener('click', (e) => {
        if (btn.matches('[data-cta="choose"]')) e.preventDefault();
        scrollTo('contact');
      }));

    // Attempt to hydrate pricing from assets/data/plans.json (but don’t rely on it)
    await maybeHydratePlans();
  }

  function scrollTo(id) {
    const el = document.getElementById(id) || qs(`[data-section="${id}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function maybeHydratePlans() {
    const plansWrap = document.getElementById('plans');
    if (!plansWrap) return;

    try {
      const res = await fetch('assets/data/plans.json', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (!data || !Array.isArray(data.plans) || !data.plans.length) return;

      // If there is a container to inject plans into (e.g., #planCards)
      const host = document.getElementById('planCards');
      if (!host) return;

      host.innerHTML = data.plans.map(p => {
        const perks = (p.features || []).map(f => `<li>${escapeHtml(f)}</li>`).join('');
        return `
          <article class="plan-card">
            <header>
              <h3>${escapeHtml(p.tier)}</h3>
              <div class="price">${escapeHtml(p.price || '')}</div>
            </header>
            <ul class="features">${perks}</ul>
            <button class="btn btn-gold" data-cta="choose" aria-label="Choose ${escapeHtml(p.tier)}">Choose</button>
          </article>
        `;
      }).join('');

      // Re-wire the injected Choose buttons
      host.querySelectorAll('[data-cta="choose"]').forEach(b => {
        b.addEventListener('click', (e) => { e.preventDefault(); scrollTo('contact'); });
      });
    } catch (err) {
      // Silent—UI still shows static markup
      console.info('plans.json not applied (optional).');
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }
})();
</script>
