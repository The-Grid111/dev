(() => {
  const cfgPath = 'assets/config/stripe.json';
  let stripe, cfg;

  async function init() {
    try {
      cfg = await (await fetch(cfgPath, {cache:'no-store'})).json();
      if (cfg.publishableKey) stripe = Stripe(cfg.publishableKey);
    } catch { /* noop */ }
  }

  async function checkout(priceId){
    if (!priceId) { alert('Add Stripe price IDs to assets/data/plans.json'); return; }
    if (!stripe) { alert('Stripe key missing. Add publishableKey to assets/config/stripe.json'); return; }
    const origin = location.origin;
    const res = await stripe.redirectToCheckout({
      mode: 'subscription',
      lineItems: [{price: priceId, quantity: 1}],
      successUrl: origin + (cfg.successPath || '/'),
      cancelUrl: origin + (cfg.cancelPath || '/')
    });
    if (res.error) alert(res.error.message);
  }

  window.StripeCtl = { init, checkout };
  init();
})();
