/* ===== THE GRID – Confetti engine (tasteful, fast, tier-aware) ===== */
(function(){
  const W = ()=>innerWidth*devicePixelRatio, H = ()=>innerHeight*devicePixelRatio;
  const store = JSON.parse(localStorage.getItem('thegrid.settings')||'{}');
  let density = (store?.confetti?.density ?? 44)|0;
  let speed   = +(store?.confetti?.speed ?? 1.1);

  const paletteGold = ['#E7B84B','#F6E3A1','#FFFFFF','#D7C27A','#F0D06C'];
  const paletteSilver = ['#C9D2E8','#FFFFFF','#B9C6E5','#E9EEF8'];
  const paletteDiamond = ['#B5C7FF','#EAF0FF','#FFFFFF','#9EB7FF'];

  const canvas = document.getElementById('fx');
  const ctx = canvas.getContext('2d');
  let parts = [], raf;

  function size(){ canvas.width = W(); canvas.height = H(); }
  addEventListener('resize', size); size();

  function particle(x, y, dir, s, colors){
    const sz = 3 + Math.random()*7;
    return {
      x, y,
      vx: (1.5+Math.random()*1.7)*dir*s,
      vy: (-2.2 - Math.random()*2.2)*s,
      g: .085*s,
      r: Math.random()*Math.PI,
      w: sz, h: sz*.62,
      life: 130+Math.random()*50,
      c: colors[(Math.random()*colors.length)|0],
      a: .95
    };
  }

  function tick(){
    ctx.clearRect(0,0,canvas.width, canvas.height);
    parts = parts.filter(p=>p.life>0);
    for(const p of parts){
      p.vy += p.g; p.x += p.vx; p.y += p.vy; p.r += .12; p.life--; p.a = Math.max(0, p.life/160);
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.r);
      ctx.fillStyle = p.c; ctx.globalAlpha = p.a;
      ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);
      ctx.restore();
    }
    if(parts.length) raf = requestAnimationFrame(tick); else cancelAnimationFrame(raf);
  }

  function burstFromRect(rect, opts={}){
    const s = +opts.speed || speed;
    const n = (opts.density || density)|0;
    const colors = opts.colors || paletteGold;
    const y = (rect.top + rect.height*0.25) * devicePixelRatio;
    const l = (rect.left - 8) * devicePixelRatio;
    const r = (rect.right + 8) * devicePixelRatio;
    for(let i=0;i<n;i++){ parts.push(particle(l,y, 1, s, colors)); parts.push(particle(r,y,-1, s, colors)); }
    if(!raf) tick();
  }

  function tierColors(tier){
    if(!tier) return paletteGold;
    const t = String(tier).toLowerCase();
    if(t.includes('silver')) return paletteSilver;
    if(t.includes('diamond')) return paletteDiamond;
    return paletteGold;
  }

  // Public API
  window.TheGridConfetti = {
    burst(elOrRect, opts={}){
      const rect = elOrRect?.getBoundingClientRect ? elOrRect.getBoundingClientRect() : elOrRect;
      burstFromRect(rect, opts);
    },
    celebratePlan(cardEl){
      const tier = cardEl?.dataset?.tier || '';
      burstFromRect(cardEl.getBoundingClientRect(), { colors: tierColors(tier) });
      cardEl.scrollIntoView({behavior:'smooth', block:'center'});
    },
    setDensity(v){ density = Math.max(5, Math.min(160, v|0)); },
    setSpeed(v){ speed = Math.max(.3, Math.min(2.4, +v)); }
  };
})();
