/* commerce.js — Payment Links + device-level one-time trial guard (no backend required) */

const Commerce = (() => {
  let cfg = null;

  async function loadConfig() {
    if (cfg) return cfg;
    try {
      const res = await fetch('assets/config/stripe.json', { cache: 'no-store' });
      cfg = await res.json();
    } catch (e) {
      console.error('Failed to load assets/config/stripe.json', e);
      cfg = { mode: 'links' };
    }
    return cfg;
  }

  function toast(msg, type = 'info') {
    let t = document.querySelector('.toast');
    if (!t) {
      t = document.createElement('div');
      t.className = 'toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.dataset.type = type;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2400);
  }

  function planKey(raw) {
    const s = (raw || '').toLowerCase();
    if (s.startsWith('basic')) return 'basic';
    if (s.startsWith('silver')) return 'silver';
    if (s.startsWith('gold')) return 'gold';
    if (s.startsWith('diamond')) return 'diamond';
    if (s.startsWith('trial')) return 'trial';
    return s;
  }

  async function gotoCheckout(plan) {
    const conf = await loadConfig();
    if (conf.mode !== 'links') {
      toast('Checkout not ready.', 'error');
      return;
    }
    const url = conf[plan];
    if (!url) {
      toast('Checkout link not configured yet.', 'error');
      return;
    }

    // front-end guard for one-time trial (device level)
    if (plan === 'trial' && localStorage.getItem('gc_trial_used') === '1') {
      toast('Trial already used on this device.', 'error');
      return;
    }

    window.location.href = url;
  }

  function wirePlanButtons() {
    // Plan card buttons (data-plan) and old data-choose pattern
    document.querySelectorAll('[data-plan], .plan .btn[data-choose]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const plan = planKey(btn.dataset.plan || btn.getAttribute('data-choose') || btn.getAttribute('data-tier'));
        if (!plan) return;
        gotoCheckout(plan);
      }, { passive: false });
    });

    // Shared details panel choose (if present)
    const panelChoose = document.getElementById('panelChoose');
    if (panelChoose) {
      panelChoose.addEventListener('click', (e) => {
        e.preventDefault();
        const plan = planKey(panelChoose.dataset.plan);
        if (!plan) { toast('Select a plan first.', 'error'); return; }
        gotoCheckout(plan);
      }, { passive: false });
    }
  }

  async function handleTrialBanner() {
    const conf = await loadConfig();
    const banner     = document.getElementById('trial-banner');
    const bannerCta  = document.getElementById('trial-cta');
    const bannerHide = document.getElementById('trial-hide');

    if (!banner || !bannerCta || !bannerHide) return;

    const trialConfigured = !!(conf.trial && conf.trial.startsWith('https://'));
    const trialUsed       = localStorage.getItem('gc_trial_used') === '1';

    if (!trialConfigured || trialUsed) {
      banner.hidden = true;
      return;
    }

    banner.hidden = false;

    bannerCta.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = conf.trial;
    }, { passive: false });

    bannerHide.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.setItem('gc_trial_used', '1');
      banner.hidden = true;
      toast('Trial hidden on this device.', 'info');
    }, { passive: false });
  }

  function handleReturnParams() {
    const params = new URLSearchParams(location.search);
    const status = params.get('status');
    const plan   = planKey(params.get('plan'));

    if (status === 'success') {
      toast('Payment successful. Thank you!', 'success');
      if (plan === 'trial') {
        localStorage.setItem('gc_trial_used', '1');
        const banner = document.getElementById('trial-banner');
        if (banner) banner.hidden = true;
      }
    } else if (status === 'cancelled') {
      toast('Checkout cancelled.', 'info');
    }
  }

  async function init() {
    await loadConfig();
    wirePlanButtons();
    await handleTrialBanner();
    handleReturnParams();
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
  Commerce.init();
});
