// dev/assets/js/main.js
// Stable wiring for Choose + Details, with scroll/top fixes & plan copy

document.addEventListener('DOMContentLoaded', () => {
  // Always start at the top (GitHub Pages/iOS sometimes restore scroll)
  try {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
  } catch {}

  // Plan copy
  const PLAN_COPY = {
    basic: {
      title: 'BASIC — What you get',
      body: `<ul>
        <li>Starter templates with polished white & gold UI</li>
        <li>Library access (videos, images, logos)</li>
        <li>Email support (48h)</li>
        <li>7-day refund window</li>
      </ul>`
    },
    silver: {
      title: 'SILVER — What you get',
      body: `<ul>
        <li>Everything in Basic</li>
        <li>Advanced effects & reusable presets</li>
        <li>Priority email (24h)</li>
      </ul>`
    },
    gold: {
      title: 'GOLD — What you get',
      body: `<ul>
        <li>Full custom session</li>
        <li>Admin toolkit & automations</li>
        <li>1:1 onboarding (45 min)</li>
      </ul>`
    },
    diamond: {
      title: 'DIAMOND — What you get',
      body: `<ul>
        <li>Custom pipelines & integrations</li>
        <li>Hands-on help building your stack</li>
        <li>Priority roadmap & turnaround</li>
      </ul>`
    },
    setup: {
      title: 'SETUP — What you get',
      body: `<ul>
        <li>Deploy & connect Pages</li>
        <li>Analytics hookup</li>
        <li>Best-practice sweep</li>
      </ul>`
    },
    reels: {
      title: 'REELS — What you get',
      body: `<ul>
        <li>3 niche reels</li>
        <li>Captions & cuts</li>
        <li>IG/TikTok-ready exports</li>
      </ul>`
    },
    templates: {
      title: 'TEMPLATES — What you get',
      body: `<ul>
        <li>5 premium blocks</li>
        <li>Copy-paste ready</li>
        <li>Lifetime updates</li>
      </ul>`
    }
  };

  // Modal elements
  const bodyEl = document.body;
  const backdrop = document.getElementById('detail-backdrop');
  const modal = document.getElementById('detail-modal');
  const titleEl = document.getElementById('detail-title');
  const bodyBox = document.getElementById('detail-body');
  const closeBtn = modal?.querySelector('.detail-modal__close');

  const openModal = (titleHTML, bodyHTML) => {
    if (!modal || !backdrop) return;
    titleEl.innerHTML = titleHTML || '';
    bodyBox.innerHTML = bodyHTML || '';
    backdrop.style.display = 'block';
    modal.style.display = 'block';
    bodyEl.classList.add('no-scroll');
    setTimeout(() => closeBtn?.focus(), 0);
  };

  const closeModal = () => {
    if (!modal || !backdrop) return;
    modal.style.display = 'none';
    backdrop.style.display = 'none';
    bodyEl.classList.remove('no-scroll');
  };

  backdrop?.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); closeModal(); });
  closeBtn?.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); closeModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal?.style.display === 'block') closeModal();
  }, { passive: true });

  // Targets
  const contactSection =
    document.querySelector('#contact') ||
    document.querySelector('form')?.closest('section') ||
    document.querySelector('form');

  const subjectInput =
    document.querySelector('input[name="subject"]') ||
    document.querySelector('#subject');

  const smooth = (el) => el && el.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Wire buttons
  document.querySelectorAll('button, a').forEach((el) => {
    const label = (el.textContent || '').trim().toLowerCase();

    // CHOOSE-like actions -> jump contact + prefill subject
    if (['choose','start setup','order pack','get pack','join now'].includes(label)) {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const card = el.closest('section, article, div') || document.body;
        const titleNode =
          card.querySelector('h1, h2, h3, h4, .card-title') ||
          document.querySelector('h1, h2, h3');
        const planTitle = (titleNode?.textContent || 'Plan').trim();

        if (subjectInput) subjectInput.value = `Join ${planTitle}`;
        smooth(contactSection || document.body);
        return false;
      });
    }

    // DETAILS -> open modal (no page movement)
    if (label === 'details') {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const key = el.getAttribute('data-plan')?.toLowerCase().trim();
        const copy = key && PLAN_COPY[key];

        if (copy) {
          openModal(copy.title, copy.body);
        } else {
          const card = el.closest('section, article, div') || document.body;
          const titleNode =
            card.querySelector('h1, h2, h3, h4, .card-title') ||
            document.querySelector('h1, h2, h3');
          const planTitle = (titleNode?.textContent || 'this plan').trim();
          openModal(planTitle, `<p>Full details coming soon for <strong>${planTitle}</strong>.</p>`);
        }
        return false;
      });
    }
  });
});
