// Loads links config and exposes helpers.
// Supports { mode:"links", trial:"", basic:"", silver:"", gold:"", diamond:"" }

export async function loadStripeConfig() {
  try {
    const res = await fetch('assets/config/stripe.json', {cache:'no-store'});
    const json = await res.json();
    // Stash globally so Details dialog can read URLs without reloading
    window.__stripeLinks = (json.mode === 'links') ? {
      trial: json.trial || '',
      basic: json.basic || '',
      silver: json.silver || '',
      gold: json.gold || '',
      diamond: json.diamond || ''
    } : {};
    return window.__stripeLinks;
  } catch (e) {
    console.warn('Stripe config not found or invalid', e);
    window.__stripeLinks = {};
    return {};
  }
}

export function openCheckoutFor(plan, cfg) {
  const links = cfg || window.__stripeLinks || {};
  const url = links[plan];
  if (!url) {
    alert('Checkout link not configured yet.');
    return;
  }
  // Open in a new tab so users can come back easily
  window.open(url, '_blank', 'noopener');
}
