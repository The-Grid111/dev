// assets/js/commerce.js
// Wires up pricing actions + luxe confetti. Safe to add/remove.
// Assumes buttons with .details / .choose exist (they do in your index).

(function(){
  const $  = (s, r=document)=>r.querySelector(s);
  const $$ = (s, r=document)=>[...r.querySelectorAll(s)];

  // ---------- Longer plan blurbs (clean, sales-forward) ----------
  const DETAILS = {
    basic: `
      <ul>
        <li><b>Starter library</b>: hand-picked hero clips & images</li>
        <li><b>Copy–paste updates</b>: one-file site refreshes</li>
        <li><b>Email support</b>: responses within 48h</li>
      </ul>
      <p class="muted">Perfect if you want to get live quickly and learn the system.</p>
    `,
    silver: `
      <ul>
        <li><b>Everything in Basic</b> + advanced visual presets</li>
        <li><b>Reel templates</b>: IG/TikTok 9:16 & 16:9 layouts</li>
        <li><b>Priority support</b>: replies within 24h</li>
      </ul>
      <p class="muted">Great for creators who want better motion and faster iteration.</p>
    `,
    gold: `
      <ul>
        <li><b>Customization session</b>: we tune your palette, borders, layout</li>
        <li><b>Admin toolkit</b>: no-code controls, library linking, versioning</li>
        <li><b>Onboarding call</b>: 45 min to set your pipeline</li>
      </ul>
      <p class="muted">Best value for serious use — polish plus workflow help.</p>
    `,
    diamond: `
      <ul>
        <li><b>Custom pipelines</b>: CapCut/Runway presets & export flows</li>
        <li><b>Hands-on build</b>: we help produce your first pack</li>
        <li><b>Priority roadmap</b>: your requests go to the top</li>
      </ul>
      <p class="muted">For teams or power users who want a white-glove setup.</p>
    `
  };

  // ---------- Modal wiring ----------
  function showDetails(tier){
    const m = $('#planModal');
    if (!m) return;
    $('#mTitle').textContent = tier.toUpperCase() + ' plan';
    $('#mBody').innerHTML = DETAILS[tier] || '<p>More info coming soon.</p>';
    m.showModal();
  }

  $$('.details').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const tier = e.currentTarget.closest('.plan')?.dataset?.tier || 'basic';
      showDetails(tier);
    });
  });

  // ---------- Luxe confetti (gold-forward, both sides, falls off-screen) ----------
  const canvas = document.getElementById('fx');
  const ctx = canvas?.getContext('2d');
  let W=0,H=0, parts=[];
  const dpr = Math.max(1, window.devicePixelRatio || 1);

  function size(){
    if (!canvas) return;
    W = canvas.width  = Math.floor(innerWidth  * dpr);
    H = canvas.height = Math.floor(innerHeight * dpr);
  }
  if (canvas){ size(); addEventListener('resize', size, {passive:true}); requestAnimationFrame(tick); }

  function goldConfettiFrom(el){
    if (!canvas || !ctx) return;
    const rect = el.getBoundingClientRect();
    const originY = (rect.top + rect.height*0.2) * dpr;
    const leftX  = (rect.left  - 12) * dpr;
    const rightX = (rect.right + 12) * dpr;

    // Read any saved UI prefs (if present); otherwise tasteful defaults
    const saved = JSON.parse(localStorage.getItem('thegrid.settings')||'{}');
    const density = Math.min(140, Math.max(10, saved?.confetti?.density ?? 60));
    const speed   = Math.min(2.2, Math.max(0.4, saved?.confetti?.speed ?? 1.2));

    const palette = [
      saved?.accent || '#E7B84B', // brand gold
      '#fff8e1', '#d9d2a6', '#c9d2e8'
    ];

    for(let i=0;i<density;i++){
      parts.push(drop(leftX,  originY, +1, speed, palette));
      parts.push(drop(rightX, originY, -1, speed, palette));
    }
  }

  function drop(x,y,dir,s,colors){
    const t = Math.random();
    const sz = 2.5 + Math.random()*5.5;           // smaller, more numerous
    const shimmer = Math.random()<0.2;            // 20% are sparkling
    return {
      x, y,
      vx: (1.2+Math.random()*1.8)*dir*s,
      vy: (-2.6 - Math.random()*2.2)*s,
      g:  0.09*s,
      r:  Math.random()*Math.PI,
      w: sz, h: sz*0.6,
      life: 160 + Math.random()*80,
      c: colors[(Math.random()*colors.length)|0],
      glow: shimmer
    };
  }

  function tick(){
    if (!ctx) return;
    ctx.clearRect(0,0,W,H);
    parts = parts.filter(p=>p.life>0 && p.y < H + 40*dpr);

    for (const p of parts){
      p.vy += p.g;
      p.x  += p.vx;
      p.y  += p.vy;
      p.r  += 0.18;
      p.life--;

      ctx.save();
      ctx.translate(p.x,p.y);
      ctx.rotate(p.r);
      if (p.glow){
        ctx.shadowColor = 'rgba(231,184,75,.65)';
        ctx.shadowBlur  = 14;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.fillStyle   = p.c;
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life/180));
      ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
      ctx.restore();
    }
    requestAnimationFrame(tick);
  }

  // Hook choose buttons: confetti + gentle scroll into view
  $$('.choose').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const card = e.currentTarget.closest('.plan') || document.body;
      card.scrollIntoView({behavior:'smooth', block:'center'});
      goldConfettiFrom(card);
    });
  });

  // Also celebrate join button
  const join = $('#btnJoin');
  if (join){
    join.addEventListener('click', ()=>{
      goldConfettiFrom(join);
      // Optional: nudge user to pricing
      const plans = document.getElementById('plans');
      if (plans) plans.scrollIntoView({behavior:'smooth', block:'start'});
    });
  }
})();
