/* THE-GRID commerce: plan selection, trial, local persistence. */
(function(){
  const KEY = 'thegrid:user';

  function getUser(){
    try { return JSON.parse(localStorage.getItem(KEY)||'{}'); } catch(_) { return {}; }
  }
  function setUser(u){ localStorage.setItem(KEY, JSON.stringify(u||{})); }

  function selectPlan(plan){
    const allowed = ['trial','silver','gold','diamond'];
    if(!allowed.includes(plan)) return;
    const u = getUser();
    u.plan = plan;
    u.plan_set_at = new Date().toISOString();
    setUser(u);

    // Attempt Stripe if available
    if(window.gridStripe?.checkout){
      window.gridStripe.checkout(plan, u).catch(()=>{ /* non-blocking */ });
    } else {
      alert(`Selected: ${plan.toUpperCase()}. Stored locally until payment is live.`);
    }

    // Update profile chip if open
    const chip = document.querySelector('#profPlan');
    if(chip) chip.textContent = u.plan || 'None';
  }

  function startTrial(){
    selectPlan('trial');
  }

  window.gridCommerce = { selectPlan, startTrial };
})();
