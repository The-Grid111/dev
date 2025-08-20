/* THE GRID — effects.js (FULL REDO)
   Small tasteful effects: header glow on scroll, soft card lift, focus rings fix.
*/

(() => {
  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => [...r.querySelectorAll(s)];

  const header = qs("[data-appbar]") || qs(".appbar");
  const cards  = qsa(".card, .plan-card, .panel");

  const onScroll = () => {
    const y = window.scrollY || 0;
    if (!header) return;
    if (y > 8) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("DOMContentLoaded", onScroll);

  // subtle hover lift for cards (touch-safe)
  cards.forEach(c => {
    c.addEventListener("pointerenter", () => c.classList.add("hovered"));
    c.addEventListener("pointerleave", () => c.classList.remove("hovered"));
  });

  // fix :focus-visible in some iOS cases
  document.addEventListener("keydown", (e) => {
    if (e.key === "Tab") document.body.classList.add("kbd-nav");
  });
})();
