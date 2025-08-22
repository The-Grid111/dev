*** Begin Patch
*** Update File: dev/assets/js/main.js
// dev/assets/js/main.js
// Wire plan buttons + force top-of-page on load + Details modal

document.addEventListener('DOMContentLoaded', () => {
  // --- Always start at the top (fixes “load at bottom” on iOS/GitHub Pages)
  try {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
  } catch {}

  // --- Small helper
  const smooth = (el) => el && el.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // --- Targets we can find even without hardcoded IDs
  const contactSection =
    document.querySelector('#contact') ||
    document.querySelector('form')?.closest('section') ||
    document.querySelector('form');

  const subjectInput =
    document.querySelector('input[name="subject"]') ||
    document.querySelector('#subject');

  // ======================================================
  // Details Modal (self-contained: injects its own styles)
  // ======================================================
  const MODAL_ID = 'tg-details-modal';

  // Inject minimal styles once
  (function ensureModalStyles() {
    if (document.getElementById(`${MODAL_ID}-styles`)) return;
    const css = `
      .tg-modal-backdrop{position:fixed;inset:0;background:#0008;display:flex;align-items:center;justify-content:center;z-index:9999}
      .tg-modal{width:min(720px,90vw);max-height:85vh;overflow:auto;background:#0f172a;color:#e5e7eb;border:1px solid #334155;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.5)}
      .tg-modal header{padding:20px 24px;border-bottom:1px solid #334155;display:flex;justify-content:space-between;align-items:center}
      .tg-modal h3{margin:0;font-size:20px;font-weight:700}
      .tg-modal .tg-close{appearance:none;border:0;background:#0b1220;color:#e5e7eb;border:1px solid #334155;border-radius:10px;padding:8px 12px;cursor:pointer}
      .tg-modal .tg-close:focus{outline:2px solid #22d3ee;outline-offset:2px}
      .tg-modal .body{padding:20px 24px;line-height:1.55}
      .tg-modal .body ul{margin:0 0 12px 18px}
      .tg-modal .body li{margin:6px 0}
      .tg-modal footer{padding:18px 24px;border-top:1px solid #334155;display:flex;gap:12px;justify-content:flex-end}
      .tg-modal .tg-cta{appearance:none;border:0;background:#075985;color:#e5e7eb;border-radius:12px;padding:10px 16px;cursor:pointer}
      .tg-modal .tg-cta:focus{outline:2px solid #22d3ee;outline-offset:2px}
    `;
    const style = document.createElement('style');
    style.id = `${MODAL_ID}-styles`;
    style.textContent = css;
    document.head.appendChild(style);
  })();

  // Copy used by Details modal
  const detailsCopy = {
    'BASIC': {
      title: 'BASIC — What you get',
      bullets: [
        'Starter templates with polished white & gold UI',
        'Access to the Library (videos, images, logos)',
        'Email support within 48 hours',
        'Perfect for getting launched fast'
      ]
    },
    'SILVER': {
      title: 'SILVER — What you get',
      bullets: [
        'Everything in Basic',
        'Advanced effects & creative presets',
        'Priority email support (24h)',
        'Best for upgrading your visuals regularly'
      ]
    },
    'GOLD': {
      title: 'GOLD — What you get',
      bullets: [
        'Full custom session tailored to your niche',
        'Admin toolkit & automations',
        '1:1 onboarding call (45 min)',
        'Great for serious creators ready to scale'
      ]
    },
    'DIAMOND': {
      title: 'DIAMOND — What you get',
      bullets: [
        'Custom pipelines & third-party integrations',
        'Hands-on help building your stack',
        'Priority roadmap placement & turnaround',
        'For teams that need premium support'
      ]
    },
    'SETUP': {
      title: 'SETUP — What’s included',
      bullets: [
        'Deploy & connect GitHub Pages',
        'Analytics hookup (e.g., GA)',
        'Best-practice sweep & launch checklist'
      ]
    },
    'REELS': {
      title: 'REELS — What’s included',
      bullets: [
        '3 niche reels crafted for your audience',
        'Captions & cut-downs included',
        'IG/TikTok-ready export presets'
      ]
    },
    'TEMPLATES': {
      title: 'TEMPLATES — What’s included',
      bullets: [
        '5 premium page/section blocks',
        'Copy-paste ready into your site',
        'Lifetime updates to this pack'
      ]
    }
  };

  function openDetailsModal(labelFromUI, sourceEl) {
    // Figure out the “plan key” from the nearest heading or card title
    const card = sourceEl.closest('section, article, div') || document.body;
    const titleEl =
      card.querySelector('h1, h2, h3, h4, .card-title') ||
      document.querySelector('h1, h2, h3');
    const raw = (titleEl?.textContent || labelFromUI || '').trim();
    // Normalize (BASIC/SILVER/GOLD/DIAMOND/SETUP/REELS/TEMPLATES)
    const key = raw.toUpperCase().split(' ')[0].replace(/[^\w]/g, '');
    const copy = detailsCopy[key] || {
      title: `${raw} — Details`,
      bullets: ['Full details coming soon.']
    };

    // Build modal
    const backdrop = document.createElement('div');
    backdrop.className = 'tg-modal-backdrop';
    backdrop.role = 'dialog';
    backdrop.ariaModal = 'true';

    const modal = document.createElement('div');
    modal.className = 'tg-modal';
    modal.innerHTML = `
      <header>
        <h3>${copy.title}</h3>
        <button class="tg-close" type="button" aria-label="Close">Close</button>
      </header>
      <div class="body">
        <ul>${copy.bullets.map(b => `<li>${b}</li>`).join('')}</ul>
        <p>If you’ve got questions, use the Contact form below and we’ll reply from <strong>gridcoresystems@gmail.com</strong>.</p>
      </div>
      <footer>
        <button class="tg-cta" type="button" data-action="choose">Choose this</button>
        <button class="tg-close" type="button">Done</button>
      </footer>
    `;
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    // Close helpers
    const remove = () => backdrop.remove();
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) remove(); });
    modal.querySelectorAll('.tg-close').forEach(btn => btn.addEventListener('click', remove));
    document.addEventListener('keydown', function esc(e){
      if (e.key === 'Escape') { remove(); document.removeEventListener('keydown', esc); }
    });

    // CTA -> behave like CHOOSE for this card
    modal.querySelector('[data-action="choose"]').addEventListener('click', () => {
      try {
        if (subjectInput) subjectInput.value = `Join ${raw}`;
      } catch {}
      remove();
      smooth(contactSection || document.body);
    });
  }

  // ======================================================
  // Button wiring: CHOOSE + DETAILS
  // ======================================================
  document.querySelectorAll('button, a').forEach((el) => {
    const label = (el.textContent || '').trim().toLowerCase();

    // CHOOSE -> jump to Contact and prefill Subject
    if (label === 'choose' || el.dataset.action === 'choose') {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const card = el.closest('section, article, div') || document.body;
        const titleEl =
          card.querySelector('h1, h2, h3, h4, .card-title') ||
          document.querySelector('h1, h2, h3');

        const planTitle = (titleEl?.textContent || 'Plan').trim();
        if (subjectInput) subjectInput.value = `Join ${planTitle}`;
        smooth(contactSection || document.body);
      });
    }

    // DETAILS -> open modal (no page jump)
    if (label === 'details' || el.dataset.action === 'details') {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        openDetailsModal(el.textContent || 'Details', el);
      });
    }
  });
});
*** End Patch
