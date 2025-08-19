<!-- path: assets/js/main.js -->
<script>
/* ===== THE GRID — main.js (full redo) =====
 * - Reads both manifests (videos & images)
 * - Renders Library tabs with counts
 * - Shows tiles in a responsive grid
 * - Tap a tile → sets the Hero (autoplay, muted, loop)
 * - Buttons wired: Open Library, See Pricing, Join Now
 * - Graceful if manifests are missing
 */

(function () {
  const Q = (sel, root=document) => root.querySelector(sel);
  const QA = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  // DOM hooks (these IDs/classes should exist in index.html)
  const heroWrap = Q('#hero-wrap');
  const heroSlot = Q('#hero-slot');
  const openLibraryBtn = Q('#btn-open-library');
  const seePricingBtn = Q('#btn-see-pricing');
  const joinNowBtn = Q('#btn-join-now');

  const libSection = Q('#library');
  const libTabsWrap = Q('#library-tabs');
  const libGrid = Q('#library-grid');
  const libEmpty = Q('#library-empty');

  const showcaseGrid = Q('#showcase-grid');

  const VIDEO_MANIFEST = 'assets/videos/manifest.json';
  const IMAGE_MANIFEST = 'assets/images/manifest.json';

  // Desired tab order
  const TAB_ORDER = [
    'Hero', 'Reels 9:16', 'Reels 16:9',
    'Backgrounds', 'Logos', 'Images', 'Extras'
  ];

  // Fallback hero
  const DEFAULT_HERO = {
    src: 'assets/videos/hero_1.mp4',
    poster: 'assets/images/hero_1.jpg',
    type: 'video',
    title: 'GC Logo Spin 3D'
  };

  // Utilities
  function bust(url) {
    const t = Date.now();
    return url + (url.includes('?') ? '&' : '?') + 't=' + t;
  }

  async function safeFetchJson(url) {
    try {
      const res = await fetch(bust(url), { cache: 'no-store' });
      if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
      return await res.json();
    } catch (e) {
      console.warn('Manifest fetch failed:', url, e.message);
      return null;
    }
  }

  function byName(map, name) {
    return map.find(c => (c.name||'').toLowerCase() === name.toLowerCase());
  }

  function normalizeVideoManifest(json) {
    if (!json || !Array.isArray(json.categories)) return [];
    return json.categories.map(c => ({
      name: c.name || 'Videos',
      type: 'video',
      items: (c.items || []).map(it => ({
        type: 'video',
        src: it.src,
        title: it.title || simpleName(it.src),
        poster: it.poster,
        tags: it.tags || []
      }))
    }));
  }

  function normalizeImageManifest(json) {
    if (!json || !Array.isArray(json.categories)) return [];
    return json.categories.map(c => ({
      name: c.name || 'Images',
      type: 'image',
      items: (c.items || []).map(it => ({
        type: 'image',
        src: it.src,
        title: it.title || simpleName(it.src),
        poster: it.src,
        tags: it.tags || []
      }))
    }));
  }

  function simpleName(p) {
    try {
      const f = p.split('/').pop();
      return f.replace(/\.[a-z0-9]+$/i,'').replace(/[_-]+/g,' ').trim();
    } catch { return p; }
  }

  function setActiveTab(btn) {
    QA('.lib-tab', libTabsWrap).forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }

  function renderTabs(mergedCats) {
    libTabsWrap.innerHTML = '';

    const orderMap = new Map(TAB_ORDER.map((n,i)=>[n.toLowerCase(), i]));
    const cats = [...mergedCats].sort((a,b) => {
      const ia = orderMap.get((a.name||'').toLowerCase()) ?? 999;
      const ib = orderMap.get((b.name||'').toLowerCase()) ?? 999;
      return ia - ib;
    });

    cats.forEach(cat => {
      const count = cat.items.length;
      const btn = document.createElement('button');
      btn.className = 'lib-tab';
      btn.setAttribute('data-tab', cat.name);
      btn.innerHTML = `
        <span class="tab-label">${cat.name}</span>
        <span class="tab-count">${count}</span>
      `;
      btn.addEventListener('click', () => {
        setActiveTab(btn);
        renderGrid(cat);
      });
      libTabsWrap.appendChild(btn);
    });

    // Activate first tab (or show empty)
    if (cats.length) {
      const firstBtn = Q('.lib-tab', libTabsWrap);
      firstBtn && firstBtn.click();
    } else {
      libGrid.innerHTML = '';
      libEmpty.style.display = 'block';
    }
  }

  function renderGrid(category) {
    const items = category.items || [];
    libEmpty.style.display = items.length ? 'none' : 'block';
    if (!items.length) {
      libGrid.innerHTML = '';
      return;
    }

    libGrid.innerHTML = items.map(item => {
      const isVideo = item.type === 'video';
      const poster = item.poster || (isVideo ? '' : item.src);
      return `
        <div class="lib-card" data-kind="${item.type}">
          <div class="thumb" ${poster ? `style="background-image:url('${poster}')"` : ''}>
            ${isVideo ? '<div class="play-dot"></div>' : ''}
          </div>
          <div class="meta">
            <div class="title">${item.title || ''}</div>
            <button class="set-hero">Set as Hero</button>
          </div>
          <div class="paths" data-src="${item.src}" data-poster="${poster}"></div>
        </div>
      `;
    }).join('');

    // Wire up card buttons
    QA('.lib-card .set-hero', libGrid).forEach(btn => {
      btn.addEventListener('click', (e) => {
        const card = e.currentTarget.closest('.lib-card');
        const paths = Q('.paths', card);
        const src = paths.getAttribute('data-src');
        const poster = paths.getAttribute('data-poster') || '';
        const kind = card.getAttribute('data-kind');
        setHero({ src, poster, type: kind, title: Q('.title', card).textContent.trim() });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  function setHero(item) {
    if (!heroSlot) return;
    const isVideo = item.type !== 'image'; // default to video unless explicitly image
    if (isVideo) {
      heroSlot.innerHTML = `
        <video id="hero-video" class="hero-media" playsinline muted autoplay loop ${
          item.poster ? `poster="${item.poster}"` : ''
        }>
          <source src="${item.src}" type="video/mp4" />
        </video>
      `;
      const v = Q('#hero-video');
      // iOS sometimes needs a nudge
      v && v.play().catch(()=>{});
    } else {
      heroSlot.innerHTML = `
        <img class="hero-media" src="${item.src}" alt="${item.title || 'Hero'}" />
      `;
    }
  }

  function renderShowcase(mergedCats) {
    // Grab up to 6 “best” items across video categories
    const picks = [];
    const pickFrom = ['Hero','Reels 9:16','Reels 16:9','Backgrounds','Extras'];

    pickFrom.forEach(name => {
      const cat = mergedCats.find(c => (c.name||'').toLowerCase() === name.toLowerCase());
      if (cat && cat.items && cat.items.length) {
        picks.push(cat.items[0]);
      }
    });

    while (picks.length < 6) {
      // fill with images as needed
      const imgs = mergedCats.find(c => (c.name||'').toLowerCase() === 'images');
      if (!imgs || !imgs.items || !imgs.items.length) break;
      const next = imgs.items[picks.length % imgs.items.length];
      picks.push(next);
    }

    if (!showcaseGrid) return;
    showcaseGrid.innerHTML = picks.map(it => {
      const poster = it.poster || it.src;
      return `
        <div class="showcase-card">
          <div class="thumb" style="background-image:url('${poster}')"></div>
          <div class="caption">${it.title || ''}</div>
        </div>
      `;
    }).join('');
  }

  function wireButtons() {
    if (openLibraryBtn && libSection) {
      openLibraryBtn.addEventListener('click', () => {
        libSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
    const plans = Q('#plans');
    if (seePricingBtn && plans) {
      seePricingBtn.addEventListener('click', () => {
        plans.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
    if (joinNowBtn && plans) {
      joinNowBtn.addEventListener('click', () => {
        plans.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }

  async function init() {
    wireButtons();

    // Initial hero
    setHero(DEFAULT_HERO);

    // Load manifests
    const [vm, im] = await Promise.all([
      safeFetchJson(VIDEO_MANIFEST),
      safeFetchJson(IMAGE_MANIFEST)
    ]);

    const vCats = normalizeVideoManifest(vm);
    const iCats = normalizeImageManifest(im);

    // Merge by name
    const byKey = new Map();
    function put(catArr) {
      catArr.forEach(c => {
        const key = (c.name||'').toLowerCase();
        if (!byKey.has(key)) byKey.set(key, { name: c.name, items: [] });
        byKey.get(key).items = byKey.get(key).items.concat(c.items || []);
      });
    }
    put(vCats); put(iCats);

    const merged = Array.from(byKey.values());

    renderTabs(merged);
    renderShowcase(merged);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
</script>
