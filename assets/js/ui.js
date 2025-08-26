/* ui.js — header/nav interactions & helpers */

(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Year in footer
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile drawer
  const menuBtn = $('#menuToggle');
  const mobile = $('#mobileNav');
  if (menuBtn && mobile) {
    menuBtn.addEventListener('click', () => {
      const open = menuBtn.getAttribute('aria-expanded') === 'true';
      menuBtn.setAttribute('aria-expanded', String(!open));
      mobile.hidden = open;
    });
    // Close on link click
    $$('.mobile__item', mobile).forEach(a =>
      a.addEventListener('click', () => {
        menuBtn.setAttribute('aria-expanded', 'false');
        mobile.hidden = true;
      })
    );
  }

  // Smooth scroll & active tab highlight
  const sections = [
    { id: 'library', key: 'library' },
    { id: 'pricing', key: 'pricing' },
    { id: 'how-it-works', key: 'how' }
  ];
  const anchors = [
    ...$$('.tab[data-nav]'),
    ...$$('.mobile__item[data-nav]')
  ];

  // click → smooth scroll
  anchors.forEach(a => {
    a.addEventListener('click', (e) => {
      const key = a.getAttribute('data-nav');
      const s = document.getElementById(
        key === 'how' ? 'how-it-works' : key
      );
      if (s) {
        e.preventDefault();
        s.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState({}, '', `#${s.id}`);
      }
    });
  });

  // highlight while scrolling
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const sec = sections.find(s => s.id === entry.target.id);
        if (!sec) return;
        anchors.forEach(a => {
          if (a.getAttribute('data-nav') === (sec.key)) {
            if (entry.isIntersecting) {
              a.classList.add('is-active');
              a.setAttribute('aria-current', 'page');
            } else {
              a.classList.remove('is-active');
              a.removeAttribute('aria-current');
            }
          }
        });
      });
    },
    { rootMargin: '-40% 0px -55% 0px', threshold: 0.01 }
  );
  sections.forEach(s => {
    const el = document.getElementById(s.id);
    if (el) observer.observe(el);
  });
})();
