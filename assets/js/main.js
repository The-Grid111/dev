/* THE GRID — Main logic (no frameworks) */

(function () {
  const paths = {
    imagesManifest: 'assets/images/manifest.json',
    videosManifest: 'assets/videos/manifest.json',
    plans: 'assets/data/plans.json',
    services: 'assets/data/services.json',
    updates: 'assets/data/updates.json'
  };

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

  const heroVideo = $('#heroVideo');
  const heroFallback = $('#heroFallback');
  const libraryTabs = $('#libraryTabs');
  const libraryGrid = $('#libraryGrid');
  const libraryEmpty = $('#libraryEmpty');
  const showcaseGrid = $('#showcaseGrid');
  const plansGrid = $('#plansGrid');

  /* ---------- Utils ---------- */
  async function getJSON(url) {
    try {
      const res = await fetch(`${url}?v=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[fetch]', url, err);
      return null;
    }
  }

  function makeTile(item) {
    const div = document.createElement('div');
    div.className = 'tile';
    const isVideo = item.type === 'video';
    const src = item.src || item.file || item.url;
    const name = item.name || item.title || src?.split('/').pop() || 'Item';

    div.innerHTML = `
      ${isVideo
        ? `<video muted playsinline loop src="${src}"></video>`
        : `<img loading="lazy" src="${src}" alt="${name}">`}
      <div class="tile__meta">
        <span>${name}</span>
        ${item.badge ? `<span class="badge">${item.badge}</span>` : ''}
      </div>
    `;
    return div;
  }

  function mountPlans(plans) {
    plansGrid.innerHTML = '';
    (plans?.tiers || []).forEach(t => {
      const el = document.createElement('div');
      el.className = 'plan';
      el.innerHTML = `
        <div class="price">${t.price}/mo</div>
        <h3>${t.name}</h3>
        <ul class="features">
          ${(t.features || []).map(li => `<li>${li}</li>`).join('')}
        </ul>
        <button class="btn btn--accent" data-plan="${t.id || t.name}">Choose</button>
      `;
      plansGrid.appendChild(el);
    });

    // plan clicks
    plansGrid.addEventListener('click', e => {
      const btn = e.target.closest('button[data-plan]');
      if (!btn) return;
      window.dispatchEvent(new CustomEvent('grid:choose-plan', { detail: btn.dataset.plan }));
    }, { once: true });
  }

  /* ---------- Hero ---------- */
  function setupHero() {
    // If video fails, show fallback image
    const showFallback = () => {
      if (!heroFallback) return;
      heroVideo?.classList.add('hidden');
      heroFallback.classList.remove('hidden');
    };

    if (!heroVideo) return;

    // Autoplay policies on iOS: ensure muted+playsinline set (already in HTML)
    heroVideo.addEventListener('error', showFallback);
    heroVideo.addEventListener('stalled', showFallback);

    // Try to play; if blocked, show fallback
    const tryPlay = heroVideo.play?.();
    if (tryPlay && typeof tryPlay.catch === 'function') {
      tryPlay.catch(showFallback);
    }
  }

  /* ---------- Library / Showcase ---------- */
  async function loadLibrary() {
    // Try manifests
    let imgManifest = await getJSON(paths.imagesManifest);
    let vidManifest = await getJSON(paths.videosManifest);

    // Fallback manifests (based on your repo contents)
    if (!vidManifest) {
      vidManifest = {
        hero: [
          { name: 'hero_1.mp4', src: 'assets/videos/hero_1.mp4', type: 'video' }
        ],
        reels916: [
          { name: 'interaction_1.mp4', src: 'assets/videos/interaction_1.mp4', type: 'video' }
        ],
        reels169: [
          { name: 'natural_1.mp4', src: 'assets/videos/natural_1.mp4', type: 'video' },
          { name: 'pour_1.mp4', src: 'assets/videos/pour_1.mp4', type: 'video' },
          { name: 'spread_1.mp4', src: 'assets/videos/spread_1.mp4', type: 'video' },
          { name: 'transform_1.mp4', src: 'assets/videos/transform_1.mp4', type: 'video' }
        ]
      };
    }
    if (!imgManifest) {
      imgManifest = {
        logos: [{ name: 'gc_logo.png', src: 'assets/images/gc_logo.png', type: 'image' }],
        images: [
          { name: 'hero_1.jpg', src: 'assets/images/hero_1.jpg', type: 'image' },
          { name: 'hero_2.jpg', src: 'assets/images/hero_2.jpg', type: 'image' },
          { name: 'hero_3.jpg', src: 'assets/images/hero_3.jpg', type: 'image' },
          { name: 'grid_pour_1.jpg', src: 'assets/images/grid_pour_1.jpg', type: 'image' },
          { name: 'grid_natural_1.jpg', src: 'assets/images/grid_natural_1.jpg', type: 'image' },
          { name: 'grid_interaction_1.jpg', src: 'assets/images/grid_interaction_1.jpg', type: 'image' },
          { name: 'grid_spread_1.jpg', src: 'assets/images/grid_spread_1.jpg', type: 'image' },
          { name: 'grid_transform_1.jpg', src: 'assets/images/grid_transform_1.jpg', type: 'image' }
        ]
      };
    }

    // Build tabs
    const tabs = [
      ['Hero', vidManifest.hero || []],
      ['Reels 9:16', vidManifest.reels916 || []],
      ['Reels 16:9', vidManifest.reels169 || []],
      ['Backgrounds', imgManifest.backgrounds || []],
      ['Logos', imgManifest.logos || []],
      ['Images', imgManifest.images || []],
      ['Extras', (imgManifest.extras || []).concat(vidManifest.extras || [])]
    ];

    libraryTabs.innerHTML = '';
    tabs.forEach(([label, list], idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = `${label} (${list.length})`;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', idx === 0 ? 'true' : 'false');
      btn.addEventListener('click', () => {
        $$('.chips button', libraryTabs).forEach(b => b.setAttribute('aria-selected', 'false'));
        btn.setAttribute('aria-selected', 'true');
        renderLibrary(list);
      });
      libraryTabs.appendChild(btn);
    });

    // Initial list
    renderLibrary(tabs[0][1]);

    // Showcase = first 6 across categories
    const showcase = []
      .concat(vidManifest.hero || [])
      .concat(imgManifest.images || [])
      .concat(vidManifest.reels169 || [])
      .slice(0, 6);

    showcaseGrid.innerHTML = '';
    showcase.forEach(item => showcaseGrid.appendChild(makeTile(item)));
  }

  function renderLibrary(list) {
    libraryGrid.innerHTML = '';
    if (!list || list.length === 0) {
      libraryEmpty.classList.remove('hidden');
      return;
    }
    libraryEmpty.classList.add('hidden');
    list.forEach(item => libraryGrid.appendChild(makeTile(item)));
  }

  /* ---------- Plans ---------- */
  async function loadPlans() {
    const plans = await getJSON(paths.plans);
    if (plans?.tiers?.length) {
      mountPlans(plans);
    } else {
      // Fallback (sane defaults)
      mountPlans({
        tiers: [
          { id:'basic', name:'BASIC', price:'£9', features:['Starter templates','Library access','Email support'] },
          { id:'silver', name:'SILVER', price:'£29', features:['Advanced effects','Priority support'] },
          { id:'gold', name:'GOLD', price:'£49', features:['Full customization','Admin toolkit','Onboarding'] },
          { id:'diamond', name:'DIAMOND', price:'£99', features:['Custom pipelines','Hands-on help','Priority turnaround'] }
        ]
      });
    }
  }

  /* ---------- Contact ---------- */
  function setupContact() {
    const form = $('#contactForm');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const name = fd.get('name') || '';
      const email = fd.get('email') || '';
      const topic = fd.get('topic') || '';
      const message = fd.get('message') || '';
      const subject = encodeURIComponent(`Inquiry — ${topic || 'Website'}`);
      const body = encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\n\n${message}`
      );
      window.location.href = `mailto:gridcoresystems@gmail.com?subject=${subject}&body=${body}`;
    });
  }

  /* ---------- Buttons ---------- */
  function wireButtons() {
    $('#btnOpenLibrary')?.addEventListener('click', () => {
      $('#library')?.scrollIntoView({ behavior:'smooth', block:'start' });
    });
    $('#btnCustomize')?.addEventListener('click', () => {
      alert('Design Panel coming back next pass (saved per-device).');
    });
  }

  /* ---------- Init ---------- */
  document.addEventListener('DOMContentLoaded', async () => {
    try {
      setupHero();
      setupContact();
      wireButtons();
      await Promise.all([loadLibrary(), loadPlans()]);
      window.dispatchEvent(new Event('grid:ready'));
    } catch (err) {
      console.error('Init error', err);
    }
  });
})();
