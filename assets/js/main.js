/* THE GRID — main.js (FULL REDO)
   - Wires buttons (Join/Customize/See Pricing/Open Library)
   - Smooth scroll to sections
   - Loads manifests robustly (works from / and /dev/)
   - Initializes hero video (falls back gracefully)
   - Populates Library counts
   - Tiny diagnostics via console
*/

(() => {
  // ---------- Utilities
  const qs  = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => [...r.querySelectorAll(s)];
  const log = (...a) => console.log("[GRID]", ...a);

  const scrollToEl = (el) => {
    if (!el) return;
    try {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      const y = el.getBoundingClientRect().top + window.pageYOffset - 12;
      window.scrollTo(0, y);
    }
  };

  // ---------- DOM
  const dom = {
    // hero
    heroWrap:   qs("[data-hero]") || qs("#hero"),
    heroVideo:  qs("[data-hero-video]") || qs("#heroVideo"),
    heroSource: qs("[data-hero-source]") || qs("#heroSource"),

    // buttons
    btnCustomize:  qs('[data-action="customize"]') || qs("#btn-customize"),
    btnJoin:       qs('[data-action="join"]')       || qs("#btn-join"),
    btnOpenLib:    qs('[data-action="open-library"]') || qs("#btn-open-library"),
    btnSeePricing: qs('[data-action="see-pricing"]')   || qs("#btn-see-pricing"),

    // sections
    secLibrary: qs('[data-section="library"]') || qs("#library"),
    secPricing: qs('[data-section="pricing"]') || qs("#pricing") || qs("#plans"),
    secContact: qs('[data-section="contact"]') || qs("#contact"),

    // library chips/counts (optional)
    countHero:        qs('[data-count="hero"]'),
    countReels916:    qs('[data-count="reels-916"]'),
    countReels169:    qs('[data-count="reels-169"]'),
    countBackgrounds: qs('[data-count="backgrounds"]'),
    countLogos:       qs('[data-count="logos"]'),
    countImages:      qs('[data-count="images"]'),

    // choose buttons inside plans (rendered by commerce.js)
    planChooseBtns: () => qsa(".plan-choose,[data-plan]")
  };

  // ---------- Paths (work for / or /dev/)
  const PATHS = [
    "./assets/",      // site at /
    "./dev/assets/",  // assets nested under /dev
    "../assets/"      // when index is inside /dev
  ];
  const urlTry = (subpath) => PATHS.map(p => p + subpath);

  const fetchJSONFirstOK = async (candidates) => {
    for (const u of candidates) {
      try {
        const r = await fetch(u, { cache: "no-store" });
        if (r.ok) { log("Loaded", u); return await r.json(); }
      } catch(e) { /* try next */ }
    }
    return null;
  };

  // ---------- Hero setup
  const pickHeroFromVideoManifest = (vman) => {
    if (!vman || !Array.isArray(vman.items)) return null;

    // Prefer explicit hero item
    const byTag = vman.items.find(it =>
      (it.tags && (it.tags.includes("hero") || it.tags.includes("HERO"))) ||
      /hero/i.test(it.name || it.file || "")
    );
    if (byTag) return byTag.file || byTag.src;

    // Otherwise first mp4
    const first = vman.items.find(it => (it.file || it.src || "").toLowerCase().endsWith(".mp4"));
    return first ? (first.file || first.src) : null;
  };

  const setHeroVideo = (src) => {
    if (!dom.heroVideo || !dom.heroSource) return;
    if (!src) return;

    dom.heroVideo.pause();
    dom.heroSource.setAttribute("src", src);
    dom.heroVideo.load();
    // Autoplay muted on iOS is allowed if muted + playsinline
    dom.heroVideo.muted = true;
    dom.heroVideo.setAttribute("playsinline", "");
    dom.heroVideo.play().catch(() => {
      // user gesture will be required; show the native play button
      dom.heroVideo.controls = true;
    });
  };

  const initHero = async () => {
    // Try video manifest
    const vman = await fetchJSONFirstOK(urlTry("videos/manifest.json"));
    let heroSrc = null;

    if (vman) {
      const choice = pickHeroFromVideoManifest(vman);
      if (choice) heroSrc = choice.startsWith("http") ? choice : (PATHS[0] + "videos/" + choice);
    }

    // Fallback to a known local file if the manifest has nothing
    if (!heroSrc) {
      for (const base of PATHS) {
        const guess = base + "videos/hero_1.mp4";
        try {
          const r = await fetch(guess, { method: "HEAD", cache: "no-store" });
          if (r.ok) { heroSrc = guess; break; }
        } catch {}
      }
    }

    if (heroSrc) {
      setHeroVideo(heroSrc);
      dom.heroWrap && dom.heroWrap.setAttribute("data-has-hero", "1");
    } else {
      log("No hero video found; placeholder remains.");
    }
  };

  // ---------- Library counts
  const setText = (node, v) => { if (node) node.textContent = String(v); };

  const initLibrary = async () => {
    // videos
    const vman = await fetchJSONFirstOK(urlTry("videos/manifest.json"));
    if (vman && Array.isArray(vman.items)) {
      const count = (fn) => vman.items.filter(fn).length;
      setText(dom.countHero,        count(it => /hero/i.test(it.name||it.file||"") || (it.tags||[]).includes("hero")));
      setText(dom.countReels916,    count(it => /9:?16/.test((it.aspect||it.ratio||"").toString())));
      setText(dom.countReels169,    count(it => /16:?9/.test((it.aspect||it.ratio||"").toString())));
      setText(dom.countBackgrounds, count(it => (it.tags||[]).includes("background")));
    }

    // images
    const iman = await fetchJSONFirstOK(urlTry("images/manifest.json"));
    if (iman && Array.isArray(iman.items)) {
      const count = (fn) => iman.items.filter(fn).length;
      setText(dom.countLogos,  count(it => /logo/i.test(it.name||it.file||"") || (it.tags||[]).includes("logo")));
      setText(dom.countImages, iman.items.length);
    }
  };

  // ---------- Buttons & plans
  const wireButtons = () => {
    // Customize (toast)
    dom.btnCustomize && dom.btnCustomize.addEventListener("click", (e) => {
      e.preventDefault();
      alert("Design Panel coming back next pass (saved per-device).");
    });

    // Join Now -> Contact
    dom.btnJoin && dom.btnJoin.addEventListener("click", (e) => {
      e.preventDefault();
      scrollToEl(dom.secContact || document.body);
    });

    // See Pricing -> Plans
    dom.btnSeePricing && dom.btnSeePricing.addEventListener("click", (e) => {
      e.preventDefault();
      scrollToEl(dom.secPricing || document.body);
    });

    // Open Library -> Library
    dom.btnOpenLib && dom.btnOpenLib.addEventListener("click", (e) => {
      e.preventDefault();
      scrollToEl(dom.secLibrary || document.body);
    });

    // Plans choose (delegated after pricing render)
    const hookPlanButtons = () => {
      dom.planChooseBtns().forEach(btn => {
        btn.addEventListener("click", (ev) => {
          ev.preventDefault();
          const plan = btn.dataset.plan || "BASIC";
          scrollToEl(dom.secContact || document.body);
          console.log(`[GRID] Plan selected: ${plan}`);
        }, { once: false });
      });
    };

    // re-hook after pricing renders
    document.addEventListener("grid:pricing-rendered", hookPlanButtons, { once: true });
  };

  // ---------- Boot
  window.addEventListener("DOMContentLoaded", () => {
    wireButtons();
    initHero();
    initLibrary();
  });
})();
