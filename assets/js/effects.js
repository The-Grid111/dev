// assets/js/effects.js
// Visual polish only (no layout logic). Safe to add/remove.
// - Fade-in on load
// - Soft hover lift for cards & buttons
// - Tiny hero parallax
// - Gold accent glow pulse
// - Button ripple
// - Respect prefers-reduced-motion

(function(){
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('DOMContentLoaded', () => {
    // ===== 1) Fade-in page load (skips if reduced motion)
    if (!prefersReduced) {
      document.documentElement.style.opacity = '0';
      document.documentElement.style.transition = 'opacity .7s ease';
      requestAnimationFrame(()=>{ document.documentElement.style.opacity = '1'; });
    }

    // ===== 2) Hover lift on cards & buttons
    const liftTargets = document.querySelectorAll('.card, .plan, .tile, button, .btn');
    liftTargets.forEach(el => {
      el.style.willChange = 'transform, box-shadow';
      el.addEventListener('mouseenter', () => {
        if (prefersReduced) return;
        el.style.transform = 'translateY(-2px)';
        el.style.boxShadow = '0 10px 24px rgba(0,0,0,.25)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'translateY(0)';
        el.style.boxShadow = 'none';
      });
    });

    // ===== 3) Tiny parallax for hero media
    const hero = document.querySelector('.hero, .heroFrame, #hero');
    if (hero && !prefersReduced) {
      let ticking = false;
      window.addEventListener('scroll', () => {
        if (ticking) return;
        window.requestAnimationFrame(() => {
          const y = window.scrollY * 0.25;
          hero.style.transform = `translateY(${y * 0.03}px)`; // very subtle
          ticking = false;
        });
        ticking = true;
      }, { passive: true });
    }

    // ===== 4) Gold accent pulse (subtle)
    const goldish = [
      ...document.querySelectorAll('.btn.primary, .badge, .highlight-gold')
    ];
    if (!prefersReduced) {
      goldish.forEach(el => {
        el.style.transition = 'box-shadow 1.6s ease';
        setInterval(() => {
          el.style.boxShadow = '0 0 14px rgba(231,184,75,.45)';
          setTimeout(() => { el.style.boxShadow = ''; }, 800);
        }, 4200);
      });
    }

    // ===== 5) Button ripple (ink) on click
    const rippleTargets = document.querySelectorAll('button, .btn');
    rippleTargets.forEach(btn => {
      btn.style.overflow = 'hidden';
      btn.addEventListener('click', (e) => {
        if (prefersReduced) return;
        const rect = btn.getBoundingClientRect();
        const r = document.createElement('span');
        const d = Math.max(rect.width, rect.height);
        r.style.position = 'absolute';
        r.style.left = (e.clientX - rect.left - d/2) + 'px';
        r.style.top  = (e.clientY - rect.top  - d/2) + 'px';
        r.style.width = r.style.height = d + 'px';
        r.style.borderRadius = '50%';
        r.style.background = 'rgba(255,255,255,.25)';
        r.style.pointerEvents = 'none';
        r.style.transform = 'scale(0)';
        r.style.transition = 'transform .45s ease, opacity .6s ease';
        btn.appendChild(r);
        requestAnimationFrame(()=>{ r.style.transform = 'scale(1)'; r.style.opacity = '.0'; });
        setTimeout(()=> r.remove(), 650);
      });
    });

  });
})();
