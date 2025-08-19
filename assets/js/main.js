(function () {
  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  // 1) Time-based greeting
  const hr = new Date().getHours();
  const daypart = hr < 12 ? "morning" : hr < 17 ? "afternoon" : "evening";
  $("#greeting").textContent = `Good ${daypart} — THE GRID`;

  // 2) Load owner settings (if present) to set theme + hero
  fetch("assets/data/owner_core_save_v1.2.json")
    .then(r => r.ok ? r.json() : null)
    .then(cfg => {
      if (!cfg) return;
      // Apply theme to CSS variables
      const d = cfg.design || {};
      const root = document.documentElement.style;
      if (d.accent) root.setProperty("--accent", d.accent);
      if (d.accentSecondary) root.setProperty("--accent-2", d.accentSecondary);
      if (d.text) root.setProperty("--txt", d.text);
      if (d.softText) root.setProperty("--txt-soft", d.softText);
      if (d.cardSurface) root.setProperty("--card", d.cardSurface);
      if (d.panelSurface) root.setProperty("--panel", d.panelSurface);
      if (d.bgA) root.setProperty("--bg-a", d.bgA);
      if (d.bgB) root.setProperty("--bg-b", d.bgB);
      if (d.cardRadius != null) root.setProperty("--radius", d.cardRadius + "px");
      if (d.borderGlow != null) root.setProperty("--glow", d.borderGlow);
      if (d.fontScale != null) root.setProperty("--fs", d.fontScale);
      if (d.spacingScale != null) root.setProperty("--space", d.spacingScale);

      if (cfg.brand?.tagline) $("#tagline").textContent = cfg.brand.tagline;

      // Hero media
      const heroVid = $("#heroVideo");
      const heroFallback = $("#heroFallback");
      const src = cfg.hero?.source || "assets/videos/hero_1.mp4";
      heroVid.src = src;
      heroVid.onloadeddata = () => {
        heroFallback.style.display = "none";
        heroVid.style.display = "block";
        heroVid.play().catch(()=>{ /* autoplay may be blocked; leave poster */ });
      };
    })
    .catch(()=>{ /* non-fatal */ });

  // 3) Spin the logo gently if CSS is loaded
  $("#brandLogo").classList.add("spin-slow");

  // 4) Build Library tabs and grid from manifests (if they exist)
  const manifests = [
    "assets/videos/manifest.json",
    "assets/images/manifest.json"
  ];
  Promise.all(
    manifests.map(url =>
      fetch(url).then(r => r.ok ? r.json() : { items: [] }).catch(()=>({items:[]}))
    )
  ).then(([vids, imgs]) => {
    const all = [...(vids.items||[]), ...(imgs.items||[])];
    const cats = new Map(); // category -> items
    all.forEach(it => {
      const cat = it.category || "Misc";
      if (!cats.has(cat)) cats.set(cat, []);
      cats.get(cat).push(it);
    });

    // Tabs
    const tabs = $("#libraryTabs");
    tabs.innerHTML = "";
    for (const cat of cats.keys()) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip";
      chip.textContent = `${cat}${cats.get(cat).length}`;
      chip.addEventListener("click", () => renderGrid(cat));
      tabs.appendChild(chip);
    }

    // Default tab
    const first = [...cats.keys()][0];
    if (first) renderGrid(first);

    function renderGrid(category){
      const list = cats.get(category) || [];
      const grid = $("#libraryGrid");
      grid.innerHTML = "";
      list.forEach(it => {
        const card = document.createElement("a");
        card.href = "#";
        card.className = "tile";
        const isVideo = /\.mp4$/i.test(it.src || "");
        card.innerHTML = `
          ${isVideo
            ? `<video class="thumb" src="${it.src}" muted playsinline></video>`
            : `<img class="thumb" src="${it.src}" alt="">`
          }
          <div style="padding:10px">${it.title || (it.src || "").split("/").pop()}</div>
        `;
        card.addEventListener("click", (e)=>{
          e.preventDefault();
          setHero(it.src);
          window.scrollTo({top:0,behavior:"smooth"});
        });
        grid.appendChild(card);
      });
    }

    function setHero(src){
      const heroVid = $("#heroVideo");
      const heroFallback = $("#heroFallback");
      heroFallback.style.display = "none";
      heroVid.style.display = "block";
      heroVid.src = src;
      heroVid.play().catch(()=>{});
    }
  });

  // 5) Plans (simple defaults; replace later with your data/plans.json if you want)
  const plans = [
    {name:"BASIC", price:"£9/mo", perks:["Starter templates","Library access","Email support"]},
    {name:"SILVER", price:"£29/mo", perks:["Advanced effects","Priority support"]},
    {name:"GOLD", price:"£49/mo", perks:["Full customization","Admin toolkit","Onboarding"]},
    {name:"DIAMOND", price:"£99/mo", perks:["Custom pipelines","Hands-on help","Priority turnaround"]},
  ];
  const wrap = $("#plansWrap");
  wrap.innerHTML = plans.map(p => `
    <div class="plan">
      <div class="price">${p.price}</div>
      <div style="font-weight:700; margin-bottom:.3em">${p.name}</div>
      <ul style="margin:.2em 0 .8em .9em">${p.perks.map(x=>`<li>${x}</li>`).join("")}</ul>
      <button class="btn glow" type="button">Choose</button>
    </div>
  `).join("");

})();
