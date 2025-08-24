// COMMERCE: Stripe Payment Links + Plan copy
// Fill in your real Stripe Payment Links and (optionally) Customer Portal link.
// After that, the Choose buttons will go straight to Stripe.

window.Commerce = (function(){
  // 1) Paste your Stripe payment links here
  const PAYMENT_LINKS = {
    BASIC:   "https://buy.stripe.com/REPLACE_BASIC",
    SILVER:  "https://buy.stripe.com/REPLACE_SILVER",
    GOLD:    "https://buy.stripe.com/REPLACE_GOLD",
    DIAMOND: "https://buy.stripe.com/REPLACE_DIAMOND",
  };

  // 2) (Optional) Enable the Stripe Customer Portal and paste its link
  const CUSTOMER_PORTAL_URL = "https://billing.stripe.com/p/login/REPLACE_PORTAL";

  function open(plan){
    const url = PAYMENT_LINKS[plan];
    if (!url || url.includes("REPLACE_")){
      alert(`Payment link for ${plan} isn’t configured yet.`);
      return;
    }
    window.location.href = url;
  }

  function describe(tier){
    const copy = {
      BASIC:{
        title:"BASIC",
        subtitle:"Starter hero & sections. Access to Library + manifest system. Email support within 48h.",
        points:[
          "Starter templates & effects",
          "Theme presets + Save import",
          "Samples in Library",
          "Email support within 48h",
          "Cancel/upgrade anytime"
        ]
      },
      SILVER:{
        title:"SILVER",
        subtitle:"Everything in Basic + advanced effects & presets. Priority email and quarterly tune-ups.",
        points:[
          "Advanced effects & metallic styles",
          "Pro 'Stacks & Setups' guides",
          "Priority email (24h)",
          "Quarterly tune-ups",
          "Cancel/upgrade anytime"
        ]
      },
      GOLD:{
        title:"GOLD",
        subtitle:"Full custom session, admin toolkit & automations. 1:1 onboarding and priority hotfix.",
        points:[
          "All Silver features",
          "Admin toolkit + automation recipes",
          "1:1 onboarding (45 min)",
          "Priority hotfix",
          "Pro Library (full access)"
        ]
      },
      DIAMOND:{
        title:"DIAMOND",
        subtitle:"Top-tier support and access. Custom pipelines, hands-on stack build, and roadmap priority.",
        points:[
          "All Gold features",
          "Custom pipelines (Notion/Airtable/Zapier)",
          "Hands-on stack build",
          "Priority roadmap & fast turnaround",
          "Private Library drops"
        ]
      }
    };
    return copy[tier] || {title:tier, subtitle:"", points:[]};
  }

  function portalUrl(){ return CUSTOMER_PORTAL_URL.includes("REPLACE_") ? "" : CUSTOMER_PORTAL_URL; }

  return { open, describe, portalUrl };
})();
