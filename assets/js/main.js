/* ===== UTILS ===== */
const $ = (sel, el=document) => el.querySelector(sel);
const $$ = (sel, el=document) => [...el.querySelectorAll(sel)];
const pad = n => String(n).padStart(2,'0');

const state = {
  media: { videos: [], images: [] },
  library: 'hero', // default chip
  theme: null,
  plans: [],
  services: [],
};

const el = {
  greeting: $('#greeting'),
  themeLabel: $('#themeLabel'),
  heroVideo: $('#heroVideo'),
  heroPlay: $('#heroPlay'),
  libChips: $('#libChips'),
  libGrid: $('#libGrid'),
  showcaseGrid: $('#showcaseGrid'),
  plansWrap: $('#plansWrap'),
  servicesWrap: $('#servicesWrap'),
  customizer: $('#customizer'),

  // customizer controls
  openCustomizer: $('#openCustomizer'),
  closeCustomizer: $('#closeCustomizer'),
  saveTheme: $('#saveTheme'),
  resetTheme: $('#resetTheme'),
  c: {
    accent: $('#c_accent'), accent2: $('#c_accent2'),
    text: $('#c_text'), soft: $('#c_soft'),
    card: $('#c_card'), panel: $('#c_panel'),
    bgA: $('#c_bgA'), bgB: $('#c_bgB'),
    radius: $('#c_radius'), glow: $('#c_glow'),
    font: $('#c_font'), space: $('#c_space'),
    vignette: $('#c_vignette'), heroSrc: $('#c_heroSrc'),
  }
};

/* ===== THEME / GREETING ===== */
function greet() {
  const h = new Date().getHours();
  const t = h<12? 'morning' : h<18? 'afternoon' : 'evening';
  el.greeting.textContent = `Good ${t}`;
}
function applyTheme(t) {
  const r = document.documentElement;
  r.style.setProperty('--accent', t.accent);
  r.style.setProperty('--accent-2', t.accent2);
  r.style.setProperty('--text', t.text);
  r.style.setProperty('--soft', t.soft);
  r.style.setProperty('--card', t.card);
  r.style.setProperty('--panel', t.panel);
  r.style.setProperty('--bg-a', t.bgA);
  r.style.setProperty('--bg-b', t.bgB);
  r.style.setProperty('--radius', t.radius + 'px');
  r.style.setProperty('--glow', t.glow);
  r.style.setProperty('--fs', t.font + 'px');
  r.style.setProperty('--space', t.space + 'px');
  el.themeLabel.textContent = 'White & Gold';
}
function loadTheme() {
  const def = {
    accent:'#E9C46A', accent2:'#8AB4F8', text:'#ECEFF4', soft:'#AAB2BF',
    card:'#13151A', panel:'#0E1116', bgA:'#0B0D11', bgB:'#14161B',
    radius:14, glow:28, font:16, space:14, vignette:'on'
  };
  const saved = localStorage.getItem('grid_theme');
  state.theme = saved ? JSON.parse(saved) : def;
  applyTheme(state.theme);
  // bind controls
  const t = state.theme;
  el.c.accent.value = t.accent; el.c.accent2.value = t.accent2;
  el.c.text.value = t.text; el.c.soft.value = t.soft;
  el.c.card.value = t.card; el.c.panel.value = t.panel;
  el.c.bgA.value = t.bgA; el.c.bgB.value = t.bgB;
  el.c.radius.value = t.radius; el.c.glow.value = t.glow;
  el.c.font.value = t.font; el.c.space.value = t.space;
  el.c.vignette.value = t.vignette;
}

/* ===== MEDIA ===== */
async function loadMedia() {
  const [videos, images] = await Promise.all([
    fetch('assets/videos/manifest.json').then(r=>r.json()),
    fetch('assets/images/manifest.json').then(r=>r.json())
  ]);
  state.media.videos = videos.items;
  state.media.images = images.items;
  // Populate hero select and set default video
  el.c.heroSrc.innerHTML = '';
  const heroOptions = [
    ...state.media.videos.map(v => ({label:v.title||v.file, url:v.url})),
    ...state.media.images.map(i => ({label:i.title||i.file, url:i.url}))
  ];
  heroOptions.forEach(o => {
    const opt=document.createElement('option'); opt.textContent=o.label; opt.value=o.url;
    el.c.heroSrc.appendChild(opt);
  });
  // if any default marked, use it
  const def = state.media.videos.find(v=>v.default) || state.media.videos[0];
  setHero(def?.url || heroOptions[0]?.url);
  buildLibraryChips();
  showLibrary('hero');
  buildShowcase();
}

function setHero(url){
  const isVid = url.endsWith('.mp4') || url.endsWith('.webm');
  el.heroVideo.src = isVid ? url : '';
  if(!isVid){
    el.heroVideo.removeAttribute('src');
    el.heroVideo.style.background = `center/cover no-repeat url("${url}")`;
  } else {
    el.heroVideo.style.background = 'none';
  }
}

function buildLibraryChips(){
  const counts = {
    hero: state.media.videos.filter(v=>/hero/i.test(v.file)).length + state.media.images.filter(i=>/hero/i.test(i.file)).length,
    reels916: state.media.videos.filter(v=>v.tags?.includes('reels916')).length,
    reels169: state.media.videos.filter(v=>v.tags?.includes('reels169')).length,
    backgrounds: state.media.images.filter(i=>i.tags?.includes('background')).length,
    logos: state.media.images.filter(i=>i.tags?.includes('logo')).length,
    images: state.media.images.length,
    extras: state.media.videos.filter(v=>v.tags?.includes('extra')).length + state.media.images.filter(i=>i.tags?.includes('extra')).length,
  };
  const chips = [
    {key:'hero', label:'Hero'},
    {key:'reels916', label:'Reels 9:16'},
    {key:'reels169', label:'Reels 16:9'},
    {key:'backgrounds', label:'Backgrounds'},
    {key:'logos', label:'Logos'},
    {key:'images', label:'Images'},
    {key:'extras', label:'Extras'},
  ];
  el.libChips.innerHTML='';
  chips.forEach(c=>{
    const b=document.createElement('button');
    b.className='chip'+(state.library===c.key?' chip--active':'');
    b.textContent=c.label;
    const sm=document.createElement('small'); sm.textContent=counts[c.key]||0; b.appendChild(sm);
    b.addEventListener('click',()=>showLibrary(c.key));
    el.libChips.appendChild(b);
  });
}

function thumbCard(item){
  const wrap=document.createElement('div');
  wrap.className='card-thumb';
  const label=document.createElement('div'); label.className='thumb__label'; label.textContent=item.title||item.file;
  wrap.appendChild(label);
  if(item.url.endsWith('.mp4')){
    const v=document.createElement('video'); v.src=item.url; v.muted=true; v.preload='metadata';
    wrap.prepend(v);
  } else {
    const img=document.createElement('img'); img.src=item.url; wrap.prepend(img);
  }
  wrap.addEventListener('click',()=>{
    // set clicked media as hero
    setHero(item.url);
    el.c.heroSrc.value = item.url;
    window.scrollTo({top:0,behavior:'smooth'});
  });
  return wrap;
}

function showLibrary(key){
  state.library = key;
  buildLibraryChips();
  el.libGrid.innerHTML='';
  let list=[];
  if(key==='hero'){
    list = [
      ...state.media.videos.filter(v=>/hero/i.test(v.file)),
      ...state.media.images.filter(i=>/hero/i.test(i.file))
    ];
  } else if(key==='reels916'){ list = state.media.videos.filter(v=>v.tags?.includes('reels916'));
  } else if(key==='reels169'){ list = state.media.videos.filter(v=>v.tags?.includes('reels169'));
  } else if(key==='backgrounds'){ list = state.media.images.filter(i=>i.tags?.includes('background'));
  } else if(key==='logos'){ list = state.media.images.filter(i=>i.tags?.includes('logo'));
  } else if(key==='images'){ list = state.media.images;
  } else if(key==='extras'){ list = [
    ...state.media.videos.filter(v=>v.tags?.includes('extra')),
    ...state.media.images.filter(i=>i.tags?.includes('extra'))
  ]; }
  if(list.length===0){ el.libGrid.innerHTML = `<div class="muted">No items yet for this library.</div>`; return; }
  list.forEach(item=> el.libGrid.appendChild(thumbCard(item)));
}

function buildShowcase(){
  const featured = [
    ...state.media.videos.filter(v=>v.featured),
    ...state.media.images.filter(i=>i.featured)
  ];
  el.showcaseGrid.innerHTML='';
  (featured.length?featured:state.media.images.slice(0,6)).forEach(m=>{
    el.showcaseGrid.appendChild(thumbCard(m));
  });
}

/* ===== PLANS & SERVICES ===== */
async function loadCommerce(){
  const [plans, services] = await Promise.all([
    fetch('assets/data/plans.json').then(r=>r.json()),
    fetch('assets/data/services.json').then(r=>r.json())
  ]);
  state.plans = plans.items; state.services = services.items;
  // plans
  el.plansWrap.innerHTML='';
  state.plans.forEach(p=>{
    const div=document.createElement('div'); div.className='plan';
    div.innerHTML = `
      <div class="muted" style="text-transform:uppercase;letter-spacing:.4px">${p.tier}</div>
      <div class="plan__price">£${p.price}/mo</div>
      <ul>${p.features.map(f=>`<li>${f}</li>`).join('')}</ul>
      <div class="actions">
        <a class="btn btn--accent" href="${p.checkout||'#'}" target="_blank" rel="noopener">Choose</a>
        <button class="btn btn--ghost" data-id="${p.id}">Details</button>
      </div>
    `;
    el.plansWrap.appendChild(div);
    div.querySelector('[data-id]').addEventListener('click',()=>{
      alert(`${p.title}\n\nWho it’s for: ${p.who}\n\nWhat you get:\n- ${p.features.join('\n- ')}`);
    });
  });
  // services
  el.servicesWrap.innerHTML='';
  state.services.forEach(s=>{
    const div=document.createElement('div'); div.className='service';
    div.innerHTML = `
      <div class="muted" style="text-transform:uppercase;letter-spacing:.4px">${s.tag}</div>
      <div class="plan__price">£${s.price}</div>
      <div style="font-weight:700;margin:.2rem 0">${s.title}</div>
      <ul>${s.includes.map(i=>`<li>${i}</li>`).join('')}</ul>
      <div class="actions">
        <a class="btn btn--accent" href="${s.checkout||'#'}" target="_blank" rel="noopener">Start</a>
      </div>
    `;
    el.servicesWrap.appendChild(div);
  });
}

/* ===== EVENTS ===== */
function wires(){
  $('#seePricing').addEventListener('click', e=>{
    e.preventDefault(); $('#plans').scrollIntoView({behavior:'smooth'});
  });
  $('#joinCta').addEventListener('click', e=>{
    e.preventDefault(); $('#plans').scrollIntoView({behavior:'smooth'});
  });

  el.heroPlay.addEventListener('click', ()=>{
    const v=el.heroVideo;
    if(!v.src) return;
    if(v.paused){ v.play(); } else { v.pause(); }
  });

  // customizer open/close
  el.openCustomizer.addEventListener('click', ()=> el.customizer.showModal());
  el.closeCustomizer.addEventListener('click', ()=> el.customizer.close());

  // bind theme controls + persist
  const upd = () => {
    const t = state.theme;
    t.accent=el.c.accent.value; t.accent2=el.c.accent2.value;
    t.text=el.c.text.value; t.soft=el.c.soft.value;
    t.card=el.c.card.value; t.panel=el.c.panel.value;
    t.bgA=el.c.bgA.value; t.bgB=el.c.bgB.value;
    t.radius=+el.c.radius.value; t.glow=+el.c.glow.value;
    t.font=+el.c.font.value; t.space=+el.c.space.value;
    t.vignette=el.c.vignette.value;
    applyTheme(t);
  };
  Object.values(el.c).forEach(input=>{
    input?.addEventListener?.('input', upd);
    input?.addEventListener?.('change', upd);
  });
  el.c.heroSrc.addEventListener('change', e=> setHero(e.target.value));
  el.saveTheme.addEventListener('click', ()=> { localStorage.setItem('grid_theme', JSON.stringify(state.theme)); alert('Saved.'); });
  el.resetTheme.addEventListener('click', ()=> { localStorage.removeItem('grid_theme'); location.reload(); });
}

/* ===== INIT ===== */
(async function init(){
  greet();
  loadTheme();
  wires();
  await loadMedia();
  await loadCommerce();
})();
