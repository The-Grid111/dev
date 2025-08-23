<!-- FILE: assets/js/commerce.js -->
<script>
/**
 * Drop your real checkout links here (Stripe Payment Links, etc.).
 * You can change these anytime without touching HTML.
 */
const PAY = {
  BASIC:   'https://example.com/checkout/basic',    // ← replace
  SILVER:  'https://example.com/checkout/silver',   // ← replace
  GOLD:    'https://example.com/checkout/gold',     // ← replace
  DIAMOND: 'https://example.com/checkout/diamond',  // ← replace
  SETUP:   'https://example.com/checkout/setup',    // ← replace
  REELS:   'https://example.com/checkout/reels',    // ← replace
  TEMPLATES:'https://example.com/checkout/templates'// ← replace
};

/**
 * Called by main.js when a user chooses a plan/service.
 * If a link exists, we redirect. Otherwise we open email with the subject filled.
 */
window.buyPlan = function(planCode){
  const code = (planCode || '').toUpperCase();
  const url  = PAY[code];
  if (url && /^https?:\/\//i.test(url)) {
    window.location.assign(url);
    return;
  }
  // graceful fallback: prefill an email
  const mailto = `mailto:gridcoresystems@gmail.com?subject=${encodeURIComponent('Join ' + code)}`;
  window.location.href = mailto;
};
</script>
