/* dev/assets/js/main.js
   Stable baseline — buttons wired + plan Details modal
   - Always load page at top (fixes GH Pages/iOS “start at bottom”)
   - Smooth scroll helpers
   - Choose → scroll to Contact and prefill Subject with plan name
   - Details → open modal with per-plan description (Basic/Silver/Gold/Diamond/Setup/Reels/Templates)
   - Works for both <button> and <a>, and for “Start Setup / Order Pack / Get Pack” buttons
*/

(function () {
  // --- Always start at top (prevents "load at bottom" on GH Pages / iOS) ---
  try {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
  } catch (e) {}

  // --- Small utils ---
  const smoothScroll = (el) => {
    if (!el) return;
    try {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch {
      // Fallback
      const top = el.getBoundingClientRect().top + window.pageYOffset - 8;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const closestCard = (el) => el.closest('section, article, .card, .plan, div');

  // Pull a readable plan title from the nearest card heading
  const getPlanTitle = (originEl) => {
    const card = closestCard(originEl) || document.body;

    // Prefer explicit title element if present
    let titleEl =
      card.querySelector('.card-title, .plan-title, h1, h2, h3, h4') ||
      document.querySelector('h1, h2, h3');

    if (!titleEl) return 'Plan';

    // Clean: drop prices like “£29/mo”
    let t = (titleEl.textContent || '').trim();
    t = t.replace(/\s*£[\d,.]+(?:\s*\/\s*mo)?/i, '').trim();
    // Title-case common outputs (BASIC->Basic, etc)
    t = t.replace(/\s+/g, ' ');
    return t;
  };

  // --- Contact targets (very forgiving selectors) ---
  const contactSection =
    document.querySelector('#contact') ||
    document.querySelector('form')?.closest('section') ||
    document.querySelector('form') ||
    document.body;

  const subjectInput =
    document.querySelector('input[name="subject"]') ||
    document.querySelector('#subject');

  // --- Modal (auto-created; no CSS dependency) ---
  const ensureModal = () => {
    let overlay = document.getElementById('plan-modal');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'plan-modal';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.style.cssText = [
      'position:fixed',
      'inset:0',
      'background:rgba(0,0,0,.55)',
      'display:none',
      'align-items:center',
      'justify-content:center',
      'z-index:9999',
      'padding:24px'
    ].join(';');

    const dialog = document.createElement('div');
    dialog.id = 'plan-modal-dialog';
    dialog.style.cssText = [
      'max-width:720px',
      'width:100%',
      'background:#101418',
      'color:#eaeff3',
      'border:1px solid rgba(255,255,255,.12)',
      'border-radius:14px',
      'box-shadow:0 10px 30px rgba(0,0,0,.35)',
      'padding:20px 20px 16px',
      'font-family:system-ui,-apple-system,Segoe UI,Roboto,Inter,Arial,sans-serif'
    ].join(';');

    const close = document.createElement('button');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close');
    close.style.cssText = [
      'float:right',
      'border:1px solid rgba(255,255,255,.18)',
      'background:transparent',
      'color:#eaeff3',
      'border-radius:10px',
      'padding:6px 10px',
      'cursor:pointer'
    ].join(';');
    close.textContent = 'Close';

    const title = document.createElement('h3');
    title.id = 'plan-modal-title';
    title.style.cssText = [
      'margin:0 0 10px',
      'font-size:20px',
      'letter-spacing:.2px'
    ].join(';');

    const body = document.createElement('div');
    body.id = 'plan-modal-body';
    body.style.cssText = [
      'font-size:15px',
      'line-height:1.6',
      'opacity:.95'
    ].join(';');

    dialog.appendChild(close);
    dialog.appendChild(title);
    dialog.appendChild(body);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    const hide = () => {
      overlay.style.display = 'none';
      overlay.setAttribute('aria-hidden', 'true');
      // Restore scroll
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };

    close.addEventListener('click', hide);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) hide();
    });
    document.addEventListener('keydown', (e) => {
      if (overlay.style.display === 'flex' && e.key === 'Escape') hide();
    });

    overlay._show = (titleText, html) => {
      title.textContent = titleText;
      body.innerHTML = html;
      overlay.style.display = 'flex';
      overlay.setAttribute('aria-hidden', 'false');
      // Lock scroll while open
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    };

    return overlay;
  };

  // Per-plan details (edit freely; shown inside modal)
  const PLAN_DETAILS = {
    Basic: `
      <ul>
        <li>Starter templates with a polished, white &amp; gold UI.</li>
        <li>Library access (videos, images, logos).</li>
        <li>Email support within 48 hours.</li>
        <li>7-day refund policy.</li>
      </ul>
    `,
    Silver: `
      <ul>
        <li>Everything in Basic.</li>
        <li>Advanced effects &amp; preset library.</li>
        <li>Priority email support (24h).</li>
        <li>Best-practice guidance for faster publishing.</li>
      </ul>
    `,
    Gold: `
      <ul>
        <li>Full custom session tailored to your brand.</li>
        <li>Admin toolkit &amp; automations included.</li>
        <li>1:1 onboarding call (45 min).</li>
        <li>Roadmap planning for your visual pipeline.</li>
      </ul>
    `,
    Diamond: `
      <ul>
        <li>Custom pipelines &amp; integrations (end-to-end).</li>
        <li>Hands-on help building your stack.</li>
        <li>Priority roadmap &amp; fast turnaround.</li>
        <li>Direct access for iterations &amp; upgrades.</li>
      </ul>
    `,
    Setup: `
      <ul>
        <li>Deploy &amp; connect GitHub Pages.</li>
        <li>Analytics hookup.</li>
        <li>Best-practice sweep to keep everything fast &amp; stable.</li>
      </ul>
    `,
    Reels: `
      <ul>
        <li>3 niche reels cut for your audience.</li>
        <li>Captions &amp; platform-ready exports.</li>
        <li>IG/TikTok-ready formats and pacing.</li>
      </ul>
    `,
    Templates: `
      <ul>
        <li>5 premium, copy-paste blocks.</li>
        <li>Clean, modern styles with zero code edits.</li>
        <li>Lifetime updates.</li>
      </ul>
    `
  };

  // Map any text found in card titles to our details keys
  const normalizePlanKey = (name) => {
    const n = (name || '').toLowerCase();
    if (n.includes('basic')) return 'Basic';
    if (n.includes('silver')) return 'Silver';
    if (n.includes('gold')) return 'Gold';
    if (n.includes('diamond')) return 'Diamond';
    if (n.includes('setup')) return 'Setup';
    if (n.includes('reels')) return 'Reels';
    if (n.includes('template')) return 'Templates';
    return 'Basic'; // fallback
  };

  // Use label text to decide action
  const getActionFromLabel = (text) => {
    const t = (text || '').trim().toLowerCase();
    if (t === 'choose') return 'choose';
    if (t === 'details') return 'details';
    if (t.includes('start setup') || t.includes('order pack') || t.includes('get pack'))
      return 'choose';
    return null;
  };

  // --- Wire up all buttons/links (idempotent) ---
  const wireInteractions = () => {
    document.querySelectorAll('button, a').forEach((el) => {
      if (el.dataset._bound === '1') return;

      const action = getActionFromLabel(el.textContent);
      if (!action) return;

      if (action === 'choose') {
        el.addEventListener('click', (e) => {
          // Keep native anchors working for top nav etc unless they point nowhere
          const href = el.getAttribute('href');
          const isTrivial = !href || href === '#' || href === '' || href.startsWith('javascript:');
          if (isTrivial) e.preventDefault();

          const planTitle = getPlanTitle(el);
          if (subjectInput) {
            subjectInput.value = `Join ${planTitle}`;
          }
          smoothScroll(contactSection || document.body);
        });
      }

      if (action === 'details') {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          const planTitle = getPlanTitle(el);
          const key = normalizePlanKey(planTitle);
          const overlay = ensureModal();
          const html = PLAN_DETAILS[key] || `<p>No details available yet for ${planTitle}.</p>`;
          overlay._show(`${planTitle} — What you get`, html);
        });
      }

      el.dataset._bound = '1';
    });
  };

  // Initial bind + late binds in case content changes later
  document.addEventListener('DOMContentLoaded', wireInteractions);
  // Safety: also run once now in case this script loads after DOMContentLoaded
  try { wireInteractions(); } catch {}

})();
