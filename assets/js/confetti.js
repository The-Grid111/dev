/* Minimal confetti burst (no libraries) when page becomes ready */
(function(){
  function burst(){
    const n = 24;
    for(let i=0;i<n;i++){
      const p = document.createElement('span');
      p.style.position='fixed';
      p.style.left = '50%';
      p.style.top = '16px';
      p.style.width = p.style.height = '6px';
      p.style.borderRadius='1px';
      p.style.background = `hsl(${Math.random()*50+40} 90% 60%)`;
      p.style.transform = `translate(-50%,-50%) rotate(${Math.random()*360}deg)`;
      p.style.pointerEvents='none';
      p.style.zIndex='9999';
      document.body.appendChild(p);
      const x = (Math.random()-.5)*320;
      const y = Math.random()*220 + 60;
      p.animate([
        {transform:`translate(-50%,-50%)`, opacity:1},
        {transform:`translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`, opacity:0}
      ], {duration: 1200 + Math.random()*600, easing:'cubic-bezier(.2,.8,.2,1)'}).finished.then(()=>p.remove());
    }
  }
  window.addEventListener('grid:ready', () => {
    // tiny delay so it feels intentional
    setTimeout(burst, 200);
  }, { once:true });
})();
