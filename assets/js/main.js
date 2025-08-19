/* Main UI logic — zero config for you. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const heroVideo = $('#heroVideo');
  const libGrid = $('#libGrid');
  const galleryGrid = $('#galleryGrid');
  const plansWrap = $('#plansWrap');
  const servicesWrap = $('#servicesWrap');
  const lightbox = $('#lightbox');
  const lightboxBody = $('#lightboxBody');

  /* Smooth scroll on [data-scroll] */
  $$('[data-scroll]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      const id = el.getAttribute('data-scroll');
      const target = document.querySelector(id);
      target?.scrollIntoView({behavior:'smooth', block:'start'});
    });
  });

  /* Close lightbox */
  lightbox?.addEventListener('click', e => {
    if (e.target === lightbox || e.target.hasAttribute('data-close')) lightbox.close();
  });

  /* Load media manifest (videos) */
  async function loadManifest(){
    try{
      const res = await fetch('assets/videos/manifest.json');
      if(!res.ok) throw 0;
      return await res.json();
    }catch{
      // sensible fallback based on the files you already have
      return {
        hero: [
          {src: 'assets/videos/hero_1.mp4', poster: 'assets/images/hero_1.jpg', name:'hero_1.mp4'}
        ],
        reels_9_16: [],
        reels_16_9: [],
        backgrounds: [
          {src: 'assets/videos/pour_1.mp4', name:'pour_1.mp4'},
          {src: 'assets/videos/spread_1.mp4', name:'spread_1.mp4'},
          {src: 'assets/videos/transform_1.mp4', name:'transform_1.mp4'},
          {src: 'assets/videos/natural_1.mp4', name:'natural_1.mp4'},
          {src: 'assets/videos/interaction_1.mp4', name:'interaction_1.mp4'}
        ]
      };
    }
  }

  /* Load pricing/services JSON (your /data folder) */
  async function loadJSON(path, fallback){
    try{
      const res = await fetch(path);
      if(!res.ok) throw 0;
      return await res.json();
    }catch{
      return fallback;
    }
  }

  /* Paint library grid */
  function paintLibrary(data){
    const filters = $('#libFilters');
    function render(kind='hero'){
      const map = {
        'hero': data.hero || [],
        'reel-9-16': data.reels_9_16 || [],
        'reel-16-9': data.reels_16_9 || [],
        'backgrounds': data.backgrounds || [],
        'logos': [],
        'images': []
      };
      libGrid.innerHTML = '';
      map[kind].forEach(item => {
        const card = document.createElement('div');
        card.className = 'media-card';
        card.innerHTML = `
          <div class="thumb">${thumbEl(item)}</div>
          <div class="meta">
            <span class="name">${item.name || fileName(item.src)}</span>
            <button class="btn ghost" data-set="${item.src}">Set hero</button>
          </div>
        `;
        libGrid.append(card);
      });
    }
    // initial
    render('hero');

    filters.addEventListener('click', ev => {
      const btn = ev.target.closest('.chip'); if(!btn) return;
      $$('.chip', filters).forEach(c => c.classList.remove('is-active'));
      btn.classList.add('is-active');
      render(btn.dataset.kind);
    });

    libGrid.addEventListener('click', ev => {
      const setBtn = ev.target.closest('[data-set]'); if(!setBtn) return;
      const src = setBtn.dataset.set;
      setHero(src);
      pulse(setBtn);
    });
  }

  function thumbEl(item){
    const poster = item.poster ? `<img src="${item.poster}" alt="">` : `<video src="${item.src}#t=1"></video>`;
    return poster;
  }

  function setHero(src){
    if (!heroVideo) return;
    heroVideo.src = src;
    heroVideo.play().catch(()=>{});
  }

  function fileName(path){ return path.split('/').pop(); }

  /* Paint gallery from manifest + known images */
  function paintGallery(data){
    const images = [
      'assets/images/hero_1.jpg',
      'assets/images/grid_pour_1.jpg',
      'assets/images/grid_spread_1.jpg',
      'assets/images/grid_transform_1.jpg',
      'assets/images/grid_interaction_1.jpg',
      'assets/images/grid_natural_1.jpg'
    ];
    const videos =
      (data.hero||[]).concat(data.backgrounds||[]).concat(data.reels_16_9||[]).slice(0,12);

    // build grid
    galleryGrid.innerHTML = '';

    images.forEach(src => {
      const el = document.createElement('div');
      el.className = 'gallery-item';
      el.innerHTML = `<img src="${src}" alt="">`;
      el.addEventListener('click', () => openLightbox(`<img src="${src}" alt="">`));
      galleryGrid.append(el);
    });

    videos.forEach(v => {
      const el = document.createElement('div');
      el.className = 'gallery-item';
      el.innerHTML = `
        <video src="${v.src}#t=1" muted></video>
        <span class="badge">Video</span>`;
      el.addEventListener('click', () => openLightbox(`<video src="${v.src}" controls autoplay></video>`));
      galleryGrid.append(el);
    });
  }

  function openLightbox(html){
    lightboxBody.innerHTML = html;
    lightbox.showModal();
  }

  /* Pricing + Services */
  function paintPlans(plans){
    plansWrap.innerHTML = '';
    plans.forEach(p => {
      const el = document.createElement('article');
      el.className = 'plan';
      el.innerHTML = `
        <span class="tag">${p.tier.toUpperCase()}</span>
        <h3>${p.price}/mo</h3>
        <ul>${p.features.map(f=>`<li>${f}</li>`).join('')}</ul>
        <button class="btn solid" data-plan="${p.tier}">Choose</button>
        <button class="btn ghost" data-plan-detail="${p.tier}">Details</button>
      `;
      plansWrap.append(el);
    });

    plansWrap.addEventListener('click', (e)=>{
      const choose = e.target.closest('[data-plan]');
      const detail = e.target.closest('[data-plan-detail]');
      if(choose){
        confetti && confetti.start && confetti.start(); // if lib present
        // mailto fallback; feel free to swap to Stripe link by editing plans.json later
        const tier = choose.dataset.plan;
        window.location.href = `mailto:gridcoresystems@gmail.com?subject=Plan%20signup:%20${encodeURIComponent(tier)}&body=Hi%20Grid%20team,%20I'd%20like%20the%20${tier}%20plan.`;
      }
      if(detail){
        const tier = detail.dataset.planDetail;
        const p = plans.find(x=>x.tier===tier);
        openLightbox(`
          <div style="padding:18px;background:#fff;color:#111;border-radius:12px">
            <h3 style="margin-top:0">${p.tier.toUpperCase()} plan</h3>
            <p><strong>${p.price}/mo</strong></p>
            <ul>${p.features.map(f=>`<li>${f}</li>`).join('')}</ul>
            <button class="btn solid" onclick="location.href='mailto:gridcoresystems@gmail.com?subject=Plan%20signup:%20${encodeURIComponent(tier)}'">Sounds good</button>
          </div>
        `);
      }
    });
  }

  function paintServices(items){
    servicesWrap.innerHTML = '';
    items.forEach(s=>{
      const el = document.createElement('article');
      el.className = 'plan';
      el.innerHTML = `
        <span class="tag">${s.tag.toUpperCase()}</span>
        <h3>£${s.price}</h3>
        <ul>${s.features.map(f=>`<li>${f}</li>`).join('')}</ul>
        <button class="btn solid" onclick="location.href='mailto:gridcoresystems@gmail.com?subject=Service%20order:%20${encodeURIComponent(s.tag)}'">Start ${s.cta || 'Order'}</button>
      `;
      servicesWrap.append(el);
    });
  }

  /* Contact form (simple mailto) */
  $('#contactForm')?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    const body = encodeURIComponent(`${data.message || ''}\n\n— ${data.name} <${data.email}> (${data.topic||'General'})`);
    location.href = `mailto:gridcoresystems@gmail.com?subject=Website%20message&body=${body}`;
  });

  /* Tiny helper */
  function pulse(el){
    el.style.boxShadow = `0 0 0 6px ${getComputedStyle(document.documentElement).getPropertyValue('--ring')}`;
    setTimeout(()=> el.style.boxShadow = '', 300);
  }

  /* Boot */
  (async function init(){
    const manifest = await loadManifest();
    if (manifest?.hero?.[0]?.src) setHero(manifest.hero[0].src);
    paintLibrary(manifest);
    paintGallery(manifest);

    const plans = await loadJSON('data/plans.json', [
      { tier: 'BASIC', price: '£9', features: ['Starter templates & blocks','Library access (videos, images, logos)','Email support (48h)'] },
      { tier: 'GOLD', price: '£49', features: ['Full customization session','Admin toolkit & automations','1:1 onboarding (45 min)'] },
      { tier: 'DIAMOND', price: '£99', features: ['Custom pipelines & integrations','Hands-on help building your stack','Priority roadmap & turnaround'] }
    ]);
    paintPlans(plans);

    const services = await loadJSON('data/services.json', [
      { tag:'Setup', price:39, features:['Deploy & connect Pages','Analytics hookup','Best-practice sweep'], cta:'Setup' },
      { tag:'Reels', price:59, features:['3 niche reels','Captions & cuts','IG/TikTok ready'], cta:'Pack' },
      { tag:'Templates', price:29, features:['5 premium blocks','Copy-paste ready','Lifetime updates'], cta:'Pack' }
    ]);
    paintServices(services);
  })();
})();
