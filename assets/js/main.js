(() => {
  // Build Pricing from plans.json and wire up Stripe buttons
  async function buildPricing(){
    const res = await fetch('assets/data/plans.json', {cache:'no-store'});
    const data = await res.json();
    const grid = document.getElementById('pricingGrid'); grid.innerHTML = '';
    const cur = data.currency || 'GBP';

    data.tiers.filter(t=>t.active).forEach(t=>{
      const card = document.createElement('article');
      card.className = 'card depth-1 radius-xl';
      const price = `${cur === 'GBP' ? '£' : '$'}${t.price}${t.interval==='mo'?' / mo':''}`;
      card.innerHTML = `
        <h3>${t.name}</h3>
        <p class="muted">${t.features[0] || ''}</p>
        <div class="price"><strong>${price}</strong></div>
        <div class="row gap-8">
          <button class="btn pill ${t.id==='diamond'?'solid':'ghost'} buy" data-price="${t.stripe_price_id}" data-plan="${t.id}">
            ${t.cta}
          </button>
        </div>
        <ul class="muted" style="margin:.8em 0 0;padding-left:1.1em;list-style:disc;">
          ${t.features.slice(1).map(f=>`<li>${f}</li>`).join('')}
        </ul>
      `;
      grid.appendChild(card);
    });

    grid.querySelectorAll('.buy').forEach(btn=>{
      btn.addEventListener('click', () => {
        const plan = btn.dataset.plan;
        const priceId = btn.dataset.price || '';
        if (!priceId){
          // no Stripe yet → simulate upgrade locally
          Store.set('profile.plan', plan);
          alert(`Plan set locally to ${plan.toUpperCase()}.\nAdd Stripe IDs for real checkout.`);
          document.getElementById('footPlan').textContent = plan.toUpperCase();
          return;
        }
        StripeCtl.checkout(priceId);
      });
    });
  }

  // Trial button → trial tier or message
  document.getElementById('trialBtn')?.addEventListener('click', async ()=>{
    const plans = await (await fetch('assets/data/plans.json', {cache:'no-store'})).json();
    const trial = plans.tiers.find(p=>p.id==='trial' && p.active);
    if (!trial){ alert('Trial not configured yet.'); return; }
    if (!trial.stripe_price_id){
      Store.set('profile.plan','trial');
      alert('Trial set locally for 7 days.\n(Connect Stripe for real billing.)');
      document.getElementById('footPlan').textContent = 'TRIAL';
      return;
    }
    StripeCtl.checkout(trial.stripe_price_id);
  });

  // Library previews (placeholder)
  document.querySelectorAll('.preview').forEach(btn=>{
    btn.addEventListener('click', ()=> {
      const kind = btn.dataset.preview;
      alert(`This would open the ${kind} preview.\n(Attach routing when ready).`);
    });
  });

  buildPricing();
})();
