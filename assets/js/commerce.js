import { ui } from './ui.js';

export const plans = {
  TRIAL:   { id:'TRIAL',   price:500,  currency:'gbp', interval:'one_time', name:'Trial',   cta:'Start Trial',   stripePriceId:'' },
  BASIC:   { id:'BASIC',   price:900,  currency:'gbp', interval:'month',    name:'Basic',   cta:'Get Basic',     stripePriceId:'' },
  SILVER:  { id:'SILVER',  price:1900, currency:'gbp', interval:'month',    name:'Silver',  cta:'Choose Silver', stripePriceId:'' },
  GOLD:    { id:'GOLD',    price:4900, currency:'gbp', interval:'month',    name:'Gold',    cta:'Choose Gold',   stripePriceId:'' },
  DIAMOND: { id:'DIAMOND', price:9900, currency:'gbp', interval:'month',    name:'Diamond', cta:'Choose Diamond',stripePriceId:'' },
};

export function setPlanLocal(id){
  if(!plans[id]) throw new Error('Unknown plan');
  localStorage.setItem('grid.plan', id);
}
export function getPlanLocal(){ return localStorage.getItem('grid.plan'); }

// When Stripe keys are present, call startCheckout; otherwise caller will fall back to local set.
export async function startCheckout(planId){
  const plan = plans[planId];
  if(!plan || !plan.stripePriceId) throw new Error('Stripe price not configured.');

  // Expect window.Stripe initialized by stripe.js
  const stripe = window.__stripe;
  if(!stripe) throw new Error('Stripe not available');

  const { error } = await stripe.redirectToCheckout({
    lineItems: [{ price: plan.stripePriceId, quantity: 1 }],
    mode: plan.interval === 'one_time' ? 'payment' : 'subscription',
    successUrl: location.origin + location.pathname + '?success=1',
    cancelUrl: location.href
  });

  if(error){
    ui.warn(error.message || 'Checkout error');
    throw error;
  }
}
