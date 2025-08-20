/* THE GRID — Main App (dev/assets/js/main.js)
   Paths are rooted to dev/assets as per repo layout.
*/

// -------- Paths (single source of truth) --------
const ASSETS_BASE = 'dev/assets';
const VIDEO_DIR = `${ASSETS_BASE}/videos`;
const IMAGE_DIR = `${ASSETS_BASE}/images`;
const DATA_DIR  = `${ASSETS_BASE}/data`;

const OWNER_CORE_SAVE = `${DATA_DIR}/owner_core_save_v1.2.json`;
const PLANS_JSON      = `${DATA_DIR}/plans.json`;
const SERVICES_JSON   = `${DATA_DIR}/services.json`;

const LIB_VIDEOS_MANIFEST = `${VIDEO_DIR}/manifest.json`;
const LIB_IMAGES_MANIFEST = `${IMAGE_DIR}/manifest.json`;

// -------- Small helpers --------
const $ = (sel, el=document) => el.querySelector(sel);
const $$ = (sel, el=document) => Array.from(el.querySelectorAll(sel));
const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html !== undefined) n.innerHTML = html;
  return n;
};
const fetchJSON = async (url) => {
  const res = await fetch(url, {cache: 'no-cache'});
  if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${url}`);
  return res.json();
};

// -------- Greeting --------
function greetingText() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning —';
  if (hour < 18) return 'Good afternoon —';
  return 'Good evening —';
}

// -------- Owner Core (brand + hero) --------
async function loadOwnerCore() {
  try {
    const core = await fetchJSON(OWNER_CORE_SAVE);
    $('#greeting').textContent = greetingText();
    if (core.brand?.name) $('#brandName').textContent = core.brand.name;
    if (core.brand?.tagline) $('#brandTag').textContent = core.brand.tagline;

    // Hero
    const mount = $('#heroMount');
    mount.innerHTML = '';
    const src = core.hero?.source;
    const fallback = core.hero?.fallbackImage;

    if (src && src.endsWith('.mp4')) {
      const v = el('video', 'hero__video');
      v.setAttribute('playsinline','');
      v.setAttribute('muted','');
      v.setAttribute('autoplay','');
      v.setAttribute('loop','');
      v.src = src;
      mount.appendChild(v);
    } else if (fallback) {
      const img = el('img', 'hero__image');
      img.src = fallback;
      img.alt = 'Hero';
      mount.appendChild(img);
    } else {
      mount.innerHTML = `<div class="hero__placeholder">HERO PLACEHOLDER • Replace with your top niche video frame</div>`;
    }
  } catch (e) {
    console.warn('Owner core load failed:', e);
  }
}

// -------- Library (videos + images) --------
function flattenManifest(manifest, baseDir) {
  const out = [];
  Object.entries(manifest || {}).forEach(([group, items]) => {
    (items || []).forEach((it) => {
      out.push({
        group,
        name: it.name || it.file,
        // files in manifests are short (e.g., "hero_1.mp4")
        src: `${baseDir}/${it.file}`,
        cover: it.cover ? `${IMAGE_DIR}/${it.cover}` : null,
        type: (it.file || '').toLowerCase().endsWith('.mp4') ? 'video' : 'image'
      });
    });
  });
  return out;
}

function buildPills(tabs, mount, onSelect) {
  mount.innerHTML = '';
  tabs.forEach((tab, i) => {
    const b = el('button', 'pill', `${tab.label} <span class="pill__count">(${tab.count})</span>`);
    if (i === 0) b.classList.add('is-active');
    b.addEventListener('click', () => {
      $$('.pill', mount).forEach(p => p.classList.remove('is-active'));
      b.classList.add('is-active');
      onSelect(tab.value);
    });
    mount.appendChild(b);
  });
}

function renderGrid(items, mount) {
  mount.innerHTML = '';
  if (!items.length) {
    mount.innerHTML = `<div class="empty">Nothing here yet.</div>`;
    return;
  }
  items.forEach((it) => {
    const card = el('div', 'media-card');
    if (it.type === 'video') {
      const v = el('video', 'media-card__video');
      v.src = it.src; v.controls = true; v.playsInline = true;
      card.appendChild(v);
    } else {
      const img = el('img', 'media-card__img');
      img.src = it.src; img.alt = it.name;
      card.appendChild(img);
    }
    const cap = el('div', 'media-card__cap', `<strong>${it.name}</strong><div class="cap__sub">${it.src}</div>`);
    card.appendChild(cap);
    mount.appendChild(card);
  });
}

async function loadLibrary() {
  try {
    const [vman, iman] = await Promise.all([
      fetchJSON(LIB_VIDEOS_MANIFEST),
      fetchJSON(LIB_IMAGES_MANIFEST)
    ]);
    const vids = flattenManifest(vman, VIDEO_DIR);
    const imgs = flattenManifest(iman, IMAGE_DIR);
    const all = [...vids, ...imgs];

    const groups = ['Hero', 'Reels 9:16', 'Reels 16:9', 'Backgrounds', 'Logos', 'Images', 'Extras'];
    const tabs = groups.map(g => ({
      label: g, value: g, count: all.filter(i => i.group === g).length
    }));

    const tabsMount = $('#libraryTabs');
    const gridMount = $('#libraryGrid');
    buildPills(tabs, tabsMount, (group) => {
      renderGrid(all.filter(i => i.group === group), gridMount);
    });
    // initial
    renderGrid(all.filter(i => i.group === groups[0]), gridMount);

    // quick showcase: take first of each group that has items
    const featured = groups.flatMap(g => all.find(i => i.group === g) ? [all.find(i => i.group === g)] : []);
    renderGrid(featured, $('#showcaseGrid'));
  } catch (e) {
    console.warn('Library load failed:', e);
    $('#libraryGrid').innerHTML = `<div class="empty">Library failed to load. Check manifests & paths.</div>`;
  }
}

// -------- Plans (from data/plans.json) --------
async function loadPlans() {
  try {
    const data = await fetchJSON(PLANS_JSON);
    const mount = $('#plansMount');
    mount.innerHTML = '';
    (data.plans || []).forEach(plan => {
      const row = el('div', 'plan');
      row.innerHTML = `
        <div class="plan__price">${plan.price}/mo</div>
        <div class="plan__name">${plan.name}</div>
        <ul class="plan__features">${
          (plan.features || []).map(f => `<li>${f}</li>`).join('')
        }</ul>
        <button class="btn btn--glow">Choose</button>
      `;
      mount.appendChild(row);
    });
  } catch (e) {
    console.warn('Plans load failed:', e);
  }
}

// -------- Contact (dummy handler) --------
function wireContact() {
  $('#contactForm').addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Thanks! We will reply from gridcoresystems@gmail.com.');
    e.target.reset();
  });
}

// -------- Init --------
window.addEventListener('DOMContentLoaded', async () => {
  $('#greeting').textContent = greetingText();
  await loadOwnerCore();
  await loadLibrary();
  await loadPlans();
  wireContact();
});
