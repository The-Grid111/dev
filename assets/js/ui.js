/* THE GRID — UI controller with Admin Customising Board + drag/drop layout */

const qs = (s, el=document)=>el.querySelector(s);
const qsa = (s, el=document)=>[...el.querySelectorAll(s)];

const State = {
  admin:false,
  layoutOrder:[],              // array of section ids (e.g., ["hero","video","library","pricing","how"])
  video:{src:null, poster:null, title:null},
  storageKey:"grid_layout_v2",
  videoKey:"grid_video_manifest_v1"
};

function loadPersisted(){
  try{
    const lo = localStorage.getItem(State.storageKey);
    if(lo) State.layoutOrder = JSON.parse(lo);
    const vo = localStorage.getItem(State.videoKey);
    if(vo) State.video = JSON.parse(vo);
  }catch(e){}
}

function persist(){
  localStorage.setItem(State.storageKey, JSON.stringify(State.layoutOrder));
  localStorage.setItem(State.videoKey, JSON.stringify(State.video));
}

/* Admin detection
   - URL flag ?admin=1 (once) OR
   - localStorage.setItem('grid_admin','1') from console (your backdoor)
*/
function detectAdmin(){
  const url = new URL(location.href);
  if(url.searchParams.get('admin') === '1'){ localStorage.setItem('grid_admin','1'); url.searchParams.delete('admin'); history.replaceState({},'',url.toString()); }
  State.admin = localStorage.getItem('grid_admin') === '1';
  if(State.admin) qs('#adminToggle')?.classList.remove('hidden');
}

/* Mobile menu */
function bindMenu(){
  const open = qs('#menuOpen'), close = qs('#menuClose'), sheet = qs('#menuSheet');
  open?.addEventListener('click', ()=> sheet?.classList.remove('hidden'));
  close?.addEventListener('click', ()=> sheet?.classList.add('hidden'));
  qsa('#menuSheet a').forEach(a=>a.addEventListener('click', ()=> sheet?.classList.add('hidden')));
}

/* Smooth scroll anchors */
function bindAnchors(){
  qsa('a[href^="#"]').forEach(a=>{
    a.addEventListener('click', e=>{
      const id = a.getAttribute('href').slice(1);
      const el = qs(`#${id}`);
      if(el){ e.preventDefault(); el.scrollIntoView({behavior:'smooth', block:'start'}); }
    });
  });
}

/* Video slot: load from manifest JSON (if present) else from localStorage state */
async function loadVideo(){
  const wrap = qs('#videoSlot');
  if(!wrap) return;

  // prefer manifest file
  try{
    const r = await fetch('assets/videos/manifest.json', {cache:'no-store'});
    if(r.ok){
      const m = await r.json();
      if(m && m.source){
        State.video.src = m.source; State.video.poster = m.poster||null; State.video.title = m.title||'';
        persist();
      }
    }
  }catch(e){/* ignore */}

  // render
  if(State.video.src){
    wrap.innerHTML = `
      <video controls playsinline ${State.video.poster?`poster="${State.video.poster}"`:''} style="width:100%; height:auto; display:block;">
        <source src="${State.video.src}" type="video/mp4">
      </video>`;
  }else{
    wrap.innerHTML = `<div class="video-empty">Add a hero video in Admin → Video tab.</div>`;
  }
}

/* Section ordering */
function applyOrder(){
  const host = qs('#sectionsHost');
  if(!host) return;
  const ids = State.layoutOrder.length ? State.layoutOrder : qsa('section[data-id]').map(s=>s.dataset.id);
  ids.forEach(id=>{
    const el = qs(`section[data-id="${id}"]`);
    if(el) host.appendChild(el);
  });
  // keep current as order
  State.layoutOrder = ids;
  persist();
}

/* Admin Panel UI */
function openAdmin(){ qs('#adminPanel')?.classList.add('open'); }
function closeAdmin(){ qs('#adminPanel')?.classList.remove('open'); }

function buildAdmin(){
  if(!State.admin) return;

  // show toggle chip
  const toggle = qs('#adminToggle');
  toggle.style.display='flex';
  toggle.addEventListener('click', openAdmin);

  // populate sections list (drag to reorder)
  const list = qs('#adminSections');
  list.innerHTML = '';
  State.layoutOrder.forEach(id=>{
    const li = document.createElement('div');
    li.className = 'section-item';
    li.draggable = true;
    li.dataset.id = id;
    li.innerHTML = `<span class="handle">☰</span> <strong>${id}</strong> <span class="muted">drag</span>`;
    list.appendChild(li);
  });

  // drag + drop
  let dragging=null;
  list.addEventListener('dragstart', e=>{ dragging = e.target.closest('.section-item'); e.dataTransfer.effectAllowed = 'move'; });
  list.addEventListener('dragover', e=>{
    e.preventDefault();
    const item = e.target.closest('.section-item'); if(!item || item===dragging) return;
    const rect = item.getBoundingClientRect();
    const before = (e.clientY - rect.top) < rect.height/2;
    list.insertBefore(dragging, before? item : item.nextSibling);
  });
  list.addEventListener('drop', ()=>{
    State.layoutOrder = qsa('.section-item', list).map(x=>x.dataset.id);
    applyOrder();
  });

  // video editor
  const vSrc = qs('#vSrc'), vPoster = qs('#vPoster'), vTitle = qs('#vTitle'), vSave = qs('#vSave');
  vSrc.value = State.video.src || '';
  vPoster.value = State.video.poster || '';
  vTitle.value = State.video.title || '';
  vSave.addEventListener('click', ()=>{
    State.video = { src:vSrc.value.trim(), poster:vPoster.value.trim(), title:vTitle.value.trim() };
    persist(); loadVideo();
  });

  // admin actions
  qs('#adminClose')?.addEventListener('click', closeAdmin);
  qs('#adminExit')?.addEventListener('click', ()=>{
    localStorage.removeItem('grid_admin'); location.reload();
  });
}

/* Wire up CTA actions (no dead buttons) */
function bindCTAs(){
  qs('#ctaLibrary')?.addEventListener('click', ()=> location.hash='#library');
  qs('#ctaPricing')?.addEventListener('click', ()=> location.hash='#pricing');
  qs('#ctaTrial')?.addEventListener('click', ()=> alert('Trial launcher coming online (hook to Stripe / Supabase session).'));
  qsa('[data-preview]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const kind = btn.dataset.preview;
      alert(`This would open the ${kind} preview.\n(Attach routing when ready).`);
    });
  });
}

function init(){
  loadPersisted();
  detectAdmin();
  bindMenu();
  bindAnchors();
  applyOrder();
  buildAdmin();
  loadVideo();
  bindCTAs();
}

document.addEventListener('DOMContentLoaded', init);
