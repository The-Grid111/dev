/* ==================================
   THE GRID — Commerce (v2, static-safe)
   - Single source of truth for plan data
   - Wires "Choose" + "Details" buttons
   - Checkout stubs (swap for Stripe/PayPal later)
   ================================== */

const GRID_PLANS = {
  CORE: {
    code: "CORE", price_gbp: 9, interval: "mo",
    points: [
      "Starter hero & section blocks",
      "Access to media Library",
      "Email support in 48h",
      "Cancel/upgrade anytime"
    ]
  },
  PRO: {
    code: "PRO", price_gbp: 29, interval: "mo",
    points: [
      "Everything in Core",
      "Advanced visuals & presets",
      "Priority email in 24h",
      "Quarterly tune-ups included"
    ]
  },
  STUDIO: {
    code: "STUDIO", price_gbp: 49, interval: "mo",
    points: [
      "Monthly collaborative session",
      "Admin toolkit + automations",
      "1:1 onboarding (45 min)",
      "Priority hotfix channel"
    ]
  },
  ENTERPRISE: {
    code: "ENTERPRISE", price_gbp: 99, interval: "mo",
    points: [
      "Custom pipelines & integrations",
      "Hands-on stack support",
      "Priority roadmap & turnaround",
      "Quarterly strategy review"
    ]
  },
  // A-la-carte add-ons
  SETUP: {
    code: "SETUP", price_gbp: 39, interval: "one-time",
    points: [
      "Deploy site to GitHub Pages",
      "Connect domains & basic SEO",
      "Add analytics (GA/PL)",
      "Performance & a11y sweep"
    ]
  },
  REELS: {
    code: "REELS", price_gbp: 59, interval: "one-time",
    points: [
      "Three 9–15s reels tailored to your niche",
      "Captions + jump cuts + CTA",
      "IG/TikTok delivery formats",
      "Two revision rounds"
    ]
  },
  TEMPLATES: {
    code: "TEMPLATES", price_gbp: 29, interval: "one-time",
    points: [
      "Five hand-crafted sections",
      "Responsive & accessible",
      "Plug-in text + assets",
      "Lifetime updates to this pack"
    ]
  }
};

(function wirePlans(){
  // Normalize "Details" buttons from data-plan or embedded JSON
  document.querySelectorAll('[data-details]').forEach(btn=>{
    btn.addEventListener('click', e=>{
      e.preventDefault();
      const holder = btn.closest('.plan');
      const code = holder?.dataset?.plan || '';
      const fromTable = GRID_PLANS[code];
      let payload = null;

      // Prefer plan table → fallback to inline JSON
      if(fromTable){
        payload = { title: code, points: fromTable.points };
      }else{
        try{ payload = JSON.parse(btn.getAttribute('data-details')); }
        catch{ payload = { title: 'Plan', points: [] }; }
      }

      // Dispatch to the shared modal (owned by main.js)
      const evt = new CustomEvent('grid:plan:details', { detail:{ payload, code }});
      window.dispatchEvent(evt);
    }, {passive:false});
  });

  // Normalize "Choose" buttons
  document.querySelectorAll('[data-choose]').forEach(btn=>{
    btn.addEventListener('click', e=>{
      e.preventDefault();
      const holder = btn.closest('.plan');
      const code = holder?.dataset?.plan || btn.dataset.choose || 'CORE';
      const plan = GRID_PLANS[code] || { code, price_gbp:null, interval:'mo' };

      // Simulated checkout payload (replace with Stripe/PayPal)
      const checkout = {
        plan: plan.code,
        amount_gbp: plan.price_gbp,
        interval: plan.interval,
        currency: 'GBP',
        source: 'site-v2',
        ts: Date.now()
      };
      console.info('[checkout:init]', checkout);

      // Let main.js handle UI parts
      const evt = new CustomEvent('grid:plan:choose', { detail:{ checkout }});
      window.dispatchEvent(evt);
    }, {passive:false});
  });
})();
