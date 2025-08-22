// assets/js/main.js
// Plan/Service dialogs + checkout confirm + no background scroll

document.addEventListener('DOMContentLoaded', () => {
  // ---------- Detailed copy for each plan/service ----------
  const detailsCopy = {
    basic: {
      title: "BASIC — £9/mo",
      body: `
        <p>Perfect for getting started with THE GRID.</p>
        <ul>
          <li>Starter templates with polished white & gold UI</li>
          <li>Access to media library (videos, images, logos)</li>
          <li>Email support within 48 hours</li>
          <li>7-day refund window</li>
        </ul>`
    },
    silver: {
      title: "SILVER — £29/mo",
      body: `
        <p>Everything in Basic, plus tools to step up production.</p>
        <ul>
          <li>All Basic features</li>
          <li>Advanced effects & preset library</li>
          <li>Priority email support (24h)</li>
          <li>Upgrade/downgrade anytime</li>
        </ul>`
    },
    gold: {
      title: "GOLD — £49/mo",
      body: `
        <p>For teams that want hands-on help and automation.</p>
        <ul>
          <li>Full custom working session</li>
          <li>Admin toolkit & automations</li>
          <li>1:1 onboarding call (45 min)</li>
          <li>Priority bug fixes for your workspace</li>
        </ul>`
    },
    diamond: {
      title: "DIAMOND — £99/mo",
      body: `
        <p>Our concierge tier for serious throughput.</p>
        <ul>
          <li>Custom pipelines & third-party integrations</li>
          <li>Hands-on help building your stack</li>
          <li>Priority roadmap & fast turnaround</li>
          <li>Private previews on new features</li>
        </ul>`
    },
    setup: {
      title: "SETUP — £39 (one-off)",
      body: `
        <p>We connect the dots so you can publish immediately.</p>
        <ul>
          <li>Deploy & connect GitHub Pages</li>
          <li>Analytics hookup (GA4 or Plausible)</li>
          <li>Best-practice sweep & checks</li>
        </ul>`
    },
    reels: {
      title: "REELS — £59 (one-off)",
      body: `
        <p>Three ready-to-post short-form videos for your niche.</p>
        <ul>
          <li>3 niche reels (script, edit, pacing)</li>
          <li>Captions, cuts & aspect-ratio exports</li>
          <li>IG/TikTok-ready delivery</li>
        </ul>`
    },
    templates: {
      title: "TEMPLATES — £29 (one-off)",
      body: `
        <p>Drop-in components to expand your site fast.</p>
        <ul>
          <li>5 premium, responsive blocks</li>
          <li>Copy-paste ready snippets</li>
          <li>Lifetime updates</li>
        </ul>`
    }
  };

  // ---------- Minimal dialog system (uses its own overlay, blocks scroll) ----------
  const injectStyles = () => {
    if (document.getElementById('tg-dialog-css')) return;
    const style = document.createElement('style');
    style.id = 'tg-dialog-css';
    style.textContent = `
      .tg-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.45);
        backdrop-filter:blur(2px);display:flex;align-items:center;justify-content:center;z-index:9999}
      .tg-dialog{position:relative;max-width:560px;width:92vw;background:#0f172a;color:#e5e7eb;
        border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:20px;
        box-shadow:0 10px 40px rgba(0,0,0,.5)}
      .tg-dialog h3{margin:0 0 8px;font-size:22px;line-height:1.25}
      .tg-dialog p{margin:8px 0 0 0}
      .tg-dialog ul{margin:10px 0 0 18px}
      .tg-dialog li{margin:6px 0}
      .tg-x{position:absolute;top:10px;right:12px;background:#111827;border:1px solid rgba(255,255,255,.1);
        border-radius:999px;width:32px;height:32px;color:#e5e7eb}
      .tg-actions{margin-top:16px;display:flex;gap:10px;justify-content:flex-end}
      .tg-btn{padding:10px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.1);
        background:#1f2937;color:#fff}
      .tg-btn.primary{background:#f2c94c;color:#000;border-color:rgba(0,0,0,.2)}
      body.tg-no-scroll{overflow:hidden}
    `;
    document.head.appendChild(style);
  };

  const openDialog = (title, html, actions = []) => {
    injectStyles();
    const backdrop = document.createElement('div');
    backdrop.className = 'tg-backdrop';
    const box = document.createElement('div');
    box.className = 'tg-dialog';
    box.innerHTML = `
      <button class="tg-x" aria-label="Close">×</button>
      <h3>${title}</h3>
      <div class="tg-body">${html}</div>
      <div class="tg-actions"></div>
    `;
    const actionsEl = box.querySelector('.tg-actions');
    actions.forEach(a => {
      const btn = document.createElement('button');
      btn.className = 'tg-btn ' + (a.primary ? 'primary' : '');
      btn.textContent = a.label;
      btn.addEventListener('click', a.onClick);
      actionsEl.appendChild(btn);
    });

    backdrop.appendChild(box);
    document.body.appendChild(backdrop);
    document.body.classList.add('tg-no-scroll');

    const close = () => {
      backdrop.remove();
      document.body.classList.remove('tg-no-scroll');
    };
    box.querySelector('.tg-x').addEventListener('click', close);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) close();
    });

    return { close };
  };

  // Helper: guess key from nearest card title
  const keyFromButton = (btn) => {
    const card = btn.closest('section, article, .card, div');
    const titleEl = card?.querySelector('h1,h2,h3,h4,.card-title') || document.querySelector('h1,h2,h3');
    const raw = (titleEl?.textContent || '').trim().toLowerCase();
    // first word typically matches our keys
    const k = raw.split(' ')[0];
    return { key: k, titleText: (titleEl?.textContent || '').trim() || 'Details' };
  };

  // ---------- Wire buttons ----------
  document.querySelectorAll('button, a').forEach((el) => {
    const label = (el.textContent || '').trim().toLowerCase();

    // DETAILS -> open plan/service-specific copy
    if (label === 'details') {
      el.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        const { key, titleText } = keyFromButton(el);
        const copy = detailsCopy[key] || { title: titleText, body: `<p>Full details coming soon.</p>` };
        openDialog(copy.title, copy.body, [
          { label: 'Close', onClick: (ev) => ev.currentTarget.closest('.tg-backdrop').remove() },
          { label: 'Choose', primary: true, onClick: () => {
              // mimic choose flow
              const subject = document.querySelector('input[name="subject"], #subject');
              if (subject) subject.value = `Join ${titleText}`;
              document.querySelector('.tg-backdrop')?.remove();
              document.body.classList.remove('tg-no-scroll');
            }
          }
        ]);
      }, { passive: false });
    }

    // CHOOSE / START SETUP / ORDER PACK / GET PACK -> confirm and prefill subject
    if (['choose', 'start setup', 'order pack', 'get pack'].includes(label)) {
      el.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        const { titleText } = keyFromButton(el);
        const dlg = openDialog('Checkout', `
          <p>Proceed with <strong>${titleText}</strong>.</p>
          <p>In the full build this opens your checkout gateway. For now we’ll confirm your choice and prefill the contact form.</p>
        `, [
          { label: 'Close', onClick: () => dlg.close() },
          { label: 'Confirm', primary: true, onClick: () => {
              const subject = document.querySelector('input[name="subject"], #subject');
              if (subject) subject.value = `Join ${titleText}`;
              dlg.close();
            }
          }
        ]);
      }, { passive: false });
    }
  });
});
