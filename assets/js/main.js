/* THE GRID — core UI bootstrap
   - Reads owner_core_save_v1.2.json (theme + hero)
   - Loads assets/videos/manifest.json & assets/images/manifest.json
   - Renders Library tabs + grid, Showcase picks
   - Wires buttons (Open Library, See Pricing)
*/

(async () => {
  const qs = (sel, el=document) => el.querySelector(sel);
  const qsa = (sel, el=document) => [...el.querySelectorAll(sel)];
  const elHeroMount = qs('#heroMediaMount');
  const elLibTabs   = qs('#libTabs');
  const elLibGrid   = qs('#libGrid');
  const elShowGrid  = qs('#showGrid');

  // ---------- 1) Owner core (theme + hero) ----------
  let owner = null;
  try {
    const r = await fetch('assets/data/owner_core_save_v1.2.json', {cache:'no-store'});
    if (r.ok) owner = await r.json();
  } catch(e){ /* safe default */ }

  const design = owner?.design ?? {
    accent:'#F4C84A', accentSecondary:'#B5C7FF',
    text:'#F5F7FA', softText:'#C8CFD8',
    cardSurface:'#121418', panelSurface:'#0E1013',
    bgA:'#0A0B0D', bgB:'#1A1200',
    cardRadius:16, borderGlow:30, fontScale:1, spacingScale:1, vignette:true,
  };

  // apply theme
  const root = document.documentElement;
  root.style.setProperty('--accent', design.accent);
  root.style.setProperty('--accent2', design.accentSecondary);
  root.style.setProperty('--text', design.text);
  root.style.setProperty('--soft', design.softText);
  root.style.setProperty('--card', design.cardSurface);
  root.style.setProperty('--panel', design.panelSurface);
  root.style.setProperty('--bgA', design.bgA);
  root.style.setProperty('--bgB', design.bgB);
  root.style.setProperty('--radius', design.cardRadius);
  root.style.setProperty('--glow', design.borderGlow);
  root.style.setProperty('--fs', design.fontScale);
  root.style.setProperty('--sp', design.spacingScale);

  // greeting + tagline
  if (owner?.brand?.tagline) qs('#tagline').textContent = owner.brand.tagline;
  const hour = new Date().getHours();
  const dayGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  qs('#greeting').textContent = `${dayGreeting} — ${owner?.brand?.name ?? 'THE GRID'}`;

  // hero source (prefer video)
  const heroVideo = owner?.hero?.source ?? 'assets/videos/hero_1.mp4';
  const heroPoster = owner?.hero?.fallbackImage ?? 'assets/images/hero_1.jpg';
  renderHero(heroVideo, heroPoster);

  function renderHero(videoSrc, posterImg){
    elHeroMount.innerHTML = '';
    const vid = document.createElement('video');
    vid.src = videoSrc;
    vid.muted = true; vid.autoplay = true; vid.loop = true; vid.playsInline = true;
    vid.poster = posterImg;
    // If autoplay blocked or error, swap to image fallback
    const failToImg = () => {
      elHeroMount.innerHTML = '';
      const img = document.createElement('img');
      img.src = posterImg;
      img.alt = 'Hero media';
      elHeroMount.appendChild(img);
    };
    vid.addEventListener('error', failToImg, {once:true});
    vid.addEventListener('play', () => {/* ok */}, {once:true});
    elHeroMount.appendChild(vid);
    // nudge autoplay on iOS
    setTimeout(()=> vid.play().catch(failToImg), 50);
  }

  // ---------- 2) Library (videos + images) ----------
  const tabsOrder = owner?.libraryTabs ?? [
    'Hero','Reels 9:16','Reels 16:9','Backgrounds','Logos','Images','Extras'
  ];

  // Load manifests (safe empty on failure)
  const [vidManifest, imgManifest] = await Promise.all([
    fetchJSON('assets/videos/manifest.json'),
    fetchJSON('assets/images/manifest.json')
  ]);

  // Normalize library map
  const lib = {
    'Hero':           vidManifest?.hero ?? [],
    'Reels 9:16':     vidManifest?.reels_9_16 ?? [],
    'Reels 16:9':     vidManifest?.reels_16_9 ?? [],
    'Backgrounds':    imgManifest?.backgrounds ?? [],
    'Logos':          imgManifest?.logos ?? [],
    'Images':         imgManifest?.images ?? [],
    'Extras':         (vidManifest?.extras ?? []).concat(imgManifest?.extras ?? []),
  };

  // Render tabs
  elLibTabs.innerHTML = '';
  tabsOrder.forEach((name, i) => {
    const btn = document.createElement('button');
    btn.className = `lib-tab${i===0?' active':''}`;
    btn.textContent = `${name}${countBadge(lib[name])}`;
    btn.addEventListener('click', () => {
      qsa('.lib-tab', elLibTabs).forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      renderLibGrid(name);
    });
    elLibTabs.appendChild(btn);
  });
  renderLibGrid(tabsOrder[0]);

  function countBadge(arr){ return Array.isArray(arr) ? (arr.length?` (${arr.length})`: ' (0)') : ' (0)'; }

  function renderLibGrid(tabName){
    const items = lib[tabName] ?? [];
    elLibGrid.innerHTML = '';
    if (!items.length){
      elLibGrid.innerHTML = `<div class="muted">Nothing here yet.</div>`;
      return;
    }
    items.forEach(it => {
      const card = document.createElement('div');
      card.className = 'item';
      const isVideo = it.src?.endsWith('.mp4');
      if (isVideo){
        const v = document.createElement('video');
        v.src = it.src; v.muted = true; v.loop = true; v.playsInline = true;
        v.addEventListener('mouseenter', ()=>v.play().catch(()=>{}));
        v.addEventListener('mouseleave', ()=>v.pause());
        card.appendChild(v);
      } else {
        const img = document.createElement('img');
        img.src = it.src; img.alt = it.title ?? '';
        card.appendChild(img);
      }
      const cap = document.createElement('div');
      cap.className = 'cap';
      cap.textContent = (it.title ?? it.name ?? it.src.split('/').pop());
      card.appendChild(cap);

      // click -> set hero
      card.addEventListener('click', () => {
        if (it.src.endsWith('.mp4')) renderHero(it.src, it.poster ?? owner?.hero?.fallbackImage ?? 'assets/images/hero_1.jpg');
        else renderHero(heroVideo, it.src); // image clicked -> use as poster fallback
        window.scrollTo({top:0, behavior:'smooth'});
      });

      elLibGrid.appendChild(card);
    });
  }

  // ---------- 3) Showcase (first few featured) ----------
  renderShowcase();

  function renderShowcase(){
    elShowGrid.innerHTML = '';
    const picks = [
      ...(vidManifest?.hero ?? []).slice(0,2),
      ...(vidManifest?.reels_16_9 ?? []).slice(0,1),
      ...(imgManifest?.images ?? []).slice(0,3)
    ];
    picks.forEach(it=>{
      const card = document.createElement('div'); card.className='item';
      if (it.src.endsWith('.mp4')){
        const v=document.createElement('video'); v.src=it.src; v.muted=true; v.loop=true; v.playsInline=true;
        v.addEventListener('mouseenter', ()=>v.play().catch(()=>{}));
        v.addEventListener('mouseleave', ()=>v.pause());
        card.appendChild(v);
      } else {
        const img=document.createElement('img'); img.src=it.src; img.alt=it.title??'';
        card.appendChild(img);
      }
      const cap=document.createElement('div'); cap.className='cap'; cap.textContent=(it.title ?? it.src.split('/').pop());
      card.appendChild(cap);
      card.addEventListener('click', ()=> {
        if (it.src.endsWith('.mp4')) renderHero(it.src, it.poster ?? heroPoster);
        else renderHero(heroVideo, it.src);
        window.scrollTo({top:0, behavior:'smooth'});
      });
      elShowGrid.appendChild(card);
    });
  }

  // ---------- 4) Buttons ----------
  qs('#btnOpenLibrary')?.addEventListener('click', ()=> document.getElementById('library')?.scrollIntoView({behavior:'smooth'}));
  qs('#btnSeePricing')?.addEventListener('click', ()=> document.getElementById('plans')?.scrollIntoView({behavior:'smooth'}));
  qs('#btnCustomize')?.addEventListener('click', ()=> alert('Design Panel coming back next pass (saved per-device).'));

  // ---------- helpers ----------
  async function fetchJSON(path){
    try{
      const r = await fetch(path, {cache:'no-store'});
      if (!r.ok) return null;
      return await r.json();
    }catch(_){ return null; }
  }
})();
