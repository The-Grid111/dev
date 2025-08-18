/* THE GRID — main.js
   Hooks up header, library, plans modal, and basic actions.
   Depends on: assets/js/confetti.js (optional), assets/manifest.json (optional)
*/

const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const set = (v,val) => document.documentElement.style.setProperty(v,val);

/* ---------- state ---------- */
const state = {
  heroSrc: 'assets/videos/hero_1.mp4',
  library: { Hero:[], 'Reels 9:16':[], 'Reels 16:9':[], Backgrounds:[], Logos:[], Images:[] },
  confetti: { density: 48, speed: 1.05 }
};

/* ---------- greeting + header ---------- */
function setGreeting(){
  const h = new Date().getHours();
  const word = h<12 ? 'Good morning' : h<18 ? 'Good afternoon' : 'Good evening';
  const title = $('#hello') || $('#title'); // support older id
  if (title) title.textContent = `${word} — THE GRID`;
  const sub = $('#subline');
  if (sub && !sub.textContent) sub.textContent = 'Black & Gold';
}

function setLogo(){
  const vid = $('#logoVid');
  if (!vid) return;
  vid.src = 'assets/videos/gc_spin.mp4';
  vid.muted = true; vid.loop = true; vid.autoplay = true; vid.playsInline = true;
  vid.onerror = () => {
    const img = document.createElement('img');
    img.src = 'assets/images/gc_logo.png';
    img.alt = 'Logo';
    vid.replaceWith(img);
  };
}

/* ---------- background hero ---------- */
function setHero(src){
  state.heroSrc = src;
  const box = $('#hero');
  if (!box) return;
  box.innerHTML = '<div class="heroOverlay"></div>';
  const isVideo = /\.(mp4|webm|mov)$/i.test(src);
  const el = document.createElement(isVideo ? 'video' : 'img');
  if (isVideo){
    Object.assign(el, { src, controls:true, playsInline:true, className:'hero-media' });
  }else{
    Object.assign(el, { src, alt:'hero', className:'hero-media' });
  }
  box.prepend(el);
}

function populateHeroSelect(){
  const sel = $('#uiHero');
  if (!sel) return;
  sel.innerHTML = '';
  const all = [...new Set(Object.values(state.library).flat())];
  all.forEach(src => sel.add(new Option(src, src, src===state.heroSrc, src===state.heroSrc)));
  sel.oninput = e => setHero(e.target.value);
}

/* ---------- Library (manifest aware) ---------- */
const fallbackManifest = {
  "Hero":[
    "assets/videos/hero_1.mp4","assets/videos/interaction_1.mp4","assets/videos/pour_1.mp4",
    "assets/images/hero_1.jpg","assets/images/hero_2.jpg","assets/images/hero_3.jpg"
  ],
  "Reels 16:9":[
    "assets/videos/hero_1.mp4","assets/videos/natural_1.mp4","assets/videos/spread_1.mp4","assets/videos/transform_1.mp4"
  ],
  "Backgrounds":[
    "assets/images/grid_natural_1.jpg","assets/images/grid_spread_1.jpg","assets/images/grid_transform_1.jpg"
  ],
  "Logos":[ "assets/videos/gc_spin.mp4","assets/images/gc_logo.png" ],
  "Images":[
    "assets/images/hero_1.jpg","assets/images/hero_2.jpg","assets/images/hero_3.jpg",
    "assets/images/grid_interaction_1.jpg","assets/images/grid_pour_1.jpg"
  ]
};

async function loadManifest(){
  try{
    const res = await fetch('assets/manifest.json', { cache:'no-store' });
    const data = res.ok ? await res.json() : fallbackManifest;
    Object.assign(state.library, data);
  }catch(e){
    Object.assign(state.library, fallbackManifest);
  }
  buildLibrary();
  populateHeroSelect();
}

function pill(text, active){
  const el = document.createElement('div');
  el.className = 'pill' + (active ? ' active' : '');
  el.textContent = text;
  return el;
}

function buildLibrary(){
  const tabs = $('#libTabs'), grid = $('#libGrid'), tags = $('#libTags');
  if (!tabs || !grid) return;

  tabs.innerHTML = ''; grid.innerHTML = ''; if (tags) tags.innerHTML = '';
  const cats = Object.keys(state.library);
  let active = localStorage.getItem('thegrid.activeTab') || cats[0];

  cats.forEach(cat=>{
    const b = pill(cat, cat===active);
    b.onclick = ()=>{ localStorage.setItem('thegrid.activeTab', cat); buildLibrary(); };
    tabs.appendChild(b);
  });

  const list = state.library[active] || [];

  // quick tag cloud from filenames
  if (tags){
    const tset = [...new Set(list.flatMap(x=>{
      const name = x.split('/').pop().toLowerCase();
      return name.split(/[_\-.]/g).filter(w=>w.length>2 && !/\.(mp4|webm|mov|jpg|jpeg|png)$/.test(w));
    }))].slice(0,6);
    tset.forEach(t=>{
      const b = pill(t,false); b.style.opacity = .9;
      b.onclick = ()=> renderGrid(list.filter(x=>x.toLowerCase().includes(t)));
      tags.appendChild(b);
    });
  }

  renderGrid(list);
}

function renderGrid(list){
  const grid = $('#libGrid');
  if (!grid) return;
  grid.innerHTML = '';

  list.forEach(src=>{
    const row = document.createElement('div'); row.className='tile';
    const th  = document.createElement('div'); th.className='thumb';
    const label = document.createElement('div');
    label.innerHTML = `<b>${src.split('/').pop()}</b><div class="meta">${src}</div>`;

    if (/\.(mp4|webm|mov)$/i.test(src)){
      const v = document.createElement('video');
      Object.assign(v,{src,muted:true,loop:true,playsInline:true}); v.autoplay = true;
      th.appendChild(v);
    }else{
      const i = document.createElement('img'); i.src=src; th.appendChild(i);
    }
    row.append(th,label);
    row.onclick = ()=> setHero(src);
    grid.appendChild(row);
  });
}

/* ---------- Plans modal + actions ---------- */
const planCopy = {
  basic: {
    title:'BASIC plan',
    who:"Creators getting started or teams who want a clean base fast.",
    gets:[
      'Starter templates & blocks',
      'Access to the media library (videos, images, logos)',
      'Email support within 48h',
      '7-day refund guarantee',
      'Upgrade anytime — keep your settings, no rebuilds'
    ]
  },
  silver: {
    title:'SILVER plan',
    who:"Growing creators who want better visuals and faster support.",
    gets:[
      'Everything in Basic',
      'Advanced visual effects & presets',
      'Priority email support within 24h',
      'Quarterly tune-ups'
    ]
  },
  gold: {
    title:'GOLD plan',
    who:'Teams that need hands-on help and admin tools.',
    gets:[
      'Hands-on customization session',
      'Admin toolkit & automation setup',
      'Onboarding call (45 min)',
      'Template & block requests'
    ]
  },
  diamond:{
    title:'DIAMOND plan',
    who:'Creators/businesses needing custom pipelines and priority turnaround.',
    gets:[
      'Custom pipelines & integrations',
      'Hands-on help building your stack',
      'Priority roadmap & turnaround',
      'Private components when needed'
    ]
  }
};

function bindPlanButtons(){
  // Choose → confetti + scroll to contact
  $$('.choose').forEach(btn=>{
    btn.onclick = ()=>{
      // start confetti if available
      if (window.startConfetti) startConfetti({ density: state.confetti.density, speed: state.confetti.speed });
      const contact = document.querySelector('section.card:last-of-type') || $('#contact');
      if (contact) contact.scrollIntoView({behavior:'smooth', block:'start'});
    };
  });

  // Details → open modal with copy
  $$('.details').forEach(btn=>{
    btn.onclick = ()=>{
      const tier = btn.closest('.plan')?.dataset.tier;
      const copy = planCopy[tier];
      if (!tier || !copy) return;
      const m = $('#planModal'), t = $('#mTitle'), b = $('#mBody');
      if (!m || !t || !b) return;

      t.textContent = `${copy.title}`;
      b.innerHTML = `
        <p><b>Who it’s for</b><br>${copy.who}</p>
        <p><b>What you get</b></p>
        <ul>${copy.gets.map(x=>`<li>${x}</li>`).join('')}</ul>
        <div class="ctaRow"><button class="btn primary" id="mCta">Sounds good</button></div>`;
      m.showModal();
      $('#mCta').onclick = ()=>{
        m.close();
        if (window.startConfetti) startConfetti({ density: state.confetti.density, speed: state.confetti.speed });
        const contact = document.querySelector('section.card:last-of-type') || $('#contact');
        if (contact) contact.scrollIntoView({behavior:'smooth'});
      };
    };
  });
}

/* ---------- Customize / Join buttons ---------- */
function bindHeaderButtons(){
  const customize = $('#btnCustomize');
  const join = $('#btnJoin');
  const panel = $('#panel');

  if (customize && panel) customize.onclick = ()=> panel.showModal();
  if (join){
    join.onclick = ()=>{
      document.getElementById('plans')?.scrollIntoView({behavior:'smooth'});
      if (window.startConfetti) startConfetti({ density: state.confetti.density, speed: 1.3 });
    };
  }
}

/* ---------- init ---------- */
async function init(){
  setGreeting();
  setLogo();
  bindHeaderButtons();
  await loadManifest();
  // default hero
  setHero(state.heroSrc);
  // plan buttons after DOM is there
  bindPlanButtons();
}

window.addEventListener('DOMContentLoaded', init);
