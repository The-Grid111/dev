import { loadStripeConfig, openCheckoutFor } from './stripe.js';
import { initLocalState } from './storage.js';
import { applyEntitlements } from './entitlements.js';
import { supabaseReady, syncBootstrap } from './supabase.js';

const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

/* ---- Boot ---- */
(async function boot() {
  // Year
  $('#year').textContent = new Date().getFullYear();

  // Local-first state (autosave slots etc.)
  initLocalState();

  // Optional cloud bootstrap (safe no-op if keys not set)
  if (supabaseReady()) await syncBootstrap();

  // Load Stripe link config (links mode)
  const stripe = await loadStripeConfig();

  // Trial banner
  setupTrial(stripe);

  // Pricing cards: Details open panel; Choose goes to Stripe
  wirePlans(stripe);

  // Join Now routes to Diamond plan (or pricing)
  $('#btnJoinNow').addEventListener('click', () => {
    const el = document.querySelector('[data-plan="diamond"] .choose');
    if (el) el.click();
  });

  // Contact (dummy)
  $('.contact').addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Thanks — we’ll reply by email soon.');
    e.target.reset();
  });
})();

/* ---- Trial banner ---- */
function setupTrial(stripe) {
  const strip = $('#trialStrip');
  const link = $('#trialLink');
  const dismiss = $('#dismissTrial');

  const trialUrl = stripe?.trial || '';
  const dismissed = localStorage.getItem('trial_dismissed') === '1';
  const trialUsed = localStorage.getItem('trial_used') === '1';

  if (!trialUrl || dismissed || trialUsed) return; // Hide if not configured or already used

  link.href = trialUrl;
  strip.classList.remove('hidden');

  // Soft “single-use” client flag (real enforcement comes from Stripe + backend later)
  link.addEventListener('click', () => {
    localStorage.setItem('trial_used', '1');
    setTimeout(() => strip.classList.add('hidden'), 300);
  });

  dismiss.addEventListener('click', () => {
    localStorage.setItem('trial_dismissed', '1');
    strip.classList.add('hidden');
  });
}

/* ---- Pricing cards ---- */
function wirePlans(stripe) {
  // Details: open descriptive panel
  $$('.plan').forEach(card => {
    const plan = card.getAttribute('data-plan');
    const detailsBtn = $('.details', card);
    const chooseBtn = $('.choose', card);

    detailsBtn.addEventListener('click', () => openPlanDetails(plan, stripe));
    chooseBtn.addEventListener('click', () => openCheckoutFor(plan, stripe));
  });

  // Dialog controls
  const dlg = $('#detailsDialog');
  $('#detailsClose').onclick = () => dlg.close();
  $('#detailsCancel').onclick = () => dlg.close();
}

function openPlanDetails(plan, stripe) {
  const map = {
    basic: {
      title: 'BASIC',
      body: `
        <ul>
          <li>Starter templates & effects</li>
          <li>Theme presets & Save imports</li>
          <li>Sample Library (watermarked)</li>
          <li>Email support within 48h</li>
          <li>Cancel/upgrade anytime</li>
        </ul>
      `
    },
    silver: {
      title: 'SILVER',
      body: `
        <p>Everything in Basic + advanced effects & metallic styles. Pro 'Stacks & Setups' guides, priority email, and quarterly tune-ups.</p>
        <ul>
          <li>Advanced effects & metallic styles</li>
          <li>Pro 'Stacks & Setups' guides</li>
          <li>Priority email (24h)</li>
          <li>Quarterly tune-ups</li>
          <li>Cancel/upgrade anytime</li>
        </ul>
      `
    },
    gold: {
      title: 'GOLD',
      body: `
        <p>Everything in Silver, plus Admin toolkit & automation recipes, and the full Pro Library. Priority hotfix support keeps you moving.</p>
        <ul>
          <li>Admin toolkit + automation recipes</li>
          <li>Full Pro Library & recipes</li>
          <li>Priority hotfix</li>
          <li>Cancel/upgrade anytime</li>
        </ul>
      `
    },
    diamond: {
      title: 'DIAMOND',
      body: `
        <p>Top-tier access. Private Library drops, custom pipelines (Notion/Airtable/Zapier), roadmap priority. Exports are watermark-free with full commercial rights.</p>
        <ul>
          <li>Private Library drops</li>
          <li>Custom pipelines & hands-on stack build</li>
          <li>Roadmap priority & fast turnaround</li>
          <li><strong>Watermark-free exports + commercial rights</strong></li>
        </ul>
      `
    }
  };

  const info = map[plan];
  if (!info) return;

  $('#detailsTitle').textContent = info.title;
  $('#detailsBody').innerHTML = info.body;

  const links = window.__stripeLinks || {};
  const href = links[plan] || '#';
  const choose = $('#detailsChoose');
  choose.href = href;
  choose.target = href.startsWith('http') ? '_blank' : '_self';

  const dlg = $('#detailsDialog');
  if (!dlg.open) dlg.showModal();
}

/* ---- Apply entitlements (watermark, library unlocks) ---- */
applyEntitlements(); // UI-only today; becomes dynamic when Supabase is wired
