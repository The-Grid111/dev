/* Robust trial banner: reads Stripe URL from config and wires all triggers */
(async () => {
  const cfgUrl = '/assets/config/stripe.json';
  let trialUrl = null;

  try {
    const res = await fetch(cfgUrl, { cache: 'no-store' });
    if (res.ok) {
      const cfg = await res.json();
      trialUrl = cfg.trialCheckoutUrl || null;
    }
  } catch (e) { /* no-op */ }

  const banner = document.getElementById('trial-banner');
  const btns = document.querySelectorAll('[data-action="start-trial"]');

  const openTrial = () => {
    if (!trialUrl) return alert('Trial temporarily unavailable. Please try again shortly.');
    window.location.href = trialUrl;
  };

  btns.forEach(b => b.addEventListener('click', openTrial));
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (t.matches('[data-dismiss="trial-banner"]')) banner?.remove();
  });

  // Show the banner only if we have a URL
  if (trialUrl && banner) banner.hidden = false;
})();
