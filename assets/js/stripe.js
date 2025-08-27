/* THE-GRID stripe bridge: reads assets/config/stripe.json; safe no-op if missing */
(function(){
  async function loadConfig(){
    try{
      const res = await fetch('/assets/config/stripe.json', {cache:'no-store'});
      if(!res.ok) throw new Error('no stripe config');
      return await res.json();
    }catch(e){ return null; }
  }

  async function checkout(plan, user){
    const cfg = await loadConfig();
    if(!cfg || !cfg.prices || !cfg.prices[plan]){
      console.warn('Stripe config missing for plan:', plan);
      return Promise.reject(new Error('Stripe config missing'));
    }
    // Placeholder: normally create Checkout Session server-side.
    // For now we simulate redirect with price id to prove wiring.
    const priceId = cfg.prices[plan];
    console.log('Stripe price selected:', plan, priceId, user?.name || 'anon');

    // If you later add a server endpoint, replace below:
    // location.href = `/api/stripe/checkout?price=${encodeURIComponent(priceId)}&name=${encodeURIComponent(user?.name||'')}`;

    alert(`Stripe redirect placeholder.\nPlan: ${plan}\nPrice: ${priceId}\n(Name: ${user?.name||'Creator'})`);
    return true;
  }

  window.gridStripe = { checkout };
})();
