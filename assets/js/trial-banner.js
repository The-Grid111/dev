/* The Grid — Plans modals fed by JSON copy
   - Plan Details modal (buttons with .js-plan-details[data-plan])
   - Compare Plans modal (button .js-compare-plans)
*/
(function () {
  const PLAN_COPY_URL = '/assets/data/plan-details.json';
  const COMPARE_URL = '/assets/data/compare-table.json';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  let PLAN_COPY = null;
  let COMPARE_COPY = null;

  async function load(url) {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error('copy fetch failed: ' + url);
    return await res.json();
  }

  function ensurePlanModal() {
    let modal = $('#plan-modal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'plan-modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:70;display:none;';
    modal.innerHTML = `
      <div class="backdrop" style="position:absolute;inset:0;background:rgba(0,0,0,.5)"></div>
      <div class="panel" role="dialog" aria-modal="true" style="position:absolute;inset:auto 0 0 0;max-height:85vh;overflow:auto;background:#111;padding:24px 16px;border-top:1px solid rgba(255,214,102,.25)"></div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('.backdrop').addEventListener('click', () => hide(modal));
    return modal;
  }

  function ensureCompareModal() {
    let modal = $('#compare-modal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'compare-modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:70;display:none;';
    modal.innerHTML = `
      <div class="backdrop" style="position:absolute;inset:0;background:rgba(0,0,0,.5)"></div>
      <div class="panel" role="dialog" aria-modal="true" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(920px,92vw);max-height:85vh;overflow:auto;background:#111;padding:24px;border:1px solid rgba(255,214,102,.25);border-radius:12px"></div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('.backdrop').addEventListener('click', () => hide(modal));
    return modal;
  }

  function show(el) { el.style.display = 'block'; }
  function hide(el) { el.style.display = 'none'; }

  function renderPlan(planKey) {
    const copy = PLAN_COPY?.[planKey];
    if (!copy) return;
    const modal = ensurePlanModal();
    const panel = modal.querySelector('.panel');

    const bullets = copy.bullets.map(li => `<li>${li}</li>`).join('');
    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <h2 style="margin:0">${copy.title}</h2>
        <button aria-label="Close" style="background:transparent;border:none;font-size:24px;cursor:pointer">×</button>
      </div>
      <p style="opacity:.9;margin:.25rem 0 1rem">${copy.subtitle}</p>
      <ul style="display:grid;gap:.5rem 1rem;padding-left:1.1rem">${bullets}</ul>
      <div style="display:flex;gap:.5rem;margin-top:1rem">
        <a href="#" class="js-buy" data-plan="${planKey}" style="padding:.6rem 1rem;border-radius:10px;font-weight:700;background:linear-gradient(180deg,#FFD766,#D2A93A);box-shadow:0 0 0 1px rgba(255,214,102,.35) inset;text-decoration:none;color:#000">Continue to Checkout</a>
        <button class="close" style="padding:.6rem 1rem;border-radius:10px;border:1px solid rgba(255,214,102,.35);background:transparent;color:#fff">Close</button>
      </div>
    `;
    panel.querySelector('button.close')?.addEventListener('click', () => hide(modal));
    panel.querySelector('button[aria-label="Close"]')?.addEventListener('click', () => hide(modal));
    show(modal);
  }

  function renderCompare() {
    const copy = COMPARE_COPY;
    if (!copy) return;
    const modal = ensureCompareModal();
    const panel = modal.querySelector('.panel');

    const thead = ['Feature', ...copy.columns]
      .map(h => `<th style="text-align:left;padding:.5rem 0;border-bottom:1px solid rgba(255,214,102,.2)">${h}</th>`) 
      .join('');

    const rows = copy.rows.map(r => {
      const tds = [
        `<td style=\"padding:.5rem 0;white-space:nowrap\">${r.feature}</td>`,
        ...r.values.map(v => `<td style=\"padding:.5rem .75rem\">${v}</td>`)
      ].join('');
      return `<tr>${tds}</tr>`;
    }).join('');

    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <h2 style="margin:0">Compare Plans</h2>
        <button aria-label="Close" style="background:transparent;border:none;font-size:24px;cursor:pointer">×</button>
      </div>
      <div style="overflow:auto">
        <table style="width:100%;border-collapse:collapse"> 
          <thead><tr>${thead}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div style="display:flex;gap:.5rem;margin-top:1rem;flex-wrap:wrap">
        ${copy.columns.map(c => `<a href="#" class="js-choose" data-plan="${c.toLowerCase()}" style="padding:.6rem 1rem;border-radius:10px;font-weight:700;background:linear-gradient(180deg,#FFD766,#D2A93A);box-shadow:0 0 0 1px rgba(255,214,102,.35) inset;text-decoration:none;color:#000">Choose ${c}</a>`).join('')}
        <button class="close" style="padding:.6rem 1rem;border-radius:10px;border:1px solid rgba(255,214,102,.35);background:transparent;color:#fff">Close</button>
      </div>
    `;

    panel.querySelector('button.close')?.addEventListener('click', () => hide(modal));
    panel.querySelector('button[aria-label="Close"]')?.addEventListener('click', () => hide(modal));
    show(modal);
  }

  async function init() {
    try { PLAN_COPY = await load(PLAN_COPY_URL); } catch (_) {}
    try { COMPARE_COPY = await load(COMPARE_URL); } catch (_) {}

    // Details buttons
    $$('.js-plan-details').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const plan = (btn.dataset.plan || '').toLowerCase();
        renderPlan(plan);
      });
    });

    // Compare button
    $$('.js-compare-plans').forEach(btn => {
      btn.addEventListener('click', (e) => { e.preventDefault(); renderCompare(); });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
