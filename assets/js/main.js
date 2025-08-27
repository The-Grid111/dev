/* THE-GRID main: greeting, nav routes, banner, confetti fallback, basics */
(function(){
  const $ = (q,ctx=document)=>ctx.querySelector(q);
  const $$ = (q,ctx=document)=>Array.from(ctx.querySelectorAll(q));

  // Time greeting
  try{
    const el = $('#greeting');
    const now = new Date(); const h = now.getHours();
    const msg = h<12? 'Good morning' : h<18? 'Good afternoon' : 'Good evening';
    if(el) el.textContent = msg + ' — welcome back';
  }catch(e){}

  // Trial banner
  const trialBtn = $('#trialStartBtn');
  if(trialBtn){
    trialBtn.addEventListener('click', ()=>{
      window.gridCommerce?.startTrial?.();
    });
  }

  // Nav routing
  function routeTo(key){
    switch(key){
      case 'home': window.scrollTo({top:0,behavior:'smooth'}); break;
      case 'community': alert('Community coming online.'); break;
      case 'profile': window.gridUI?.openProfile?.(); break;
      case 'admin': window.gridUI?.openAdmin?.(); break;
      default: /* plans etc handled elsewhere */ break;
    }
  }
  $$('.nav-link').forEach(b=>{
    b.addEventListener('click', (e)=>{
      const key = e.currentTarget.getAttribute('data-nav');
      if(key) routeTo(key);
    });
  });

  // Plans in dropdown
  $$('.drop [data-plan]').forEach(a=>{
    a.addEventListener('click', (e)=>{
      e.preventDefault();
      const plan = e.currentTarget.getAttribute('data-plan');
      window.gridCommerce?.selectPlan?.(plan);
    });
  });

  // Confetti fallback if external not present
  function fallbackConfetti(){
    const btn = $('#btnCelebrate');
    btn?.addEventListener('click', ()=>{
      const n = 80; const frag = document.createDocumentFragment();
      for(let i=0;i<n;i++){
        const s = document.createElement('span');
        const size = Math.random()*6+3;
        const x = (Math.random()*100)|0; const dur = (Math.random()*700+600)|0;
        s.style.cssText = `position:fixed;left:${x}vw;top:-10px;width:${size}px;height:${size}px;background:linear-gradient(135deg,#d1a954,#f0c366);border-radius:2px;opacity:.9;pointer-events:none;transform:translateY(0);transition:transform ${dur}ms ease, opacity ${dur}ms ease;`;
        setTimeout(()=>{s.style.transform=`translateY(${window.innerHeight+40}px) rotate(${Math.random()*360}deg)`; s.style.opacity='0';}, 16);
        setTimeout(()=>{s.remove();}, dur+400);
        frag.appendChild(s);
      }
      document.body.appendChild(frag);
    });
  }
  // Prefer external confetti if available
  if(typeof window.__gridConfetti === 'object'){
    $('#btnCelebrate')?.addEventListener('click', ()=> window.__gridConfetti.gold());
  } else {
    fallbackConfetti();
  }

  // Keyboard access hint
  document.body.addEventListener('keydown', (e)=>{ if(e.key==='Tab'){ document.body.classList.add('show-focus'); } });
})();
