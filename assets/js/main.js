*** Begin Patch
*** Update File: dev/assets/js/main.js
// dev/assets/js/main.js
// Stable controls + visible build badge to verify deploys

document.addEventListener('DOMContentLoaded', () => {
  /* -------------------- Build badge (verifies deploy) -------------------- */
  const buildTime = new Date().toLocaleString();
  const mark = document.createElement('div');
  mark.textContent = `THEGRID • Build ${buildTime}`;
  mark.style.cssText = `
    position:fixed; right:10px; bottom:10px; z-index:9999;
    font:600 12px/1.2 ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;
    background:rgba(0,0,0,.6); color:#f5f7fa; padding:8px 10px; border-radius:10px;
    border:1px solid rgba(255,255,255,.12); backdrop-filter:saturate(1.1) blur(6px);
    box-shadow:0 8px 22px rgba(0,0,0,.35)
  `;
  document.body.appendChild(mark);
  console.log('[THEGRID] main.js loaded @', buildTime);

  /* -------------------- Always start at top -------------------- */
  try {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
  } catch {}

  /* -------------------- Helpers -------------------- */
  const smooth = (el) => el && el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const contactSection =
    $('#contact') ||
    $('form')?.closest('section') ||
    $('form');

  const subjectInput =
    $('input[name="subject"]') ||
    $('#subject') ||
    null;

  /* -------------------- Modal (no CSS dependencies) -------------------- */
  let modal, box;
  const ensureModal = () => {
    if (modal) return;
    modal = document.createElement('div');
    modal.style.cssText = `
      position:fixed; inset:0; display:none; align-items:center; justify-content:center;
      background:rgba(0,0,0,.6); z-index:9998; padding:16px;
    `;
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    box = document.createElement('div');
    box.style.cssText = `
      max-width:720px; width:100%; background:#0f172a; color:#e5e7eb;
      border:1px solid rgba(255,255,255,.12); border-radius:14px; padding:20px;
      box-shadow:0 18px 40px rgba(0,0,0,.45);
      font-family: ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;
    `;
    const header = document.createElement('div');
    header.style.cssText = 'display:flex; justify-content:flex-end; margin-bottom:8px;';
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.cssText = `
      background:#f4c84a; color:#1a1300; border:none; padding:8px 12px;
      border-radius:10px; font-weight:700; cursor:pointer;
    `;
    closeBtn.addEventListener('click', closeModal);
    header.appendChild(closeBtn);
    box.appendChild(header);
    modal.appendChild(box);
    document.body.appendChild(modal);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
  };
  const openModal = (html) => {
    ensureModal();
    while (box.childNodes.length > 1) box.removeChild(box.lastChild);
    const d = document.createElement('div');
    d.innerHTML = html;
    box.appendChild(d);
    modal.style.display = 'flex';
  };
  const closeModal = () => { if (modal) modal.style.display = 'none'; };

  /* -------------------- Plan/Service descriptions -------------------- */
  const desc = {
    BASIC: `
      <h2 style="margin:0 0 6px; font-size:22px;">BASIC £9/mo</h2>
      <p style="opacity:.9">Good for trying things out.</p>
      <ul>
        <li>Starter templates, polished UI</li>
        <li>Library access (videos, images, logos)</li>
        <li>Email support (48h)</li>
      </ul>
    `,
    SILVER: `
      <h2 style="margin:0 0 6px; font-size:22px;">SILVER £29/mo</h2>
      <p style="opacity:.9">Step up with advanced effects & presets.</p>
      <ul>
        <li>Everything in Basic</li>
        <li>Advanced effects & presets</li>
        <li>Priority email (24h)</li>
      </ul>
    `,
    GOLD: `
      <h2 style="margin:0 0 6px; font-size:22px;">GOLD £49/mo</h2>
      <p style="opacity:.9">For creators who want hands-on help.</p>
      <ul>
        <li>Full customization session</li>
        <li>Admin toolkit & automations</li>
        <li>1:1 onboarding (45 min)</li>
      </ul>
    `,
    DIAMOND: `
      <h2 style="margin:0 0 6px; font-size:22px;">DIAMOND £99/mo</h2>
      <p style="opacity:.9">White-glove integrations & priority turnarounds.</p>
      <ul>
        <li>Custom pipelines & integrations</li>
        <li>Hands-on help building your stack</li>
        <li>Priority roadmap & turnaround</li>
      </ul>
    `,
    SETUP: `
      <h2 style="margin:0 0 6px; font-size:22px;">SETUP £39</h2>
      <ul>
        <li>Deploy & connect Pages</li>
        <li>Analytics hookup</li>
        <li>Best-practice sweep</li>
      </ul>
    `,
    REELS: `
      <h2 style="margin:0 0 6px; font-size:22px;">REELS £59</h2>
      <ul>
        <li>3 niche reels</li>
        <li>Captions & cuts</li>
        <li>IG/TikTok ready</li>
      </ul>
    `,
    TEMPLATES: `
      <h2 style="margin:0 0 6px; font-size:22px;">TEMPLATES £29</h2>
      <ul>
        <li>5 premium blocks</li>
        <li>Copy-paste ready</li>
        <li>Lifetime updates</li>
      </ul>
    `,
    DEFAULT: `
      <h2 style="margin:0 0 6px; font-size:22px;">Plan Details</h2>
      <p>Here’s what’s included.</p>
    `
  };

  // Try to detect the plan/service name near a clicked button
  const findPlanKey = (el) => {
    const card = el.closest('[data-tier], article, section, .plan, .card') || document.body;
    const tierAttr = card.getAttribute('data-tier');
    if (tierAttr) {
      const t = tierAttr.toUpperCase();
      if (desc[t]) return t;
    }
    const txt = (card.querySelector('.badge, .price, h3, h2, h1')?.textContent || '').toUpperCase();
    if (txt.includes('BASIC')) return 'BASIC';
    if (txt.includes('SILVER')) return 'SILVER';
    if (txt.includes('GOLD')) return 'GOLD';
    if (txt.includes('DIAMOND')) return 'DIAMOND';
    if (txt.includes('SETUP')) return 'SETUP';
    if (txt.includes('REELS')) return 'REELS';
    if (txt.includes('TEMPLATES')) return 'TEMPLATES';
    return 'DEFAULT';
  };

  /* -------------------- Wire up actions robustly -------------------- */
  // Customize panel
  const panel = $('#panel');
  const customizeBtn = $('#btnCustomize');
  if (customizeBtn && panel && typeof panel.showModal === 'function') {
    customizeBtn.addEventListener('click', (e) => { e.preventDefault(); panel.showModal(); });
  }

  // Join Now -> plans
  const joinBtn = $('#btnJoin');
  const plans = $('#plans') || $('[id*=plan]');
  if (joinBtn && plans) {
    joinBtn.addEventListener('click', (e) => { e.preventDefault(); smooth(plans); });
  }

  // Buttons: we accept class names OR label text to avoid regressions
  $$('button, a').forEach((el) => {
    const label = (el.textContent || '').trim().toLowerCase();
    const isChoose = el.classList.contains('choose') || label === 'choose';
    const isDetails = el.classList.contains('details') || label === 'details';

    if (isChoose) {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const key = findPlanKey(el);
        if (subjectInput) subjectInput.value = `Join ${key.charAt(0)}${key.slice(1).toLowerCase()}`;
        smooth(contactSection || document.body);
      });
    }

    if (isDetails) {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const key = findPlanKey(el);
        openModal(desc[key] || desc.DEFAULT);
      });
    }
  });
});
*** End Patch
