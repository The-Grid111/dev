/* THE GRID — main.js (stable v8)
   Works with your structure:
   - assets/data/owner_core_save_v1.2.json
   - assets/videos/manifest.json
   - assets/images/manifest.json
   - assets/videos/* and assets/images/*
*/

(() => {
  const qs  = (s, r=document) => r.querySelector(s);
  const qsa = (s, r=document) => [...r.querySelectorAll(s)];

  // ---- CONFIG (matches your repo) ----
  const OWNER_SAVE_URL   = 'assets/data/owner_core_save_v1.2.json';
  const VIDEO_MANIFEST   = 'assets/videos/manifest.json';
  const IMAGE_MANIFEST   = 'assets/images/manifest.json';

  // ---- STATE ----
  const state = {
    owner: null,
    videoManifest: null,
    imageManifest: null,
    currentHero: null, // {type:'video'|'image', src:string, poster?:string}
    library: {
      active: 'Hero', // default tab
      items: []       // populated from manifests
    }
  };

  // ---- UTILS ----
  const fetchJSON = async (url) => {
    const res = await fetch(url, {cache:'no-store'});
    if (!res.ok) throw new Error(`Fetch failed: ${url}`);
    return res.json();
  };

  const saveLocal = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const getLocal  = (k, d=null) => {
    try { return JSON.parse(localStorage.getItem(k)) ?? d; }
    catch { return d; }
  };

  const smoothScrollTo = (el) => {
    if (!el) return;
    el.scrollIntoView({behavior:'smooth', block:'start'});
  };

  // ---- BRAND / THEME from owner save ----
  const applyOwnerBrand = (owner) => {
    document.documentElement.style.setProperty('--accent', owner.design?.accent || '#F4C84A');
    document.documentElement.style.setProperty('--accent-2', owner.design?.accentSecondary || '#B5C7FF');
    document.documentElement.style.setProperty('--text', owner.design?.text || '#F5F7FA');
    document.documentElement.style.setProperty('--soft', owner.design?.softText || '#C8CFD8');
    document.documentElement.style.setProperty('--card', owner.design?.cardSurface || '#121418');
    document.documentElement.style.setProperty('--panel', owner.design?.panelSurface || '#0E1013');
    document.documentElement.style.setProperty('--bga', owner.design?.bgA || '#0A0B0D');
    document.documentElement.style.setProperty('--bgb', owner.design?.bgB || '#1A1200');
    document.documentElement.style.setProperty('--radius', (owner.design?.cardRadius ?? 16) + 'px');

    // greeting + brand text (non-breaking if missing)
    const brandEl = qs('[data-brand-name]');
    if (brandEl) brandEl.textContent = owner.brand?.name ?? 'THE GRID';

    const tagEl = qs('[data-brand-tagline]');
    if (tagEl) tagEl.textContent = owner.brand?.tagline ?? 'White & Gold';
  };

  // ---- HERO ----
  const renderHero = () => {
    const wrap = qs('[data-hero]');
    if (!wrap) return;

    wrap.innerHTML = ''; // reset

    const hero = state.currentHero;
    if (!hero) return;

    if (hero.type === 'video') {
      const v = document.createElement('video');
      v.setAttribute('playsinline','');
      v.setAttribute('muted','');
      v.setAttribute('loop','');
      v.setAttribute('controls','');
      v.style.width = '100%';
      v.style.borderRadius = 'var(--radius)';
      v.src = hero.src;
      if (hero.poster) v.poster = hero.poster;
      wrap.appendChild(v);
    } else {
      const img = document.createElement('img');
      img.src = hero.src;
      img.alt = 'Hero';
      img.style.width = '100%';
      img.style.borderRadius = 'var(--radius)';
      wrap.appendChild(img);
    }
  };

  const setHero = (payload) => {
    state.currentHero = payload;
    renderHero();
    saveLocal('grid.hero', payload);
  };

  // ---- LIBRARY ----
  const buildLibraryBuckets = () => {
    // Normalize manifests to the buckets your UI shows
    const buckets = {
      'Hero': [],
      'Reels 9:16': [],
      'Reels 16:9': [],
      'Backgrounds': [],
      'Logos': [],
      'Images': [],
      'Extras': []
    };

    // videos
    (state.videoManifest?.items ?? []).forEach(it => {
      const entry = {
        type: 'video',
        title: it.title || it.name || it.src.split('/').pop(),
        src: it.src,
        poster: it.poster || it.thumbnail || null,
        tag: it.tag || it.category || 'Hero'
      };
      if (buckets[entry.tag]) buckets[entry.tag].push(entry);
      else buckets['Extras'].push(entry);
    });

    // images
    (state.imageManifest?.items ?? []).forEach(it => {
      const entry = {
        type: 'image',
        title: it.title || it.name || it.src.split('/').pop(),
        src: it.src,
        tag: it.tag || it.category || 'Images'
      };
      if (buckets[entry.tag]) buckets[entry.tag].push(entry);
      else buckets['Images'].push(entry);
    });

    return buckets;
  };

  const renderLibraryTabs = (buckets) => {
    const tabsWrap = qs('[data-lib-tabs]');
    if (!tabsWrap) return;

    tabsWrap.innerHTML = '';
    Object.entries(buckets).forEach(([name, list]) => {
      const btn = document.createElement('button');
      btn.className = 'chip';
      btn.textContent = `${name}${list.length ? ' ' + list.length : ' 0'}`;
      if (name === state.library.active) btn.classList.add('active');
      btn.addEventListener('click', () => {
        state.library.active = name;
        renderLibraryTabs(buckets);
        renderLibraryGrid(buckets);
      });
      tabsWrap.appendChild(btn);
    });
  };

  const renderLibraryGrid = (buckets) => {
    const grid = qs('[data-lib-grid]');
    if (!grid) return;

    grid.innerHTML = '';
    const items = buckets[state.library.active] || [];

    if (!items.length) {
      grid.innerHTML = `<div class="muted">No items yet in “${state.library.active}”.</div>`;
      return;
    }

    items.forEach(it => {
      const card = document.createElement('button');
      card.className = 'tile';
      card.setAttribute('aria-label', it.title);

      const thumb = document.createElement(it.type === 'video' ? 'div' : 'img');
      if (it.type === 'video') {
        thumb.className = 'thumb thumb-video';
        thumb.textContent = it.title;
      } else {
        thumb.className = 'thumb';
        thumb.src = it.src;
        thumb.loading = 'lazy';
        thumb.alt = it.title;
      }

      const meta = document.createElement('div');
      meta.className = 'tile-meta';
      meta.innerHTML = `<div class="tile-title">${it.title}</div>
                        <div class="tile-sub">${it.type === 'video' ? 'Video' : 'Image'}</div>`;

      card.appendChild(thumb);
      card.appendChild(meta);

      card.addEventListener('click', () => openViewer(it));
      grid.appendChild(card);
    });
  };

  // ---- VIEWER (modal) ----
  const openViewer = (item) => {
    const modal = qs('[data-viewer]');
    const body  = qs('[data-viewer-body]');
    if (!modal || !body) return;

    body.innerHTML = '';
    if (item.type === 'video') {
      const v = document.createElement('video');
      v.setAttribute('playsinline','');
      v.setAttribute('controls','');
      v.src = item.src;
      if (item.poster) v.poster = item.poster;
      v.style.width = '100%';
      body.appendChild(v);
    } else {
      const img = document.createElement('img');
      img.src = item.src;
      img.alt = item.title;
      img.style.width = '100%';
      body.appendChild(img);
    }

    const setBtn = qs('[data-set-hero]');
    if (setBtn) {
      setBtn.onclick = () => {
        setHero({
          type: item.type,
          src: item.src,
          poster: item.poster || null
        });
        closeViewer();
        smoothScrollTo(qs('[data-hero]'));
      };
    }

    modal.classList.add('open');
  };

  const closeViewer = () => {
    const modal = qs('[data-viewer]');
    if (modal) modal.classList.remove('open');
  };

  // ---- SHOWCASE (small grid) ----
  const renderShowcase = (buckets) => {
    const wrap = qs('[data-showcase]');
    if (!wrap) return;

    wrap.innerHTML = '';
    // take first 8 mixed items from buckets in a deterministic order
    const order = ['Hero','Reels 9:16','Reels 16:9','Images','Backgrounds','Logos','Extras'];
    const pool = [];
    order.forEach(k => (buckets[k]||[]).forEach(x => pool.push(x)));
    const featured = pool.slice(0, 8);

    featured.forEach(it => {
      const a = document.createElement('button');
      a.className = 'showcase-tile';
      a.setAttribute('aria-label', it.title);

      if (it.type === 'image') {
        const img = document.createElement('img');
        img.src = it.src;
        img.loading = 'lazy';
        img.alt = it.title;
        a.appendChild(img);
      } else {
        const dv = document.createElement('div');
        dv.className = 'showcase-video';
        dv.textContent = it.title;
        a.appendChild(dv);
      }

      a.addEventListener('click', () => openViewer(it));
      wrap.appendChild(a);
    });
  };

  // ---- BUTTONS / CTA ----
  const wireCTAs = () => {
    const pricingBtn = qs('[data-btn="pricing"]');
    const libraryBtn = qs('[data-btn="library"]');
    const joinBtns   = qsa('[data-btn="join"]');

    if (pricingBtn) pricingBtn.onclick = () => smoothScrollTo(qs('[data-section="plans"]'));
    if (libraryBtn) libraryBtn.onclick = () => smoothScrollTo(qs('[data-section="library"]'));
    joinBtns.forEach(b => b.onclick = () => smoothScrollTo(qs('[data-section="plans"]')));
  };

  // ---- LOGO SPIN (subtle, GPU-safe) ----
  const enableLogoSpin = () => {
    const logo = qs('[data-brand-logo]');
    if (!logo) return;
    logo.addEventListener('mouseenter', () => logo.classList.add('spin'));
    logo.addEventListener('mouseleave', () => logo.classList.remove('spin'));
  };

  // ---- INIT ----
  const init = async () => {
    try {
      // Load owner + manifests
      state.owner         = await fetchJSON(OWNER_SAVE_URL);
      state.videoManifest = await fetchJSON(VIDEO_MANIFEST).catch(() => ({items:[]}));
      state.imageManifest = await fetchJSON(IMAGE_MANIFEST).catch(() => ({items:[]}));

      applyOwnerBrand(state.owner);

      // Hero: device setting > owner default
      const savedHero = getLocal('grid.hero', null);
      if (savedHero) {
        state.currentHero = savedHero;
      } else if (state.owner?.hero?.source) {
        state.currentHero = { type:'video', src: state.owner.hero.source, poster: state.owner.hero.fallbackImage || null };
      } else {
        // fail-safe placeholder (no crash)
        state.currentHero = { type:'image', src:'assets/images/hero_1.jpg' };
      }
      renderHero();

      // library + showcase
      const buckets = buildLibraryBuckets();
      renderLibraryTabs(buckets);
      renderLibraryGrid(buckets);
      renderShowcase(buckets);

      // IO
      wireCTAs();
      enableLogoSpin();

      // modal close
      const close = qs('[data-viewer-close]');
      if (close) close.onclick = closeViewer;

    } catch (err) {
      console.error('Init error:', err);
    }
  };

  // Run after DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
