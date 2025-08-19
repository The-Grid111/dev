// assets/js/hotfix.js
// Purpose: tiny safety net so missing/slow assets never break the page.
// - Fallback logo image if video fails
// - Safe no-ops for optional buttons
// - Polyfills + guards so main.js can assume things exist

/* -------- Polyfills (lightweight) -------- */
window.requestIdleCallback ||= (cb)=>setTimeout(()=>cb({timeRemaining:()=>5}), 1);
window.cancelIdleCallback ||= (id)=>clearTimeout(id);

/* -------- Safe selectors -------- */
const $  = (s, r=document)=>r.querySelector(s);
const $$ = (s, r=document)=>[...r.querySelectorAll(s)];

/* -------- Logo video fallback -------- */
document.addEventListener('DOMContentLoaded', () => {
  const vid = $('#logoVid');
  if (vid) {
    // Default source set in main.js; if that 404s, swap to PNG.
    vid.addEventListener('error', () => {
      const img = document.createElement('img');
      img.src = 'assets/images/gc_logo.png';
      img.alt = 'Logo';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      vid.replaceWith(img);
    }, { once: true });
  }
});

/* -------- Optional buttons: make harmless if missing -------- */
(function safeButtons(){
  const ids = ['btnCustomize','btnJoin','save','reset'];
  ids.forEach(id=>{
    const el = document.getElementById(id);
    if (!el) return; // not present on this build — fine
    if (!el.onclick) el.onclick = ()=>{}; // placeholder so addEventListener in main.js won’t error
  });
})();

/* -------- Hero container guard -------- */
(function heroGuard(){
  const hero = document.getElementById('hero');
  if (!hero) return;
  // If main.js hasn’t rendered media yet, keep a lightweight placeholder
  if (!hero.firstElementChild) {
    const ph = document.createElement('div');
    ph.style.cssText = 'width:100%;aspect-ratio:16/9;display:grid;place-items:center;color:#9aa3b7;border:1px dashed #2a3142;border-radius:12px;background:#0c0f15';
    ph.textContent = 'Loading hero…';
    hero.appendChild(ph);
  }
})();

/* -------- Defensive listeners so missing dialogs don’t throw -------- */
document.addEventListener('DOMContentLoaded', () => {
  const panel = $('#panel');
  const modal = $('#planModal');
  if (panel && typeof panel.showModal !== 'function') {
    // Very old browser: degrade to simple open/close via class
    panel.showModal = ()=> panel.classList.add('open');
    panel.close     = ()=> panel.classList.remove('open');
  }
  if (modal && typeof modal.showModal !== 'function') {
    modal.showModal = ()=> modal.classList.add('open');
    modal.close     = ()=> modal.classList.remove('open');
  }
});

/* -------- No-op exports (for sanity) -------- */
window.__HOTFIX_OK__ = true;
