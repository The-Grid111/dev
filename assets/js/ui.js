/* ui.js — header/nav behavior, smooth anchors, mobile menu */

(function () {
  const header = document.getElementById('site-header');
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('nav-toggle');

  // Sticky shadow
  const onScroll = () => {
    if (window.scrollY > 8) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll);
  onScroll();

  // Mobile menu toggle
  const closeNav = () => { nav.classList.remove('open'); toggle?.setAttribute('aria-expanded', 'false'); };
  const openNav  = () => { nav.classList.add('open');    toggle?.setAttribute('aria-expanded', 'true');  };
  toggle?.addEventListener('click', () => (nav.classList.contains('open') ? closeNav() : openNav()));
  window.addEventListener('resize', () => { if (window.innerWidth >= 900) closeNav(); });

  // Smooth anchor scrolling, adjust for header height
  const smoothTo = (hash) => {
    const el = document.querySelector(hash);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - header.offsetHeight - 8;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  // Intercept any in-page anchors
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const { hash } = a;
      if (!hash) return;
      e.preventDefault();
      smoothTo(hash);
      closeNav();
      history.pushState(null, '', hash);
    });
  });

  // Explicit header buttons
  document.getElementById('btn-open-library')?.addEventListener('click', (e) => { e.preventDefault(); smoothTo('#library'); });
  document.getElementById('btn-see-pricing')?.addEventListener('click', (e) => { e.preventDefault(); smoothTo('#pricing'); });
})();
