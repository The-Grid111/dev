/* THE GRID — Commerce v3 (static-safe) */
const GRID_PLANS = {
  BASIC:      { code:'BASIC',      price_gbp: 9,  interval:'mo',
    points:['Starter hero & sections','Access Library','Email support 48h','Cancel/upgrade anytime'] },
  SILVER:     { code:'SILVER',     price_gbp: 29, interval:'mo',
    points:['Everything in Basic','Advanced effects','Priority 24h','Quarterly tune-ups'] },
  GOLD:       { code:'GOLD',       price_gbp: 49, interval:'mo',
    points:['Monthly collab session','Admin toolkit','1:1 onboarding','Priority hotfix'] },
  DIAMOND:    { code:'DIAMOND',    price_gbp: 99, interval:'mo',
    points:['Pipelines & integrations','Hands-on stack','Priority roadmap','Quarterly strategy'] }
};

(function wirePlans(){
  // Details
  document.querySelectorAll('[data-details]').forEach(btn=>{
    btn.addEventListener('click', e=>{
      e.preventDefault();
      const holder = btn.closest('.plan');
      const code = holder?.dataset?.plan || '';
      const info = GRID_PLANS[code];
      const payload = info ? {title: code, points: info.points} :
        ( ()=>{ try{ return JSON.parse(btn.getAttribute('data-details')); }catch{ return {title:'Plan', points:[]} } } )();

      const evt = new CustomEvent('grid:plan:details', { detail:{ payload, code }});
      window.dispatchEvent(evt);
    }, {passive:false});
  });

  // Choose
  document.querySelectorAll('[data-choose]').forEach(btn=>{
    btn.addEventListener('click', e=>{
      e.preventDefault();
      const holder = btn.closest('.plan');
      const code = holder?.dataset?.plan || btn.dataset.choose || 'BASIC';
      const plan = GRID_PLANS[code] || { code, price_gbp:null, interval:'mo' };
      const payload = { plan: plan.code, amount_gbp: plan.price_gbp, interval: plan.interval, currency:'GBP', source:'site-v3', ts:Date.now() };
      console.info('[checkout:init]', payload);
      alert(`Checkout: ${plan.code}`);
    }, {passive:false});
  });

  // Hook for details modal controlled by main.js
  window.addEventListener('grid:plan:details', (e)=>{
    const {payload, code} = e.detail || {};
    const modal = document.getElementById('details-modal');
    const title = document.getElementById('details-title');
    const list  = document.getElementById('details-list');
    const choose= document.getElementById('details-choose');
    if(!modal || !title || !list || !choose) return;

    title.textContent = payload?.title || code || 'Plan';
    list.innerHTML = '';
    (payload?.points||[]).forEach(p=>{
      const li=document.createElement('li'); li.textContent=p; list.appendChild(li);
    });
    choose.onclick = ()=> alert(`Choose: ${code || payload?.title || 'Plan'}`);
    // open via main.js openLayer if present, else fallback
    const openLayer = window.__grid_openLayer || ((el)=>{el?.classList.remove('hidden'); el?.classList.add('show');});
    openLayer(modal);
  });
})();
