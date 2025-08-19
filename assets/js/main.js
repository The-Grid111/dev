/* ===== Utilities ===== */
const $ = (s, sc = document) => sc.querySelector(s);
const $$ = (s, sc = document) => [...sc.querySelectorAll(s)];
const fmtCurrency = (n, cur="GBP") =>
  new Intl.NumberFormat("en-GB",{style:"currency",currency:cur,maximumFractionDigits:0}).format(n);

/* ===== Greeting ===== */
(() => {
  const h = new Date().getHours();
  const part = h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
  $("#greeting").textContent = `Good ${part} — THE GRID`;
})();

/* ===== Customize Panel ===== */
const customize = {
  open(){ $("#customizePanel").showModal(); },
  close(){ $("#customizePanel").close(); },
  load(){
    try{
      const s = JSON.parse(localStorage.getItem("grid:style")||"{}");
      if(!Object.keys(s).length) return;
      for(const [k,v] of Object.entries(s)){
        document.documentElement.style.setProperty(`--${k}`, v);
      }
    }catch{}
  },
  save(){
    const style = {
      "accent": $("#cAccent").value,
      "accent-2": $("#cAccent2").value,
      "text": $("#cText").value,
      "soft": $("#cSoft").value,
      "card": $("#cCard").value,
      "panel": $("#cPanel").value,
      "bg-a": $("#cBgA").value,
      "bg-b": $("#cBgB").value,
      "radius": $("#rRadius").value+"px",
      "glow": $("#rGlow").value,
      "font": $("#rFont").value+"px",
      "space": $("#rSpace").value+"px"
    };
    localStorage.setItem("grid:style", JSON.stringify(style));
    customize.apply(style);
  },
  apply(style){
    for(const [k,v] of Object.entries(style)){
      document.documentElement.style.setProperty(`--${k}`, v);
    }
  },
  reset(){
    localStorage.removeItem("grid:style");
    location.reload();
  }
};
$("#openCustomize").addEventListener("click", customize.open);
$("#closeCustomize").addEventListener("click", customize.close);
$("#savePrefs").addEventListener("click", customize.save);
$("#resetPrefs").addEventListener("click", customize.reset);
customize.load();

/* ===== Hero controls ===== */
(() => {
  const v = $("#heroVideo");
  const btn = $("#playHero");
  btn.addEventListener("click", ()=> {
    if(v.paused){ v.play(); } else { v.pause(); }
  });
})();

/* ===== Data loaders ===== */
async function getJSON(path){
  const res = await fetch(path, {cache:"no-store"});
  if(!res.ok) throw new Error(`Failed ${path}`);
  return res.json();
}

/* Build plan cards */
async function buildPlans(){
  const plans = await getJSON("assets/data/plans.json");
  const grid = $("#plansGrid");
  grid.innerHTML = "";
  plans.forEach(p=>{
    const li = document.createElement("article");
    li.className = "plan";
    li.innerHTML = `
      <div class="plan__head">
        <div class="plan__price">${fmtCurrency(p.price)}/mo</div>
        <span class="badge">${p.tier.toUpperCase()}</span>
      </div>
      <ul>${p.features.map(f=>`<li>${f}</li>`).join("")}</ul>
      <div class="plan__cta">
        <a class="btn btn--accent" href="${p.pay.url}" target="_blank" rel="noopener">Choose</a>
        <button class="btn btn--ghost" data-details='${JSON.stringify(p)}'>Details</button>
      </div>`;
    grid.appendChild(li);
    li.querySelector("button").addEventListener("click", (e)=>{
      const d = JSON.parse(e.currentTarget.dataset.details);
      alert(`${d.title}\n\nWho it’s for:\n${d.who}\n\nWhat you get:\n- ${d.features.join("\n- ")}`);
    });
  });
}

/* Build services */
async function buildServices(){
  const services = await getJSON("assets/data/services.json");
  const grid = $("#servicesGrid");
  grid.innerHTML = "";
  services.forEach(s=>{
    const el = document.createElement("article");
    el.className = "service";
    el.innerHTML = `
      <div class="plan__head">
        <div class="service__price">${fmtCurrency(s.price)}</div>
        <span class="badge">${s.badge}</span>
      </div>
      <p>${s.desc}</p>
      <div class="service__cta">
        <a class="btn btn--accent" target="_blank" rel="noopener" href="${s.pay.url}">${s.cta}</a>
      </div>`;
    grid.appendChild(el);
  });
}

/* Library + Showcase */
async function buildLibrary(){
  const [vjson, ij] = await Promise.all([
    getJSON("assets/videos/manifest.json").catch(()=>({groups:{}})),
    getJSON("assets/images/manifest.json").catch(()=>({groups:{}}))
  ]);
  const groups = {
    "Hero": vjson.groups?.hero || [],
    "Reels 9:16": vjson.groups?.reels_9x16 || [],
    "Reels 16:9": vjson.groups?.reels_16x9 || [],
    "Backgrounds": ij.groups?.backgrounds || [],
    "Logos": ij.groups?.logos || [],
    "Images": ij.groups?.images || [],
    "Extras": ij.groups?.extras || []
  };

  const chips = $("#libraryChips");
  const grid = $("#libraryGrid");
  chips.innerHTML = ""; grid.innerHTML = "";
  const names = Object.keys(groups);
  let active = names[0];

  function paintChips(){
    chips.innerHTML = "";
    names.forEach(n=>{
      const b = document.createElement("button");
      b.textContent = `${n}${groups[n].length?"" : "0"}`;
      b.setAttribute("aria-pressed", String(n===active));
      b.addEventListener("click", ()=>{ active=n; paintChips(); paintGrid(); });
      chips.appendChild(b);
    });
  }
  function mediaThumb(item){
    const ext = item.src.split(".").pop().toLowerCase();
    const wrap = document.createElement("div");
    wrap.className = "thumb";
    if(["mp4","webm"].includes(ext)){
      wrap.innerHTML = `<video muted preload="metadata" src="${item.src}"></video><div class="thumb__cap">${item.name||item.src}</div>`;
      wrap.addEventListener("mouseenter",()=> wrap.querySelector("video").play());
      wrap.addEventListener("mouseleave",()=> wrap.querySelector("video").pause());
    } else {
      wrap.innerHTML = `<img loading="lazy" src="${item.src}" alt=""><div class="thumb__cap">${item.name||item.src}</div>`;
    }
    wrap.addEventListener("click", ()=>{
      // Set hero
      const v = $("#heroVideo");
      if(["mp4","webm"].includes(ext)){
        v.src = item.src; v.play().catch(()=>{});
      } else {
        v.pause(); v.removeAttribute("src"); v.load();
        v.setAttribute("poster", item.src);
      }
      confetti && confetti({particles:60});
      window.scrollTo({top:0, behavior:"smooth"});
    });
    return wrap;
  }
  function paintGrid(){
    grid.innerHTML = "";
    groups[active].forEach(it=> grid.appendChild(mediaThumb(it)));
  }
  paintChips(); paintGrid();

  // Showcase = first 6 mixed
  const featured = [...(vjson.featured||[]), ...(ij.featured||[])].slice(0,6);
  const show = $("#showcaseGrid");
  show.innerHTML = "";
  featured.forEach(it => show.appendChild(mediaThumb(it)));
}

/* Hero source dropdown (videos only) */
async function buildHeroSelect(){
  const vjson = await getJSON("assets/videos/manifest.json").catch(()=>({groups:{}}));
  const opts = (vjson.groups?.hero||[]).concat(vjson.groups?.reels_16x9||[]);
  const sel = $("#heroSource");
  sel.innerHTML = "";
  opts.forEach(o=>{
    const op = document.createElement("option");
    op.value = o.src; op.textContent = o.name || o.src;
    sel.appendChild(op);
  });
  sel.addEventListener("change", e=>{
    const v = $("#heroVideo"); v.src = e.target.value; v.play().catch(()=>{});
  });
}

/* Boot */
(async function boot(){
  await Promise.all([buildLibrary(), buildHeroSelect(), buildPlans(), buildServices()]);
})();
