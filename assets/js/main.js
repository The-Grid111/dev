/* THE GRID — main.js (no manual edits needed) */

(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const state = {
    manifests: { videos: [], images: [] },
    picker: 'hero',
    featured: []
  };

  // Greeting
  const setGreeting = () => {
    const h = new Date().getHours();
    const g = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
    $('#greeting').textContent = `${g} — THE GRID`;
  };

  // Load JSON helper
  const j = async url => (await fetch(url)).json().catch(_ => null);

  // Fallback classifier from filename
  const classify = (name) => {
    const n = name.toLowerCase();
    if (n.includes('reel') && (n.includes('9x16') || n.includes('9:16'))) return 'reels916';
    if (n.includes('reel') && (n.includes('16x9') || n.includes('16:9'))) return 'reels169';
    if (n.includes('logo')) return 'logos';
    if (n.includes('bg') || n.includes('background')) return 'backgrounds';
    if (n.includes('hero')) return 'hero';
    if (/\.(jpg|jpeg|png|webp|gif)$/.test(n)) return 'images';
    return 'extras';
  };

  // Load manifests (videos + images)
  const loadManifests = async () => {
    const videos = await j('assets/videos/manifest.json') || { items: [] };
    const images = await j('assets/images/manifest.json') || { items: [] };
    state.manifests.videos = (videos.items || []).map(v => ({
      type: 'video',
      src: v.src || v.path || '',
      thumb: v.thumb || '',
      tag: v.tag || classify(v.src || v.path || ''),
      title: v.title || (v.src || '').split('/').pop(),
      featured: !!v.featured
    }));
    state.manifests.images = (images.items || []).map(i => ({
      type: 'image',
      src: i.src || i.path || '',
      thumb: i.thumb || i.src || '',
      tag: i.tag || classify(i.src || i.path || ''),
      title: i.title || (i.src || '').split('/').pop(),
      featured: !!i.featured
    }));
    state.featured = [...state.manifests.videos, ...state.manifests.images].filter(x => x.featured).slice(0, 9);
  };

  // Library picker (small cards)
  const LIBS = [
    { key: 'hero', label: 'Hero' },
    { key: 'reels916', label: 'Reels 9:16' },
    { key: 'reels169', label: 'Reels 16:9' },
    { key: 'backgrounds', label: 'Backgrounds' },
    { key: 'logos', label: 'Logos' },
    { key: 'images', label: 'Images' },
    { key: 'extras', label: 'Extras' },
  ];

  const drawPicker = () => {
    const wrap = $('#libPicker');
    wrap.innerHTML = '';
    LIBS.forEach(lib => {
      const count = [...state.manifests.videos, ...state.manifests.images].filter(m => m.tag === lib.key).length;
      const btn = document.createElement('button');
      btn.className = `lib-tile${state.picker === lib.key ? ' active' : ''}`;
      btn.innerHTML = `<span class="lbl">${lib.label}</span><span class="badge">${count}</span>`;
      btn.addEventListener('click', () => { state.picker = lib.key; drawPicker(); drawItems(); });
      wrap.appendChild(btn);
    });
  };

  // Library items for selected picker
  const drawItems = () => {
    const area = $('#libItems');
    const all = [...state.manifests.videos, ...state.manifests.images];
    const items = all.filter(x => x.tag === state.picker);
    area.innerHTML = '';
    items.forEach(it => {
      const card = document.createElement('div');
      card.className = 'media-item';
      const thumb = it.type === 'image'
        ? `<img loading="lazy" src="${it.thumb || it.src}" alt="${it.title}">`
        : `<video muted playsinline preload="metadata" src="${it.src}"></video>`;
      card.innerHTML = `<button data-src="${it.src}" data-type="${it.type}">${thumb}</button><div class="cap">${it.title}</div>`;
      card.querySelector('button').addEventListener('click', () => setHero(it));
      area.appendChild(card);
    });

    // Also refresh hero datalist in the panel
    const heroList = $('#heroList');
    heroList.innerHTML = all.filter(x => x.type === 'video').map(v => `<option value="${v.src}"></option>`).join('');
  };

  // Set hero media
  const setHero = (itemOrPath) => {
    const video = $('#heroVideo');
    const image = $('#heroImage');
    video.classList.add('hidden');
    image.classList.add('hidden');
    if (typeof itemOrPath === 'string') {
      const p = itemOrPath.toLowerCase();
      if (p.endsWith('.mp4') || p.endsWith('.webm')) {
        video.src = itemOrPath; video.classList.remove('hidden');
      } else {
        image.src = itemOrPath; image.classList.remove('hidden');
      }
      return;
    }
    if (itemOrPath.type === 'video') {
      video.src = itemOrPath.src; video.classList.remove('hidden');
    } else {
      image.src = itemOrPath.src; image.classList.remove('hidden');
    }
  };

  // Showcase (small grid)
  const drawGallery = () => {
    const g = $('#gallery');
    const list = state.featured.length ? state.featured : [...state.manifests.images].slice(0, 9);
    g.innerHTML = list.map(it => {
      const el = it.type === 'image'
        ? `<img loading="lazy" src="${it.thumb || it.src}" alt="${it.title}">`
        : `<video muted playsinline preload="metadata" src="${it.src}"></video>`;
      return `<div class="g">${el}</div>`;
    }).join('');
  };

  // Plans
  const drawPlans = async () => {
    const plans = await j('assets/data/plans.json') || { plans: [] };
    const wrap = $('#planGrid');
    wrap.innerHTML = (plans.plans || []).map(p => `
      <article class="plan">
        <div class="tier">${(p.tier || '').toUpperCase()}</div>
        <div class="price">£${p.price}/mo</div>
        <h3 class="h3">${p.name}</h3>
        <ul>${p.perks.map(x => `<li>${x}</li>`).join('')}</ul>
        <div class="row">
          <button class="btn btn-primary choose" data-tier="${p.name}">Choose</button>
          <button class="btn btn-ghost details" data-tier="${p.name}">Details</button>
        </div>
      </article>
    `).join('');

    wrap.querySelectorAll('.choose').forEach(b => b.addEventListener('click', e => {
      try { window.launchConfetti && window.launchConfetti(); } catch {}
      location.hash = '#contact';
    }));
    wrap.querySelectorAll('.details').forEach(b => b.addEventListener('click', e => {
      alert(`${e.currentTarget.dataset.tier}\n\n${plans.details?.[e.currentTarget.dataset.tier] || 'Plan details.'}`);
    }));
  };

  // Services
  const drawServices = async () => {
    const services = await j('assets/data/services.json') || { services: [] };
    $('#serviceGrid').innerHTML = (services.services || []).map(s => `
      <article class="service">
        <div class="price">£${s.price}</div>
        <h3 class="h3">${s.name}</h3>
        <ul>${s.perks.map(x => `<li>${x}</li>`).join('')}</ul>
        <button class="btn btn-primary" onclick="location.hash='#contact'">Start</button>
      </article>
    `).join('');
  };

  // Contact
  const bindContact = () => {
    $('#contactForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const d = new FormData(e.currentTarget);
      const mailto = `mailto:gridcoresystems@gmail.com?subject=${encodeURIComponent('[THE GRID] ' + (d.get('topic') || 'Enquiry'))}&body=${encodeURIComponent(
        `Name: ${d.get('name')}\nEmail: ${d.get('email')}\n\n${d.get('message')}`
      )}`;
      window.location.href = mailto;
    });
  };

  // Design Panel
  const openDesign = () => $('#designPanel').showModal();
  const closeDesign = () => $('#designPanel').close();
  const setVar = (k, v) => document.documentElement.style.setProperty(k, v);
  const restoreSaved = () => {
    const raw = localStorage.getItem('grid.design');
    if (!raw) return;
    const data = JSON.parse(raw);
    Object.entries(data.vars || {}).forEach(([k, v]) => setVar(k, v));
    if (data.hero) setHero(data.hero);
  };
  const saveDesign = () => {
    const vars = {
      '--bg-a': getComputedStyle(document.documentElement).getPropertyValue('--bg-a'),
      '--bg-b': getComputedStyle(document.documentElement).getPropertyValue('--bg-b'),
      '--panel': getComputedStyle(document.documentElement).getPropertyValue('--panel'),
      '--card': getComputedStyle(document.documentElement).getPropertyValue('--card'),
      '--text': getComputedStyle(document.documentElement).getPropertyValue('--text'),
      '--soft': getComputedStyle(document.documentElement).getPropertyValue('--soft'),
      '--accent': getComputedStyle(document.documentElement).getPropertyValue('--accent'),
      '--accent-2': getComputedStyle(document.documentElement).getPropertyValue('--accent-2'),
      '--radius': getComputedStyle(document.documentElement).getPropertyValue('--radius'),
      '--glow': getComputedStyle(document.documentElement).getPropertyValue('--glow'),
      '--font': getComputedStyle(document.documentElement).getPropertyValue('--font'),
      '--space': getComputedStyle(document.documentElement).getPropertyValue('--space'),
    };
    const hero = $('#heroVideo').classList.contains('hidden') ? $('#heroImage').src : $('#heroVideo').src;
    localStorage.setItem('grid.design', JSON.stringify({ vars, hero }));
    alert('Saved to this device.');
  };
  const resetDesign = () => { localStorage.removeItem('grid.design'); location.reload(); };

  const wireDesignPanel = () => {
    $('#openCustomize').addEventListener('click', openDesign);
    $('#closeCustomize').addEventListener('click', closeDesign);
    $('#saveDesign').addEventListener('click', saveDesign);
    $('#resetDesign').addEventListener('click', resetDesign);

    const map = [
      ['accent','--accent'], ['accent2','--accent-2'], ['text','--text'], ['soft','--soft'],
      ['card','--card'], ['panel','--panel'], ['bgA','--bg-a'], ['bgB','--bg-b'],
      ['radius','--radius', v => `${v}px`], ['glow','--glow'], ['font','--font', v => `${v}px`],
      ['space','--space', v => `${v}px`]
    ];
    map.forEach(([id, css, fmt]) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', e => setVar(css, fmt ? fmt(e.target.value) : e.target.value));
    });

    $('#vignette').addEventListener('change', e => {
      const on = e.target.value === 'on';
      $('#fx').style.opacity = on ? '.9' : '0';
    });
    $('#heroSource').addEventListener('change', e => setHero(e.target.value));
  };

  // Boot
  const init = async () => {
    setGreeting();
    await loadManifests();
    drawPicker();
    drawItems();
    drawGallery();
    drawPlans();
    drawServices();
    bindContact();
    wireDesignPanel();
    restoreSaved();
  };

  document.addEventListener('DOMContentLoaded', init);
})();
