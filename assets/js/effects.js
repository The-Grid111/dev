/* THE GRID — micro effects (dev/assets/js/effects.js)
   Only safe visual touches; no network.
*/

(function () {
  // subtle ring glow on all .btn--glow
  const pulse = () => {
    document.querySelectorAll('.btn--glow').forEach((b) => {
      b.style.boxShadow = '0 0 0 0 rgba(244,200,74,0.35)';
      setTimeout(() => (b.style.boxShadow = '0 0 40px 4px rgba(244,200,74,0.25)'), 60);
    });
  };
  window.addEventListener('load', () => {
    pulse();
    setInterval(pulse, 2600);
  });

  // parallax vignette on scroll
  const body = document.body;
  window.addEventListener('scroll', () => {
    const y = window.scrollY || 0;
    body.style.backgroundPosition = `center ${-y * 0.08}px`;
  }, {passive:true});
})();
