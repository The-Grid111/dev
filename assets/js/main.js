/* THE GRID – main.js (safe minimal v13.2)
   - Guaranteed not to error if elements are missing
   - Fixes Customize panel open/close
   - Adds tiny UI polish (nav link active state, smooth scroll)
*/

(function () {
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];

  function onReady(fn){ 
    if (document.readyState === 'loading') { 
      document.addEventListener('DOMContentLoaded', fn, { once:true });
    } else { fn(); }
  }

  onReady(() => {
    // ---- Customize panel (robust selectors) ----
    const panel = $('#customize');
    const openBtn  = $('#open-customize') || $$('a,button').find(el => /customize/i.test(el.textContent.trim()));
    const closeBtn = $('#close-customize') || (panel ? panel.querySelector('button, .btn') : null);

    if (panel) panel.hidden = true; // start hidden; avoid flicker

    if (openBtn && panel) {
      openBtn.addEventListener('click', (e) => {
        e.preventDefault();
        panel.hidden = false;
        // focus first input if present
        const firstInput = panel.querySelector('input,select,button,textarea');
        if (firstInput) firstInput.focus({ preventScroll:true });
      });
    }

    if (closeBtn && panel) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        panel.hidden = true;
      });
    }

    // ---- Smooth scroll for in-page links (About, Showcase, etc.) ----
    $$('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        const target = id && $(id);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // set active state
          try {
            $$('.nav a').forEach(x => x.classList.remove('active'));
            a.classList.add('active');
          } catch(_) {}
        }
      });
    });

    // ---- Safe video autostyle (if present) ----
    const hero = $('.hero-video');
    if (hero) {
      hero.setAttribute('playsinline', '');
      hero.setAttribute('muted', '');
      hero.setAttribute('autoplay', '');
      hero.addEventListener('error', () => {
        // If demo.mp4 missing, keep the frame but avoid console spam
        console.warn('hero video not available (demo.mp4).');
      }, { once:true });
    }

    console.log('THE GRID main.js v13.2 loaded');
  });
})();
