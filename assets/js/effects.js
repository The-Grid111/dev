/* Lightweight “depth” effects */

function elevateOnHover(){
  document.addEventListener('pointerenter', e=>{
    const card = e.target.closest('.card, .tier');
    if(card){ card.style.transform='translateY(-1px)'; card.style.transition='transform .08s ease'; }
  }, true);

  document.addEventListener('pointerleave', e=>{
    const card = e.target.closest('.card, .tier');
    if(card){ card.style.transform='translateY(0)'; }
  }, true);
}

function rippleButtons(){
  document.addEventListener('click', e=>{
    const btn = e.target.closest('.btn');
    if(!btn) return;
    const ripple = document.createElement('span');
    ripple.style.position='absolute';
    ripple.style.inset='0';
    ripple.style.borderRadius='inherit';
    ripple.style.pointerEvents='none';
    ripple.style.background='radial-gradient(200px 200px at '+(e.offsetX||btn.clientWidth/2)+'px '+(e.offsetY||btn.clientHeight/2)+'px, rgba(255,255,255,.25), transparent 65%)';
    ripple.style.opacity='0'; ripple.style.transition='opacity .4s ease';
    btn.style.position='relative';
    btn.appendChild(ripple);
    requestAnimationFrame(()=>{ ripple.style.opacity='1'; setTimeout(()=>{ ripple.style.opacity='0'; setTimeout(()=>ripple.remove(), 350); }, 120);});
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  elevateOnHover();
  rippleButtons();
});
