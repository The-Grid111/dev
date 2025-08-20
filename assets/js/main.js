<script>
// ===== MAIN BOOTSTRAP =====
(() => {
  const qs  = (s, r=document) => r.querySelector(s);
  const qsa = (s, r=document) => [...r.querySelectorAll(s)];
  const byId = (id) => document.getElementById(id);

  // DOM refs (these selectors match the new index.html structure)
  let heroWrap, heroVideo, heroPlayBtn, openLibraryBtn, seePricingBtn, joinNowBtn, customizeBtn;

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    cacheDom();
    wireButtons();
    await safelyInitHero();
  }

  function cacheDom() {
    heroWrap      = qs('[data-hero]');
    heroVideo     = qs('[data-hero] video');
    heroPlayBtn   = qs('[data-hero-play]');
    openLibraryBtn= qs('[data-open-library]');
    seePricingBtn = qs('[data-see-pricing]');
    joinNowBtn    = qs('[data-join-now]');
    customizeBtn  = qsa('[data-customize]')[0];

    // Fallback creation if the markup is present but <video> isn’t
    if (heroWrap && !heroVideo) {
      heroVideo = document.createElement('video');
      heroVideo.setAttribute('playsinline','');
      heroVideo.setAttribute('muted','');
      heroVideo.setAttribute('preload','metadata');
      heroVideo.style.width = '100%';
      heroVideo.style.height = 'auto';
      heroWrap.appendChild(heroVideo);
    }
  }

  function wireButtons() {
    // Open Library → open the library section (or modal if you add one later)
    if (openLibraryBtn) openLibraryBtn.addEventListener('click', (e) => {
      e.preventDefault();
      scrollToId('library');
    });

    // See Pricing → Plans anchor
    if (seePricingBtn) seePricingBtn.addEventListener('click', (e) => {
      e.preventDefault();
      scrollToId('plans');
    });

    // Join Now → Contact anchor
    if (joinNowBtn) joinNowBtn.addEventListener('click', (e) => {
      e.preventDefault();
      scrollToId('contact');
    });

    // Customize → toggles a design panel flag (quiet no-op if not present)
    if (customizeBtn) customizeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      try {
        document.documentElement.classList.toggle('design-panel-open');
        // Optional toast—only if you wired styles for it
        console.info('Customize toggled (design-panel-open).');
      } catch (err) {}
    });

    // Hero play button
    if (heroPlayBtn && heroVideo) {
      heroPlayBtn.addEventListener('click', () => {
        if (heroVideo.paused) {
          heroVideo.play().catch(() => {});
        } else {
          heroVideo.pause();
        }
      });
    }
  }

  function scrollToId(id) {
    const el = byId(id) || qs(`[data-section="${id}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---- HERO SOURCE LOADING ----
  async function safelyInitHero() {
    if (!heroVideo) return;

    // Prefer first "Hero" clip in assets/videos/manifest.json, else leave placeholder
    let src = await findFirstHeroClip();
    if (!src) return; // nothing to do; UI shows the placeholder frame

    // Normalize to site-relative path (we are served from /dev/)
    // Your manifests use paths like: "assets/videos/hero_1.mp4"
    if (!src.startsWith('assets/')) src = `assets/videos/${src}`;

    // Apply and show controls-less video
    try {
      heroVideo.src = src;
      heroVideo.loop = true;
      heroVideo.muted = true;
      heroVideo.playsInline = true;
      heroVideo.setAttribute('playsinline','');
      heroVideo.setAttribute('muted','');
      heroVideo.addEventListener('canplay', () => {
        // Autoplay muted for a premium feel (will silently no-op if device blocks)
        heroVideo.play().catch(() => {});
      }, { once: true });
      heroVideo.load();
      heroWrap?.classList.add('hero-ready');
    } catch (err) {
      console.warn('Hero init failed:', err);
    }
  }

  async function findFirstHeroClip() {
    // Defensive fetch: works even if the file is missing or schema differs
    try {
      const res = await fetch('assets/videos/manifest.json', { cache: 'no-store' });
      if (!res.ok) return null;
      const m = await res.json();

      // Accept either { categories: { Hero: [ {src} ] } } or flat { items: [...] }
      // 1) { categories: { Hero: [...] } }
      if (m && m.categories && m.categories.Hero && m.categories.Hero.length) {
        const item = m.categories.Hero[0];
        return typeof item === 'string' ? item : (item.src || null);
      }
      // 2) { items: [ { tag:"Hero", src:"..." }, ... ] }
      if (m && Array.isArray(m.items)) {
        const first = m.items.find(x =>
          (x.tag && /hero/i.test(x.tag)) || (x.tags && x.tags.some(t => /hero/i.test(t)))
        );
        return first ? first.src : null;
      }
      // 3) { Hero: [ "file.mp4", ... ] }
      if (m && Array.isArray(m.Hero) && m.Hero.length) {
        const v = m.Hero[0];
        return typeof v === 'string' ? v : v.src;
      }
      return null;
    } catch (_) {
      return null;
    }
  }
})();
</script>
