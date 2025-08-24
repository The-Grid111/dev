/* ==================================
   THE GRID — Hotfix & Connectivity (v2)
   - Online/offline banner + retry queue
   - Panel collapse helper
   - Active nav highlight on scroll
   ================================== */

(function () {
  // --- Connectivity banner ---
  const bar = document.createElement('div');
  bar.id = 'net-status';
  bar.innerHTML = '<strong>Offline</strong> — trying to reconnect…';
  document.body.appendChild(bar);

  function syncNet(){
    const on = navigator.onLine;
    bar.classList.toggle('show', !on);
    document.documentElement.classList.toggle('is-offline', !on);
  }
  window.addEventListener('online', ()=>{ syncNet(); toast('Reconnected'); runQueue(); });
  window.addEventListener('offline', syncNet);
  syncNet();

  // --- Toast helper ---
  function toast(msg){
    const n = document.createElement('div');
    n.className = 'toast';
    n.textContent = msg;
    document.body.appendChild(n);
    setTimeout(()=> n.remove(), 2200);
  }

  // --- Resilient fetch queue (use window.__resilientFetch) ---
  const q = [];
  window.__resilientFetch = function(url, opts={}){
    return fetch(url, opts).catch(err=>{
      if(!navigator.onLine){
        return new Promise((res, rej)=>{
          q.push(()=> fetch(url, opts).then(res).catch(rej));
        });
      }
      throw err;
    });
  };
  function runQueue(){
    while(q.length){
      const fn = q.shift();
      try{ fn(); }catch(e){}
    }
  }

  // --- Design panel collapse toggle (frees screen space) ---
  const sheet = document.getElementById('design-panel');
  if(sheet){
    const btn = document.createElement('button');
    btn.className = 'sheet-collapse';
    btn.type = 'button';
    btn.textContent = '↔︎ Collapse';
    sheet.querySelector('.sheet-head')?.appendChild(btn);
    btn.addEventListener('click', ()=> sheet.classList.toggle('collapsed'));
  }

  // --- Active nav highlight on scroll ---
  const links = [...document.querySelectorAll('.nav a[href^="#"]')];
  const map = links.map(a => ({ a, id: a.getAttribute('href').slice(1), el: null }));
  map.forEach(m => m.el = document.getElementById(m.id));
  function setActive(){
    let best = null, bestTop = Infinity;
    map.forEach(m=>{
      if(!m.el) return;
      const rect = m.el.getBoundingClientRect();
      const top = Math.abs(rect.top - 80);
      if(rect.top <= window.innerHeight && top < bestTop){
        bestTop = top; best = m;
      }
    });
    links.forEach(l => l.classList.remove('active'));
    if(best) best.a.classList.add('active');
  }
  window.addEventListener('scroll', setActive, {passive:true});
  setActive();
})();
