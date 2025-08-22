/* ===== THE GRID – Main interactions (stable baseline) ===== */

(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- State ---------- */
  const state = {
    heroSrc: null,        // current hero media src
    heroType: null,       // 'video' | 'image'
    plans: null,          // loaded from JSON
    services: null,       // loaded from JSON
  };

  /* ---------- Utils ---------- */
  async function loadJSON(paths) {
    for (const url of paths) {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (res.ok) return await res.json();
      } catch (e) {}
    }
    return null;
  }

  function smoothScrollTo(id) {
    const el = $(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ---------- Hero: mount / switch ---------- */
  function ensureHeroMediaMount() {
    // Create a media container inside the first .hero section if none exists
    let heroSection = $(".section.hero .container");
    if (!heroSection) return;

    let mount = $("#hero-media");
    if (!mount) {
      mount = document.createElement("div");
      mount.id = "hero-media";
      mount.style.marginTop = "14px";
      mount.style.borderRadius = "16px";
      mount.style.overflow = "hidden";
      mount.style.boxShadow =
        "0 0 0 1px #1b2130 inset, 0 20px 60px rgba(0,0,0,.45)";
      heroSection.appendChild(mount);
    }
    return mount;
  }

  function setHeroMedia(src, kind) {
    state.heroSrc = src;
    state.heroType = kind;

    const mount = ensureHeroMediaMount();
    if (!mount) return;

    mount.innerHTML = "";
    if (kind === "video") {
      const v = document.createElement("video");
      v.src = src;
      v.controls = true;
      v.playsInline = true;
      v.muted = false;
      v.style.width = "100%";
      v.style.height = "min(62vw, 420px)";
      v.style.objectFit = "cover";
      mount.appendChild(v);
    } else {
      const img = document.createElement("img");
      img.src = src;
      img.alt = "Hero visual";
      img.style.width = "100%";
      img.style.height = "min(62vw, 420px)";
      img.style.objectFit = "cover";
      mount.appendChild(img);
    }
  }

  /* ---------- Modal controller ---------- */
  const modal = (function () {
    const root = $("#details-modal");
    const dialog = $(".tg-modal__dialog", root);
    const btnCloseList = $$("[data-close]", root);
    const btnPrimary = $("#tg-modal-choose");
    const title = $("#tg-modal-title");
    const kicker = $("#tg-modal-kicker");
    const desc = $("#tg-modal-desc");
    const list = $("#tg-modal-list");

    function open(opts) {
      // opts: { kicker, title, desc, bullets[], cta, onChoose }
      if (!root) return;
      kicker.textContent = opts.kicker || "Details";
      title.textContent = opts.title || "";
      desc.textContent = opts.desc || "";
      list.innerHTML = "";
      (opts.bullets || []).forEach((b) => {
        const li = document.createElement("li");
        li.textContent = b;
        list.appendChild(li);
      });
      btnPrimary.textContent = opts.cta || "Choose";
      btnPrimary.onclick = () => {
        try { opts.onChoose && opts.onChoose(); } catch (e) {}
        close();
      };
      root.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      setTimeout(() => dialog?.focus(), 10);
    }

    function close() {
      if (!root) return;
      root.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    btnCloseList.forEach((b) => (b.onclick = close));
    root?.addEventListener("click", (e) => {
      if (e.target === root || e.target.classList.contains("tg-modal__backdrop")) close();
    });

    return { open, close };
  })();

  /* ---------- Customize / Join lightweight panels ---------- */
  function openCustomizePanel() {
    modal.open({
      kicker: "Customize",
      title: "Design Controls",
      desc:
        "Use the built-in Design Panel (coming right below) to tweak accent colors, text, radius, and hero media. " +
        "For now, library tiles instantly set the hero; full panel toggles arrive in the next pass.",
      bullets: [
        "White & Gold aesthetic baseline",
        "Click any Library tile to preview as hero",
        "One-file updates or Issue patches — your choice",
      ],
      cta: "Got it",
    });
  }

  function openJoinPanel() {
    modal.open({
      kicker: "Join",
      title: "Membership & Billing",
      desc:
        "Pick a plan in Pricing. We’ll email you onboarding details and tool access immediately after checkout.",
      bullets: [
        "7-day refund, no lock-in",
        "Upgrade/downgrade anytime",
        "Email support from gridcoresystems@gmail.com",
      ],
      cta: "OK",
    });
  }

  /* ---------- Data: load plans/services (from assets first, then /data) ---------- */
  async function ensureCatalog() {
    if (!state.plans) {
      state.plans = await loadJSON([
        "assets/data/plans.json",
        "data/plans.json",
      ]);
    }
    if (!state.services) {
      state.services = await loadJSON([
        "assets/data/services.json",
        "data/services.json",
      ]);
    }
  }

  function findEntry(key) {
    if (!key) return null;
    const k = String(key).toLowerCase();
    let hit =
      (state.plans?.plans || []).find((p) => String(p.key).toLowerCase() === k) ||
      (state.services?.services || []).find((s) => String(s.key).toLowerCase() === k);
    return hit || null;
  }

  /* ---------- Wire up Library tiles ---------- */
  function bindLibrary() {
    $$(".tile[data-library]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const kind = btn.getAttribute("data-library"); // 'video' | 'image'
        const src = btn.getAttribute("data-src");
        if (!src || !kind) return;
        setHeroMedia(src, kind);
        // Gentle feedback
        btn.style.transform = "translateY(-1px)";
        setTimeout(() => (btn.style.transform = ""), 120);
      });
    });
  }

  /* ---------- Wire up Pricing buttons ---------- */
  function bindPricing() {
    // Choose
    $$(".plan-choose").forEach((b) => {
      b.addEventListener("click", async (e) => {
        e.preventDefault();
        const key = b.getAttribute("data-plan");
        await ensureCatalog();
        const entry = findEntry(key);
        const title = entry?.title || (key ? key.toUpperCase() : "Plan");
        modal.open({
          kicker: "Checkout",
          title: `Proceed with ${title}`,
          desc:
            "In the full build this opens your checkout gateway. For now we confirm your choice.",
          bullets: entry?.features || [],
          cta: "Confirm",
          onChoose() {
            alert(`Selected: ${title}`);
          },
        });
      });
    });

    // Details (open modal without navigating away)
    $$(".plan-details").forEach((b) => {
      b.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const key = b.getAttribute("data-plan");
        await ensureCatalog();
        const entry = findEntry(key);
        const title = entry?.title || (key ? key.toUpperCase() : "Details");
        modal.open({
          kicker: "Plan Details",
          title,
          desc: entry?.description || "Full breakdown of what’s included.",
          bullets: entry?.features || [],
          cta: "Choose",
          onChoose() {
            alert(`Chosen: ${title}`);
          },
        });
      });
    });
  }

  /* ---------- Top nav actions ---------- */
  function bindNav() {
    $("#open-customize")?.addEventListener("click", (e) => {
      e.preventDefault();
      openCustomizePanel();
    });
    $("#open-join")?.addEventListener("click", (e) => {
      e.preventDefault();
      openJoinPanel();
    });

    // Smooth scroll for internal anchors
    $$(".nav a[href^='#']").forEach((a) => {
      a.addEventListener("click", (e) => {
        const href = a.getAttribute("href");
        if (!href || href === "#") return;
        if (href.startsWith("#")) {
          e.preventDefault();
          smoothScrollTo(href);
        }
      });
    });
  }

  /* ---------- Boot ---------- */
  function boot() {
    bindNav();
    bindLibrary();
    bindPricing();

    // Initial hero default (if present) — prefer video
    const defaultVideo = "assets/videos/hero_1.mp4";
    const defaultImage = "assets/images/hero_1.jpg";
    setHeroMedia(defaultVideo, "video");
    // fallback image if video tag fails to load (e.g., autoplay policy)
    const mount = $("#hero-media");
    if (mount) {
      mount.querySelector("video")?.addEventListener("error", () => {
        setHeroMedia(defaultImage, "image");
      });
    }
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
