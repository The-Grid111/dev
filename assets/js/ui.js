/* THE GRID — ui.js (Layer 1 Core UX)
   Vanilla JS only; works on GitHub Pages. */

const qs  = (s, el=document)=>el.querySelector(s);
const qsa = (s, el=document)=>[...el.querySelectorAll(s)];
const store = {
  get(k, d=null){ try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d }},
  set(k, v){ localStorage.setItem(k, JSON.stringify(v)) },
  del(k){ localStorage.removeItem(k) }
};

const state = {
  user: store.get('user', null),         // {name,email}
  plan: store.get('plan', null),         // 'TRIAL' | 'BASIC' | ...
  save: store.get('saveBlock', null),    // JSON object
  isAdmin: store.get('isAdmin', false),
  settings: store.get('settings', { accent:'#f5c84b', scale:1, density:'regular', liveBg:true, depth:true }),
  slotOrder: store.get('slotOrder', [])  // array of ids in order
};

document.addEventListener('DOMContentLoaded', () => {
  wireBasics();
  applySettings();
  greet();
  renderProfile();
  hydrateNews();
  hydrateSlots();
  wireAdmin();
  year();
});

/* ---------- Topbar nav & basics ---------- */

function wireBasics(){
  // nav scroll
  qsa('[data-nav]').forEach(btn=>{
    btn.addEventListener('click', e=>{
      const to = btn.getAttribute('data-nav');
      const el = qs(to);
      if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
    });
  });

  // menu button: scroll to hero (placeholder for real menu)
  const menuBtn = qs('#menuBtn');
  if(menuBtn) menuBtn.addEventListener('click', ()=>{
    alert('Menu coming online with routing & account pages.');
  });

  // Paste Save
  qs('#pasteSaveBtn').addEventListener('click', onPasteSave);

  // Trial shortcut
  const trialBtn = qs('#trialBtn');
  if(trialBtn) trialBtn.addEventListener('click', ()=>choosePlan('TRIAL'));

  // Pricing buttons
  qsa('[data-plan]').forEach(b=>b.addEventListener('click', ()=>choosePlan(b.dataset.plan)));

  // Profile toggle
  qs('#profileBtn').addEventListener('click', ()=>{
    const sec = qs('#profile');
    sec.classList.toggle('hidden');
    sec.scrollIntoView({behavior:'smooth', block:'start'});
  });

  // Brand long-press → admin unlock
  const brand = qs('#brand');
  let holdTimer = null;
  brand.addEventListener('touchstart', ()=>{ holdTimer = setTimeout(()=>unlockAdmin('hold'), 1200) });
  brand.addEventListener('touchend', ()=>clearTimeout(holdTimer));
  brand.addEventListener('mousedown', ()=>{ holdTimer = setTimeout(()=>unlockAdmin('hold'), 1200) });
  brand.addEventListener('mouseup', ()=>clearTimeout(holdTimer));

  // Hash unlock (#admin=on)
  if(location.hash && location.hash.toLowerCase().includes('admin=on')){
    unlockAdmin('hash');
  }

  // Simple previews
  qsa('[data-action="preview"]').forEach(b=>{
    b.addEventListener('click', () => {
      alert(`This would open the ${b.dataset.id} preview.\n(Attach routing when ready).`);
    });
  });

  // Community stub
  qsa('[data-action="community"]').forEach(b=>{
    b.addEventListener('click', ()=>{
      alert('Community hub will connect to Supabase/Discord. (Stub)');
    });
  });
}

function year(){ const y = new Date().getFullYear(); qs('#year').textContent = y; }

/* ---------- Greeting ---------- */
function greet(){
  const el = qs('#greeting');
  const h = new Date().getHours();
  let msg = 'Welcome';
  if(h < 6) msg = 'Good night';
  else if(h < 12) msg = 'Good morning';
  else if(h < 18) msg = 'Good afternoon';
  else msg = 'Good evening';
  if(state.user?.name) msg += `, ${state.user.name}`;
  el.textContent = msg + '.';
}

/* ---------- Pricing plan (local only) ---------- */
function choosePlan(code){
  state.plan = code;
  store.set('plan', code);
  alert(`Plan set locally to ${code}.\nAdd Stripe IDs for real checkout.`);
  renderProfile();
}

/* ---------- Save input ---------- */
async function onPasteSave(){
  const raw = prompt('Paste your Save (JSON). Nothing is uploaded; it stays on this device.');
  if(!raw) return;
  try{
    const obj = JSON.parse(raw);
    state.save = obj;
    store.set('saveBlock', obj);
    renderSavePreview();
    alert('Save stored locally.');
  }catch(e){
    alert('That wasn’t valid JSON. Try again.');
  }
}

/* ---------- News feed ---------- */
async function hydrateNews(){
  const feed = qs('#newsFeed');
  feed.innerHTML = `<li class="muted">Loading updates…</li>`;
  try{
    const res = await fetch('assets/data/updates.json', {cache:'no-store'});
    if(!res.ok) throw new Error('no file');
    const items = await res.json();
    renderNews(items);
  }catch{
    renderNews([
      {date:'Today', title:'Welcome to the new GRID site', tag:'Release'},
      {date:'Today', title:'Admin Board added: drag-drop slots, live background, brand hue', tag:'Feature'}
    ]);
  }
}
function renderNews(items){
  const feed = qs('#newsFeed');
  if(!items?.length){ feed.innerHTML = `<li class="muted">No updates yet.</li>`; return; }
  feed.innerHTML = items.map(i=>(
    `<li>
      <span class="tag">${escapeHtml(i.tag||'Update')}</span>
      <div><strong>${escapeHtml(i.title)}</strong><div class="muted small">${escapeHtml(i.date||'')}</div></div>
    </li>`
  )).join('');
}

/* ---------- Profile (stub auth) ---------- */
function renderProfile(){
  qs('#userPlan').textContent = state.plan ?? '—';
  renderSavePreview();

  const name = state.user?.name ?? 'Guest';
  qs('#userName').textContent = name;

  const inBtn = qs('#signInBtn');
  const outBtn = qs('#signOutBtn');
  inBtn.classList.toggle('hidden', !!state.user);
  outBtn.classList.toggle('hidden', !state.user);

  inBtn.onclick = async ()=>{
    const email = prompt('Enter email for demo sign-in (local only):');
    if(!email) return;
    state.user = {name: email.split('@')[0], email};
    store.set('user', state.user);
    greet(); renderProfile();
  };
  outBtn.onclick = ()=>{
    state.user = null; store.del('user'); greet(); renderProfile();
  };
}
function renderSavePreview(){
  const el = qs('#savePreview');
  el.textContent = state.save ? JSON.stringify(state.save, null, 2) : 'None yet — paste one from the header.';
}

/* ---------- Admin board ---------- */
function unlockAdmin(source=''){
  if(state.isAdmin) return showAdmin();
  state.isAdmin = true;
  store.set('isAdmin', true);
  alert('Admin unlocked locally on this device.');
  showAdmin();
}
function showAdmin(){
  qs('#adminBoard').classList.remove('hidden');
  buildSlotList();
}
function wireAdmin(){
  // open if already admin
  if(state.isAdmin) showAdmin();

  // close
  qs('#closeAdmin').addEventListener('click', ()=>{
    qs('#adminBoard').classList.add('hidden');
  });

  // controls
  qs('#accentInput').addEventListener('input', e=>{
    state.settings.accent = e.target.value; saveSettings(); applySettings();
  });
  qs('#scaleInput').addEventListener('input', e=>{
    state.settings.scale = Number(e.target.value); saveSettings(); applySettings();
  });
  qs('#densityInput').addEventListener('change', e=>{
    state.settings.density = e.target.value; saveSettings(); applySettings();
  });
  qs('#bgToggle').addEventListener('change', e=>{
    state.settings.liveBg = e.target.checked; saveSettings(); applySettings();
  });
  qs('#depthToggle').addEventListener('change', e=>{
    state.settings.depth = e.target.checked; saveSettings(); applySettings();
  });

  qs('#resetOrder').addEventListener('click', ()=>{
    state.slotOrder = []; store.del('slotOrder'); hydrateSlots(); buildSlotList();
  });

  qs('#exportSave').addEventListener('click', ()=>{
    const blob = new Blob([JSON.stringify(state.save ?? {}, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'save.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  qs('#toggleProfileSection').addEventListener('click', ()=>{
    qs('#profile').classList.toggle('hidden');
  });
}

function applySettings(){
  document.documentElement.style.setProperty('--accent', state.settings.accent);
  document.body.style.setProperty('--scale', state.settings.scale);
  document.body.classList.toggle('density-compact', state.settings.density === 'compact');
  qs('.live-bg').style.display = state.settings.liveBg ? 'block' : 'none';

  // depth toggle: add/remove depth class on cards
  qsa('.card').forEach(c => c.classList.toggle('depth', state.settings.depth));
}

function saveSettings(){ store.set('settings', state.settings); }

/* ---------- Slots ordering ---------- */
const slotIds = ['hero','feature','library','news','pricing','how','community','profile'];
function hydrateSlots(){
  const order = state.slotOrder?.length ? state.slotOrder : slotIds;
  const container = qs('#page');
  order.forEach(id=>{
    const sec = qs(`#${id}`);
    if(sec) container.appendChild(sec);
  });
}
function buildSlotList(){
  const list = qs('#slotList');
  list.innerHTML = '';
  slotIds.forEach(id=>{
    const li = document.createElement('li');
    li.draggable = true;
    li.dataset.id = id;
    li.textContent = id;
    list.appendChild(li);
  });
  // drag events
  qsa('#slotList li').forEach(li=>{
    li.addEventListener('dragstart', ()=>li.classList.add('dragging'));
    li.addEventListener('dragend', ()=>{
      li.classList.remove('dragging');
      applySlotOrderFromList();
    });
  });
  // container dragover to sort
  list.addEventListener('dragover', e=>{
    e.preventDefault();
    const after = getDragAfterElement(list, e.clientY);
    const dragging = qs('#slotList .dragging');
    if(!dragging) return;
    if(after == null) list.appendChild(dragging);
    else list.insertBefore(dragging, after);
  });
}
function getDragAfterElement(container, y){
  const els = [...container.querySelectorAll('li:not(.dragging)')];
  return els.reduce((closest, child)=>{
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height/2;
    if(offset < 0 && offset > closest.offset){
      return {offset, element:child};
    } else {
      return closest;
    }
  }, {offset: Number.NEGATIVE_INFINITY}).element;
}
function applySlotOrderFromList(){
  const listIds = qsa('#slotList li').map(li=>li.dataset.id);
  state.slotOrder = listIds;
  store.set('slotOrder', listIds);
  hydrateSlots();
}

/* ---------- Utilities ---------- */
function escapeHtml(s=''){ return s.replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])) }
