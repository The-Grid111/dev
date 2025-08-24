/* COMMERCE: Stripe Payment Links (client-only, GH Pages friendly)
   HOW TO USE:
   1) In Stripe, create a Payment Link for each plan (recurring monthly).
   2) Paste the Payment Link URLs below in PAYMENT_LINKS.
   3) That's it — the "Choose" buttons will go straight to Stripe Checkout.
*/

window.Commerce = (function () {
  // ↓ Replace these with your real Stripe Payment Link URLs
  const PAYMENT_LINKS = {
    basic:   "https://buy.stripe.com/REPLACE_BASIC",
    silver:  "https://buy.stripe.com/REPLACE_SILVER",
    gold:    "https://buy.stripe.com/REPLACE_GOLD",
    diamond: "https://buy.stripe.com/REPLACE_DIAMOND"
  };

  // Human-readable details used by the Details buttons
  const DETAILS = {
    basic: `BASIC
• Starter hero & sections
• Access to Library + manifest system
• Email support within 48h
• Cancel/upgrade anytime`,

    silver: `SILVER
• Everything in Basic
• Advanced effects & presets
• Priority email (24h)
• Quarterly tune-ups`,

    gold: `GOLD
• Monthly collab session
• Admin toolkit & automations
• 1:1 onboarding (45 min)
• Priority hotfix`,

    diamond: `DIAMOND
• Custom pipelines (Notion/Airtable/Zapier)
• Hands-on stack build
• Priority roadmap & fast turnaround
• Quarterly strategy review`
  };

  function open(plan) {
    const url = PAYMENT_LINKS[plan];
    if (!url || url.includes("REPLACE_")) {
      alert("Stripe Checkout not wired yet.\n\nAdd your Stripe Payment Link URL in assets/js/commerce.js to enable one-click checkout.");
      return;
    }
    window.location.href = url;
  }

  function describe(plan) {
    return DETAILS[plan] || "Plan details not found.";
  }

  return { open, describe };
})();
