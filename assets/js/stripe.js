// Lightweight Stripe loader. If you add a publishable key, this will enable real checkout.
// Otherwise it returns false and the app will set plans locally.

const PUBLISHABLE_KEY = (window.STRIPE_PUBLISHABLE_KEY || '').trim(); // set in a <script> or env injector

export async function ensureStripe(){
  if(!PUBLISHABLE_KEY) return false;

  if(!window.Stripe){
    await new Promise((res, rej)=>{
      const s = document.createElement('script');
      s.src = 'https://js.stripe.com/v3/';
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  window.__stripe = window.Stripe(PUBLISHABLE_KEY);
  return !!window.__stripe;
}
