(() => {
  const $ = (s, el=document) => el.querySelector(s);
  const $$ = (s, el=document) => [...el.querySelectorAll(s)];

  // --- One-tap admin unlock (per-device) -----------------------------
  const ADMIN_TOKEN = 'unlock-483921'; // one-time link param ?admin=unlock-483921
  const qp = new URL(location.href).searchParams;
  if (qp.get('admin') === ADMIN_TOKEN) {
    Store.set('admin.enabled', true);
    history.replaceState({}, '', location.pathname);
    alert('Admin unlocked on this device.');
  }
  if (Store.get('admin.enabled')) document.body.classList.add('admin');

  // --- Header & sheet ------------------------------------------------
  const sheet = $('#sheet'), menuBtn = $('#menuBtn'), closeBtn = $('.sheet-close', sheet);
  menuBtn?.addEventListener('click', () => sheet.classList.add('show'));
  closeBtn?.addEventListener('click', () => sheet.classList.remove('show'));
  $$('#sheet a[data-link]').forEach(a => a.addEventListener('click', () => sheet.classList.remove('show')));

  // time-of-day greeting
  const h = new Date().getHours();
  $('#todGreet').textContent = (h<12?'Good morning':h<18?'Good afternoon':'Good evening');

  // paste save modal
  const saveModal = $('#saveModal');
  $('#pasteSaveBtn')?.addEventListener('click', () => saveModal.showModal());
  $('#applySaveBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    try{
      const json = JSON.parse($('#saveArea').value || '{}');
      Store.set('save.last', json);
      alert('Save accepted. (Hook: adaptors can read Store.get("save.last")).');
    }catch(err){ alert('Invalid JSON'); }
  });

  // profile button (simple local view for now)
  $('#profileBtn')?.addEventListener('click', () => {
    const plan = Store.get('profile.plan','visitor');
    alert(`Signed in locally.\nPlan: ${plan.toUpperCase()}\n(Admin panel is local-only)`);
  });

  // admin panel
  const adminPanel = $('#adminPanel');
  $('#adminToggle')?.addEventListener('click', (e)=>{ e.preventDefault(); adminPanel.classList.toggle('show'); });
  $('#adminClose')?.addEventListener('click', ()=> adminPanel.classList.remove('show'));

  // controls
  const ctlDepth = $('#ctlDepth'), ctlRadius = $('#ctlRadius'), ctlGlow = $('#ctlGlow');
  // load persisted
  document.documentElement.style.setProperty('--radius', (Store.get('ui.radius',16))+'px');
  document.documentElement.style.setProperty('--glow', Store.get('ui.glow',0.12));
  document.body.dataset.theme = Store.get('ui.theme','dark');
  ctlDepth.value = Store.get('ui.depth',2);
  ctlRadius.value = Store.get('ui.radius',16);
  ctlGlow.value = Store.get('ui.glow',0.12);

  const applyDepth = v => document.documentElement.style.setProperty('--depth', v);
  const applyRadius = v => document.documentElement.style.setProperty('--radius', v+'px');
  const applyGlow = v => document.documentElement.style.setProperty('--glow', v);
  [ctlDepth, ctlRadius, ctlGlow].forEach(input => input?.addEventListener('input', () => {
    if (input===ctlDepth){ Store.set('ui.depth', +input.value); applyDepth(+input.value); }
    if (input===ctlRadius){ Store.set('ui.radius', +input.value); applyRadius(+input.value); }
    if (input===ctlGlow){ Store.set('ui.glow', +input.value); applyGlow(+input.value); }
  }));
  $('#themeDark')?.addEventListener('click', ()=>{ document.body.dataset.theme='dark'; Store.set('ui.theme','dark'); });
  $('#themeLight')?.addEventListener('click', ()=>{ document.body.dataset.theme='light'; Store.set('ui.theme','light'); });

  // Section order manager
  const sections = $$('[data-section]');
  function renderOrder(){
    const list = $('#orderList'); list.innerHTML='';
    sections.forEach(s=>{
      const id = s.getAttribute('data-section');
      const row = document.createElement('div'); row.className='row center';
      row.innerHTML = `<span>${id}</span>
        <span class="spacer" style="flex:1"></span>
        <button class="btn pill small ghost up">↑</button>
        <button class="btn pill small ghost down">↓</button>`;
      row.querySelector('.up').onclick = ()=> move(id, -1);
      row.querySelector('.down').onclick = ()=> move(id, +1);
      list.appendChild(row);
    });
  }
  function move(id, dir){
    const els = $$('[data-section]');
    const arr = els.map(e=>e);
    const i = arr.findIndex(e=>e.dataset.section===id);
    const j = Math.min(arr.length-1, Math.max(0, i+dir));
    if (i===j) return;
    const parent = arr[i].parentElement;
    parent.insertBefore(arr[i], dir>0 ? arr[j].nextSibling : arr[j]);
    persistOrder();
  }
  function persistOrder(){
    const order = $$('[data-section]').map(e=>e.dataset.section);
    Store.set('ui.sectionOrder', order);
  }
  function applyPersistedOrder(){
    const order = Store.get('ui.sectionOrder');
    if (!order) return renderOrder();
    const map = {}; $$('[data-section]').forEach(el => map[el.dataset.section]=el);
    const parent = map[order[0]].parentElement;
    order.forEach(id => map[id] && parent.appendChild(map[id]));
    renderOrder();
  }
  applyPersistedOrder();

  // year + footer plan
  $('#year').textContent = new Date().getFullYear();
  $('#footPlan').textContent = (Store.get('profile.plan','Visitor')||'Visitor');

  // expose for other modules
  window.UI = { renderOrder };
})();
