/* THE GRID — commerce.js
   Stripe hand-off. Safe to include before keys exist.
   HOW TO WIRE:
   1) Set your publishable key below (STRIPE_PUB_KEY).
   2) Put your real Price IDs in data-price-id on each .plan.
*/

(function(){
  const STRIPE_PUB_KEY = ''; // TODO: paste your pk_live_... or pk_test_...
  const stripe = (typeof Stripe === 'function' && STRIPE_PUB_KEY) ? Stripe(STRIPE_PUB_KEY) : null;

  const chooseButtons = document.querySelectorAll('.choose-plan');

  chooseButtons.forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      const card = btn.closest('.plan');
      const priceId = card?.dataset?.priceId;

      // Fallback: if Stripe not configured, open email compose
      if (!stripe || !priceId) {
        const plan = card?.dataset?.plan || 'basic';
        const subject = encodeURIComponent(`Join THE GRID — ${plan.toUpperCase()} plan`);
        const body = encodeURIComponent('Hi, I’d like to join this plan. Please send me the checkout link.');
        window.location.href = `mailto:gridcoresystems@gmail.com?subject=${subject}&body=${body}`;
        return;
      }

      try{
        // One-time redirect to Checkout (no backend yet). For subscriptions,
        // you’ll typically create a Checkout Session server-side.
        const { error } = await stripe.redirectToCheckout({
          lineItems: [{ price: priceId, quantity: 1 }],
          mode: 'subscription',
          successUrl: window.location.origin + '/dev/#pricing?success=true',
          cancelUrl: window.location.origin + '/dev/#pricing?canceled=true'
        });
        if (error) alert(error.message || 'Stripe error. Please try again.');
      }catch(err){
        alert('Checkout failed. Please try email instead.');
      }
    });
  });
})();
