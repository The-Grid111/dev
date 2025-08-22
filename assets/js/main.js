// dev/assets/js/main.js
// Plans: wire up Choose/Details, lock scroll on modal, start page at top

document.addEventListener('DOMContentLoaded', () => {
  // Always start at the top (GitHub Pages/iOS sometimes restores scroll)
  try {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  } catch {}
  window.scrollTo(0, 0);

  // ---------- helpers ----------
  const smooth = (el) => el && el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const q = (sel, root = document) => root.querySelector(sel);

  // Areas we might need
  const contactSection = q('#contact') || q('form')?.closest('section') || q('form');
  const subjectInput   = q('input[name="subject"]') || q('#subject');

  // ---------- Details copy per plan ----------
  // Keys should match the visible heading text (case-insensitive, trimmed)
  const DETAILS = {
    'basic': `
      <ul>
        <li>Starter templates with a polished white & gold UI</li>
        <li>Access to library (videos, images, logos)</li>
        <li>Email support within 48 hours</li>
        <li>7-day refund window</li>
      </ul>`,
    'silver': `
      <ul>
        <li>Everything in Basic</li>
        <li>Advanced effects & ready-to-use presets</li>
        <li>Priority email support (24h)</li>
        <li>7-day refund window</li>
      </ul>`,
    'gold': `
      <ul>
        <li>Full custom session to tailor the library to your brand</li>
        <li>Admin toolkit & light automations</li>
        <li>1:1 onboarding (45 minutes)</li>
        <li>7-day refund window</li>
      </ul>`,
    'diamond': `
      <ul>
        <li>Custom pipelines & integrations</li>
        <li>Hands-on help building your stack</li>
        <li>Priority roadmap & fast turnaround</li>
        <li>7-day refund window</li>
      </ul>`,
    'setup': `
      <ul>
        <li>Deploy & connect GitHub Pages</li>
        <li>Analytics hookup</li>
        <li>Best-practice sweep of your repo</li>
      </ul>`,
    'reels': `
      <ul>
        <li>3 niche reels crafted for your audience</li>
        <li>Captions & cuts included</li>
        <li>IG/TikTok ready exports</li>
      </ul>`,
    'templates': `
      <ul>
        <li>5 premium, copy-paste blocks</li>
        <li>Clean, documented markup</li>
        <li>Lifetime updates</li>
      </ul>`
  };

  // ---------- Modal (created once, reused) ----------
  const overlay = document.createElement('div');
  overlay.className = 'tg-modal-overlay';
  overlay.style.display = 'none';

  overlay.innerHTML = `
    <div class="tg-modal" role="dialog" aria-modal="true" aria-labelledby="tg-modal-title">
      <button class="tg-modal-close" aria-label="Close">×</button>
      <h3 id="tg-modal-title" class="tg-modal-title"></h3>
      <div class="tg-modal-body"></div>
    </div>
  `;

  document.body.appendChild(overlay);
  const modal      = q('.tg-modal', overlay);
  const modalTitle = q('.tg-modal-title', overlay);
  const modalBody  = q('.tg-modal-body', overlay);
  const closeBtn   = q('.tg-modal-close', overlay);

  const openModal = (title, html) => {
    modalTitle.textContent = title;
    modalBody.innerHTML = html;
    // show & lock page scroll
    overlay.style.display = 'block';
    requestAnimationFrame(() => overlay.classList.add('is-open'));
    document.body.dataset.scrollLock = '1';
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    overlay.classList.remove('is-open');
    // small timeout to allow fade-out CSS
    setTimeout(() => { overlay.style.display = 'none'; }, 120);
    document.body.style.overflow = '';
    delete document.body.dataset.scrollLock;
  };

  closeBtn.addEventListener('click', (e) => { e.preventDefault(); closeModal(); });
  overlay.addEventListener('click', (e) => {
    // only close if clicking the dark backdrop, not the dialog
    if (e.target === overlay) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.style.display === 'block') closeModal();
  });

  // ---------- Button wiring ----------
  // Avoid double-binding if this script re-runs
  document.querySelectorAll('button, a').forEach((el) => {
    if (el.dataset.tgBound) return;
    el.dataset.tgBound = '1';

    const label = (el.textContent || '').trim().toLowerCase();

    // CHOOSE -> scroll to contact & prefill subject (no page change)
    if (label === 'choose') {
      el.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        const card = el.closest('section, article, div') || document.body;
        const titleEl =
          card.querySelector('h1, h2, h3, h4, .card-title') ||
          document.querySelector('h1, h2, h3');

        const planTitle = (titleEl?.textContent || 'Plan').trim();
        if (subjectInput) subjectInput.value = `Join ${planTitle}`;
        smooth(contactSection || document.body);
      });
    }

    // DETAILS -> open modal (no scroll, no navigation)
    if (label === 'details') {
      el.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();

        const card = el.closest('section, article, div') || document.body;
        const titleEl =
          card.querySelector('h1, h2, h3, h4, .card-title') ||
          document.querySelector('h1, h2, h3');

        const planTitle = (titleEl?.textContent || 'Details').trim();
        const key = planTitle.toLowerCase().replace(/£.*$/,'').trim(); // strip trailing price if present

        const html = DETAILS[key] || `<p>Full details coming soon for <strong>${planTitle}</strong>.</p>`;
        openModal(planTitle, html);
      });
    }
  });
});
