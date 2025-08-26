(() => {
  const ENT = {
    trial:  { watermark:true,  community:"read",  export:"basic" },
    basic:  { watermark:true,  community:"write", export:"basic" },
    silver: { watermark:false, community:"write", export:"images" },
    gold:   { watermark:false, community:"write", export:"advanced" },
    diamond:{ watermark:false, community:"write", export:"full", whitelist:true }
  };
  function planId(){ return Store.get('profile.plan','visitor'); }
  function get(){ return ENT[planId()] || {}; }
  window.Entitlements = { get, planId };
})();
