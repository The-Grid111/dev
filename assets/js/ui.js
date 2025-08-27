/* THE-GRID UI: profile modal, admin drawer, layout & local state */
(function(){
  const SKEY = 'thegrid:user';
  const LKEY = 'thegrid:layout';
  const AKEY = 'thegrid:admin'; // "1" when enabled locally

  const $ = (q,ctx=document)=>ctx.querySelector(q);
  const $$ = (q,ctx=document)=>Array.from(ctx.querySelectorAll(q));

  function getUser(){
    try { return JSON.parse(localStorage.getItem(SKEY)||'{}'); } catch(_) { return {}; }
  }
  function setUser(obj){
    localStorage.setItem(SKEY, JSON.stringify(obj||{}));
  }

  function getLayout(){
    try { return JSON.parse(localStorage.getItem(LKEY)||'{}'); } catch(_) { return {}; }
  }
  function setLayout(obj){
    localStorage.setItem(LKEY, JSON.stringify(obj||{}));
  }

  // Profile modal
  const dialog = $('#profileDialog');
  const nameInput = $('#profName');
  const planChip = $('#profPlan');
  const saveBlock = $('#saveBlock');
  const saveBtn = $('#saveBlockBtn');
  const status = $('#profileStatus');

  function openProfile(){
    const u = getUser();
    if(nameInput) nameInput.value = u.name || '';
    if(planChip) planChip.textContent = u.plan || 'None';
    if(saveBlock) saveBlock.value = '';
    if(status) status.textContent = 'Ready.';
    dialog?.showModal();
  }

  function persistProfile(){
    const u = getUser();
    u.name = nameInput?.value?.trim() || u.name || 'Creator';
    setUser(u);
    if(status) status.textContent = 'Saved name.';
  }

  nameInput?.addEventListener('change', persistProfile);

  saveBtn?.addEventListener('click', ()=>{
    const txt = saveBlock?.value?.trim();
    if(!txt){ status.textContent='Paste a JSON save first.'; return; }
    try{
      const parsed = JSON.parse(txt);
      const u = getUser();
      u.save = parsed;
      setUser(u);
      status.textContent='Save block stored locally.';
    }catch(e){
      status.textContent='Invalid JSON. Not saved.';
    }
  });

  // Admin gating: ?admin=1 enables; stored locally
  const url = new URL(location.href);
  if(url.searchParams.get('admin')==='1'){ localStorage.setItem(AKEY,'1'); }
  const isAdmin = ()=> localStorage.getItem(AKEY)==='1';

  // Admin drawer behavior
  const drawer = $('#adminDrawer');
  const adminClose = $('#adminClose');
  const depthRange = $('#depthRange');
  const fontRange  = $('#fontRange');
  const bgSelect   = $('#bgSelect');
  const swapBtn    = $('#swapSlots');
  const saveLayoutBtn = $('#saveLayout');

  function openAdmin(){
    if(!isAdmin()){ alert('Admin only. Add ?admin=1 to enable locally.'); return; }
    drawer.style.display='block';
  }
  function closeAdmin(){ drawer.style.display='none'; }

  adminClose?.addEventListener('click', closeAdmin);

  function applyDepth(v){
    const cardEls = $$('.panel');
    cardEls.forEach(el=>{
      el.classList.remove('depth-0','depth-8','depth-12','depth-16','depth-24');
      const cls = (+v>=20)?'depth-24' : (+v>=16)?'depth-16' : (+v>=12)?'depth-12' : (+v>=8)?'depth-8' : 'depth-0';
      el.classList.add(cls);
    });
  }
  depthRange?.addEventListener('input', (e)=> applyDepth(e.target.value));

  function applyFontWeight(v){
    document.documentElement.style.setProperty('--fw', v);
    document.body.style.fontWeight = v;
  }
  fontRange?.addEventListener('input', (e)=> applyFontWeight(e.target.value));

  function applyBackground(key){
    const body = document.body;
    body.dataset.bg = key;
    // (Keeps CSS simple; we rely on existing gradients. Could extend with canvas/video later.)
  }
  bgSelect?.addEventListener('change', (e)=> applyBackground(e.target.value));

  // Swap first two slots quickly
  function swapSlots(){
    const grid = $('#slotGrid');
    const cards = $$('.slot', grid);
    if(cards.length>=2){
      grid.insertBefore(cards[1], cards[0]);
    }
  }
  swapBtn?.addEventListener('click', swapSlots);

  // Save layout order
  function saveLayout(){
    const grid = $('#slotGrid');
    const ids = $$('.slot', grid).map(el=> el.dataset.slot);
    setLayout({ order: ids, bg: document.body.dataset.bg || 'grid' });
    alert('Layout saved locally.');
  }
  saveLayoutBtn?.addEventListener('click', saveLayout);

  // Restore layout on load
  function restoreLayout(){
    const st = getLayout();
    if(st?.order?.length){
      const grid = $('#slotGrid');
      st.order.forEach(id=>{
        const el = grid.querySelector(`[data-slot="${id}"]`);
        if(el) grid.appendChild(el);
      });
    }
    if(st?.bg) applyBackground(st.bg);
  }
  restoreLayout();

  // Expose small API
  window.gridUI = {
    openProfile,
    openAdmin
  };
})();
