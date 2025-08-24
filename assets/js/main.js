// MAIN UI INTERACTIONS FOR THE GRID
(function(){
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const root = document.documentElement;

  // ----- News bar memory -----
  (function news(){
    const BAR_KEY = "thegrid.news.dismissed.v1";
    const bar = $("#newsBar");
    if (!bar) return;
    if (localStorage.getItem(BAR_KEY) === "1"){ bar.style.display = "none"; return; }
    const close = bar.querySelector(".news__close");
    if (close){
      close.addEventListener("click", ()=>{ bar.style.display = "none"; localStorage.setItem(BAR_KEY, "1"); });
    }
  })();

  // ----- Theme & palette controls -----
  (function themeControls(){
    document.body.classList.add('body-grid'); // enable animated texture
    const savedTheme  = localStorage.getItem('thegrid.theme')  || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    const savedPreset = localStorage.getItem('thegrid.preset') || 'gold';
    root.setAttribute('data-theme', savedTheme);
    root.setAttribute('data-preset', savedPreset);

    const host = $("#customizeBody");
    if (!host || $("#uxThemeRow")) return;
    const row = document.createElement('div');
    row.id = "uxThemeRow";
    row.innerHTML = `
      <div class="control">
        <h4 class="eyeline">Theme & Palette</h4>
        <div class="row" style="margin:8px 0 4px">
          <button class="btn btn-outline" data-theme="light">Light</button>
          <button class="btn btn-outline" data-theme="dark">Dark</button>
          <span class="muted" style="margin-left:10px">Palette:</span>
          <button class="btn btn-ghost" data-preset="gold">Gold</button>
          <button class="btn btn-ghost" data-preset="arctic">Arctic</button>
          <button class="btn btn-ghost" data-preset="rose">Rose</button>
          <button class="btn btn-ghost" data-preset="emerald">Emerald</button>
        </div>
      </div>`;
    host.prepend(row);

    row.querySelectorAll('[data-theme]').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        const v = e.currentTarget.getAttribute('data-theme');
        root.setAttribute('data-theme', v);
        localStorage.setItem('thegrid.theme', v);
      });
    });
    row.querySelectorAll('[data-preset]').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        const v = e.currentTarget.getAttribute('data-preset');
        root.setAttribute('data-preset', v);
        localStorage.setItem('thegrid.preset', v);
      });
    });
  })();

  // ----- Customize panel open/close -----
  (function customizePanel(){
    const btn = $("#customizeBtn");
    const panel = $("#customizePanel");
    if (!btn || !panel) return;
    btn.onclick = () => panel.classList.add("show");
    panel.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", ()=> panel.classList.remove("show")));
  })();

  // ----- Plan panel helpers -----
  const planPanel = $("#planPanel");
  const planTitle = $("#panelTitle");
  const planBody  = $("#panelBody");
  const planChoose= $("#panelChoose");

  function openPanel(){ planPanel.classList.add("show"); }
  function closePanel(){ planPanel.classList.remove("show"); }
  planPanel?.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", closePanel));

  // Details buttons → show plan description
  $$(".details-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const tier = btn.getAttribute("data-tier");
      const desc = window.Commerce.describe(tier);
      planTitle.textContent = desc.title;
      planBody.innerHTML = `
        <div class="eyeline"><h4>${desc.title}</h4></div>
        <p class="muted" style="margin-top:2px">${desc.subtitle}</p>
        <ul style="margin-top:8px">${desc.points.map(p=>`<li>${p}</li>`).join("")}</ul>
      `;
      planChoose.onclick = ()=> window.Commerce.open(tier);
      planChoose.style.display = "";
      openPanel();
    });
  });

  // Compare plans → table view
  (function comparePlans(){
    const compareBtn = $("#compareBtn");
    if (!compareBtn) return;
    compareBtn.addEventListener("click", ()=>{
      planTitle.textContent = "Compare Plans";
      planBody.innerHTML = `
        <div class="eyeline"><h4>What’s included</h4></div>
        <div style="overflow:auto;max-height:70vh">
        <table class="compare">
          <thead>
            <tr>
              <th>Feature</th>
              <th class="plan">Basic</th>
              <th class="plan">Silver</th>
              <th class="plan">Gold</th>
              <th class="plan">Diamond</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Site + Customize</td><td class="yes">✓</td><td class="yes">✓</td><td class="yes">✓</td><td class="yes">✓</td></tr>
            <tr><td>Effects & metallic presets</td><td>Starter</td><td class="yes">Advanced</td><td class="yes">All</td><td class="yes">All</td></tr>
            <tr><td>Stacks & Setups (CapCut, Runway, ElevenLabs…)</td><td>Starter</td><td>Pro</td><td>Pro+</td><td>All</td></tr>
            <tr><td>Library access</td><td>Samples</td><td>Guides</td><td>Full (Pro)</td><td>All + Private</td></tr>
            <tr><td>Automation recipes</td><td>—</td><td>—</td><td class="yes">Included</td><td class="yes">Included</td></tr>
            <tr><td>Priority support</td><td>48h</td><td>24h</td><td>Hotfix</td><td>Roadmap</td></tr>
            <tr><td>Studio Pack</td><td class="soon">—</td><td class="soon">—</td><td class="soon">—</td><td class="yes">Included</td></tr>
            <tr><td>Automation Pack</td><td class="soon">—</td><td class="soon">—</td><td class="soon">—</td><td class="yes">Included</td></tr>
          </tbody>
        </table>
        </div>`;
      planChoose.style.display = "none";
      openPanel();
    });
  })();

  // Choose buttons → Stripe
  $$('[data-plan]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const plan = btn.getAttribute('data-plan');
      window.Commerce.open(plan);
    });
  });

  // Show "Manage subscription" when a Stripe Customer Portal link is configured
  (function showManageIfConfigured(){
    const url = (window.Commerce && window.Commerce.portalUrl && window.Commerce.portalUrl()) || "";
    if (!url) return;
    const wrap = document.getElementById('manageWrap');
    const a = document.getElementById('manageSub');
    if (wrap && a){ a.href = url; wrap.style.display = "block"; }
  })();
})();
