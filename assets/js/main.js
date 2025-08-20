(function () {
  // Helpers
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];

  // Greeting
  const hours = new Date().getHours();
  const greeting =
    hours < 12 ? "Good morning" :
    hours < 17 ? "Good afternoon" :
    "Good evening";
  const brandGreeting = $("#brandGreeting");
  if (brandGreeting) brandGreeting.textContent = `${greeting} — THE GRID`;

  // Buttons
  $("#btnCustomize")?.addEventListener("click", () => {
    alert("Design Panel coming back next pass (saved per-device).");
  });
  $("#btnOpenLibrary")?.addEventListener("click", e => {
    if (location.hash !== "#library") location.hash = "library";
  });
  $("#btnSeePricing")?.addEventListener("click", e => {
    if (location.hash !== "#plans") location.hash = "plans";
  });
  $$(".plan-choose").forEach(b =>
    b.addEventListener("click", () => alert(`Plan selected: ${b.dataset.plan}`))
  );

  // HERO loader: prefer assets/gc_spin.mp4 → assets/videos/hero_1.mp4 → image fallback
  async function loadHero() {
    const frame = $("#heroFrame");
    const loading = $("#heroLoading");
    if (!frame) return;

    const candidates = [
      {type:"video", src:"assets/gc_spin.mp4"},
      {type:"video", src:"assets/videos/hero_1.mp4"},
      {type:"image", src:"assets/images/hero_1.jpg"}
    ];

    for (const c of candidates) {
      try {
        const ok = await fetch(c.src, {method:"HEAD"}).then(r=>r.ok).catch(()=>false);
        if (!ok) continue;

        if (c.type === "video") {
          const v = document.createElement("video");
          v.src = c.src;
          v.autoplay = true;
          v.loop = true;
          v.muted = true;
          v.playsInline = true;
          v.setAttribute("playsinline","true");
          v.style.display = "block";
          frame.innerHTML = "";
          frame.appendChild(v);
          return;
        } else {
          const img = document.createElement("img");
          img.src = c.src;
          img.alt = "Hero";
          frame.innerHTML = "";
          frame.appendChild(img);
          return;
        }
      } catch (_) {}
    }

    // If none found
    loading.textContent = "Add a hero to assets/gc_spin.mp4 or assets/videos/hero_1.mp4";
  }

  // LIBRARY loader (videos + images manifests)
  async function loadLibrary() {
    const grid = $("#libraryGrid");
    const empty = $("#libraryEmpty");
    if (!grid) return;

    const sources = [
      "assets/videos/manifest.json",
      "assets/images/manifest.json"
    ];

    let items = [];
    for (const src of sources) {
      try {
        const res = await fetch(src, {cache:"no-store"});
        if (!res.ok) continue;
        const data = await res.json();
        if (Array.isArray(data.items)) items = items.concat(data.items);
      } catch (e) { /* ignore */
      }
    }

    // If still empty, try sensible defaults by scanning known files
    if (items.length === 0) {
      // fallback placeholders (use what you already have in repo)
      items = [
        { type:"video", src:"assets/videos/hero_1.mp4", title:"Hero clip" },
        { type:"image", src:"assets/images/hero_1.jpg", title:"Hero still" }
      ];
    }

    grid.innerHTML = "";
    let rendered = 0;
    items.forEach(it => {
      if (!it || !it.src) return;
      const card = document.createElement("div");
      card.className = "library-card";
      card.innerHTML = `
        <div class="card-thumb">
          ${it.type === "video"
            ? `<video src="${it.src}" muted loop playsinline></video>`
            : `<img src="${it.src}" alt="${(it.title||'Media')}" />`}
        </div>
        <div class="card-meta">
          <span>${it.title || (it.type==='video'?'Video':'Image')}</span>
        </div>
      `;
      grid.appendChild(card);
      rendered++;
    });

    if (rendered === 0) {
      empty.classList.remove("hidden");
    } else {
      empty.classList.add("hidden");
    }

    // Tabs filter
    $$(".library-tabs .chip").forEach(chip => {
      chip.addEventListener("click", () => {
        $$(".library-tabs .chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        const filter = chip.dataset.filter;
        $$(".library-card").forEach(card => {
          const isVideo = !!card.querySelector("video");
          const type = isVideo ? "video" : "image";
          card.style.display =
            filter === "all" || filter === type ? "" : "none";
        });
      });
    });
  }

  // SHOWCASE (first 6 items across manifests)
  async function loadShowcase() {
    const strip = $("#showcaseStrip");
    if (!strip) return;

    const srcs = [
      "assets/videos/manifest.json",
      "assets/images/manifest.json"
    ];

    let items = [];
    for (const s of srcs) {
      try {
        const r = await fetch(s, {cache:"no-store"});
        if (!r.ok) continue;
        const d = await r.json();
        if (Array.isArray(d.items)) items = items.concat(d.items);
      } catch (_) {}
    }

    if (items.length === 0) {
      strip.innerHTML = `<div class="muted">Add items to manifests to fill the showcase.</div>`;
      return;
    }

    strip.innerHTML = "";
    items.slice(0, 6).forEach(it => {
      const box = document.createElement("div");
      box.className = "library-card";
      box.style.minWidth = "220px";
      box.innerHTML = `
        <div class="card-thumb">
          ${it.type === "video"
            ? `<video src="${it.src}" muted loop playsinline></video>`
            : `<img src="${it.src}" alt="${(it.title||'Media')}" />`}
        </div>
        <div class="card-meta"><span>${it.title || ''}</span></div>
      `;
      strip.appendChild(box);
    });
  }

  // Contact (demo only)
  $("#contactForm")?.addEventListener("submit", e => {
    e.preventDefault();
    alert("Thanks — message captured locally. Hook this up to your email/API next.");
  });

  // Boot
  loadHero();
  loadLibrary();
  loadShowcase();
})();
