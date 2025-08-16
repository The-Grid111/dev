/* =============== THEGRID Confetti Engine (v1.0) =============== */
(() => {
  const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

  // Singleton canvas overlay
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.style.cssText = `
    position: fixed; inset: 0; pointer-events: none; z-index: 2147483646;
  `;
  document.body.appendChild(canvas);

  function resize(){
    const { innerWidth:w, innerHeight:h } = window;
    canvas.width  = Math.floor(w * DPR);
    canvas.height = Math.floor(h * DPR);
    ctx.setTransform(DPR,0,0,DPR,0,0);
  }
  resize(); addEventListener('resize', resize, { passive:true });

  // Particle pool
  const particles = [];
  let raf = 0;

  const drawShape = (p) => {
    const { x, y, size, color, shape, rot } = p;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);

    // glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;

    ctx.fillStyle = color;
    switch(shape){
      case 'dot':
        ctx.beginPath(); ctx.arc(0,0,size*0.5,0,Math.PI*2); ctx.fill(); break;
      case 'square':
        ctx.fillRect(-size/2, -size/2, size, size); break;
      case 'triangle':
        ctx.beginPath();
        const s = size;
        ctx.moveTo(0,-s/1.15); ctx.lineTo(s/1.15, s/1.15); ctx.lineTo(-s/1.15, s/1.15); ctx.closePath(); ctx.fill();
        break;
      case 'star':
        // 5-point star
        const spikes=5, outer=size/1.1, inner=size/2.5;
        ctx.beginPath();
        for(let i=0;i<spikes*2;i++){
          const r = i%2===0 ? outer : inner;
          const a = (i * Math.PI / spikes) - Math.PI/2;
          ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r);
        }
        ctx.closePath(); ctx.fill();
        break;
      default:
        ctx.beginPath(); ctx.arc(0,0,size*0.5,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
  };

  function loop(){
    ctx.clearRect(0,0,canvas.width, canvas.height);
    const h = canvas.height / DPR;

    for(let i=particles.length-1; i>=0; i--){
      const p = particles[i];
      // motion
      p.vy += p.gravity;
      p.vx += p.wind;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.spin;

      drawShape(p);
      if(p.y - p.size > h + 8){ particles.splice(i,1); }
    }
    if(particles.length) raf = requestAnimationFrame(loop);
    else cancelAnimationFrame(raf);
  }

  function burstFrom(el, style){
    const rect = el.getBoundingClientRect();
    const origin = {
      x: rect.left + rect.width/2,
      y: rect.top + rect.height/2
    };
    const N = Math.min(140, Math.round((style.density || 18) * 1.2));
    const speed = style.speed || 1;

    for(let i=0;i<N;i++){
      const ang = Math.random() * Math.PI * 2;
      const mag = (8 + Math.random()*6) / speed;
      const size = (style.size || 12) * (0.85 + Math.random()*0.6);
      particles.push({
        x: origin.x, y: origin.y,
        vx: Math.cos(ang)*mag,
        vy: Math.sin(ang)*mag - (8 / speed),
        gravity: 0.12 / speed,
        wind: (Math.random() - 0.5) * (0.04 / speed),
        spin: (Math.random() - 0.5) * 0.25,
        size,
        color: style.color || '#FFD700',
        shape: style.shape || 'dot',
        rot: Math.random()*Math.PI
      });
    }
    if(!raf) raf = requestAnimationFrame(loop);
  }

  // public API expected by the patch
  window.tgConfetti = {
    burst: burstFrom
  };
})();
