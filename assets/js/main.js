/* assets/js/main.js — SAFE, DEFENSIVE INITIALIZER
   Works with dev/ folder structure shown in your screenshots.
   - Hydrates brand header from dev/assets/data/owner_core_save_v1.2.json (if present)
   - Renders GC spin hero video from dev/assets/gc_spin.mp4 (if present)
   - Wires "Open Library" / "See Pricing" buttons
   - Loads image/video manifests defensively and updates any count badges if they exist
*/
(() => {
  "use strict";

  // ---------- Helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const setText = (el, text) => { if (el) el.textContent = text; };
  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const PATHS = {
    owner: "dev/assets/data/owner_core_save_v1.2.json",
    plans: "dev/assets/data/plans.json",
    services: "dev/assets/data/services.json",
    videosManifest: "dev/assets/videos/manifest.json",
    imagesManifest: "dev/assets/images/manifest.json",
    heroSpin: "dev/assets/gc_spin.mp4"
  };

  const cache = new Map();
  async function safeFetchJSON(url, fallback = null) {
    try {
      if (cache.has(url)) return cache.get(url);
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      cache.set(url, data);
      return data;
    } catch (err) {
      console.warn(`[main.js] Failed to load ${url}:`, err);
      return fallback;
    }
  }

  // ---------- Brand / Header ----------
  async function hydrateHeader() {
    const data = await safeFetchJSON(PATHS.owner, null);
    if (!data) return;

    const brandName = data?.brand?.name || "THE GRID";
    const tagline = data?.brand?.tagline || "White & Gold";

    setText($("[data-brand-name]"), brandName);
    setText($("[data-brand-tagline]"), tagline);

    // Small glow on CTA if design theme indicates (non-fatal)
    const theme = data?.brand?.theme || "";
    if (theme && theme.includes("gold")) {
      $$("[data-cta]").forEach((btn) => btn.classList.add("glow"));
    }
  }

  // ---------- Hero (video first; fallback ready) ----------
  function renderHero() {
    const heroSlot = $("#hero-slot");
    if (!heroSlot) return;

    // Clear any previous content
    heroSlot.innerHTML = "";

    // Prefer GC spin video if exists (we don't know at runtime; we try and handle error)
    const video = document.createElement("video");
    video.setAttribute("playsinline", "");
    video.setAttribute("muted", "");
    video.setAttribute("loop", "");
    video.setAttribute("autoplay", "");
    video.setAttribute("preload", "metadata");
    video.style.width = "100%";
    video.style.height = "auto";
    video.style.borderRadius = "16px";

    const source = document.createElement("source");
    source.src = PATHS.heroSpin;
    source.type = "video/mp4";
    video.appendChild(source);

    // If video fails to load, we just leave the slot empty gracefully
    video.addEventListener("error", () => {
      console.warn("[main.js] Hero video failed to load:", PATHS.heroSpin);
    });

    heroSlot.appendChild(video);
  }

  // ---------- Buttons / Navigation ----------
  function wireButtons() {
    // Buttons by data-action attribute
    $$("[data-action='open-library']").forEach((btn) =>
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        scrollToId("library");
      })
    );

    $$("[data-action='see-pricing']").forEach((btn) =>
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        scrollToId("plans");
      })
    );

    // Optional: "Customize" and "Join Now" anchors may exist in header
    $$("[data-action='customize']").forEach((btn) =>
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        alert("Design Panel coming back next pass (saved per-device).");
      })
    );
    $$("[data-action='join']").forEach((btn) =>
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        scrollToId("contact");
      })
    );
  }

  // ---------- Library counters (defensive) ----------
  function countItemsFromManifest(json) {
    if (!json) return 0;
    // Accept either array or object-with-array-lists
    if (Array.isArray(json)) return json.length;
    if (typeof json === "object") {
      try {
        // Sum all array-like properties
        return Object.values(json).reduce((sum, v) => {
          if (Array.isArray(v)) return sum + v.length;
          return sum;
        }, 0);
      } catch {
        return 0;
      }
    }
    return 0;
  }

  async function updateLibraryCounts() {
    const [videos, images] = await Promise.all([
      safeFetchJSON(PATHS.videosManifest, null),
      safeFetchJSON(PATHS.imagesManifest, null),
    ]);

    const videoCount = countItemsFromManifest(videos);
    const imageCount = countItemsFromManifest(images);

    // If the chips exist, update their counts. These selectors are optional.
    const setCount = (id, n) => {
      const el = document.getElementById(id);
      if (!el) return;
      // If element text looks like "Hero (0)" keep label, change number. Otherwise just set number.
      const m = el.textContent.match(/^(.*)\(\d+\)\s*$/);
      if (m) el.textContent = `${m[1]}(${n})`;
      else el.textContent = `${el.textContent.trim()} (${n})`;
    };

    setCount("chip-hero", videoCount);       // generic: all videos until you split per category
    setCount("chip-reels-9x16", 0);          // keep 0 if you haven't split yet
    setCount("chip-reels-16x9", 0);
    setCount("chip-backgrounds", imageCount);
    setCount("chip-logos", imageCount);
    setCount("chip-images", imageCount);
    setCount("chip-extras", 0);
  }

  // ---------- Plans (optional gentle hydrate) ----------
  async function hydratePlans() {
    const plans = await safeFetchJSON(PATHS.plans, null);
    if (!plans) return;

    // If specific plan nodes exist, hydrate their price labels.
    const byKey = (key) => $(`[data-plan='${key}'] [data-price]`);
    const setPrice = (key, price) => {
      const el = byKey(key);
      if (el && price != null) setText(el, String(price));
    };

    try {
      // Expecting a structure like { basic: { price }, silver: { price }, ... }
      setPrice("basic", plans?.basic?.price);
      setPrice("silver", plans?.silver?.price);
      setPrice("gold", plans?.gold?.price);
      setPrice("diamond", plans?.diamond?.price);
    } catch (e) {
      console.warn("[main.js] Could not hydrate plan prices:", e);
    }
  }

  // ---------- Boot ----------
  document.addEventListener("DOMContentLoaded", () => {
    try {
      hydrateHeader();
      renderHero();
      wireButtons();
      updateLibraryCounts();
      hydratePlans();
    } catch (err) {
      console.error("[main.js] init error:", err);
    }
  });
})();
