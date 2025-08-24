/* THE GRID — Hotfix & UX helpers v3 */
(function () {
  // Connectivity banner
  const bar = document.createElement('div');
  bar.id = 'net-status';
  bar.innerHTML = '<strong>Offline</strong> — trying to reconnect…';
  Object.assign(bar.style,{
    position:'fixed', left:'50%', bottom:'12px', transform:'translateX(-50%)',
    background:'#221a1a', color:'#ffdede', border:'1px solid #6f3a3a',
    padding:'8px 12px', borderRadius:'12px', boxShadow:'0 8px 30px rgba(0,0,0,.4)',
    opacity:'0', pointerEvents:'none', transition:'opacity .2s ease', zIndex:'120', fontWeight:'600', fontSize:'14px'
  });
  document.body.appendChild(bar);
  function syncNet(){
    const on = navigator.onLine;
    bar.style.opacity = on ? '0' : '1';
    document.documentElement.classList.toggle('is-offline', !on);
  }
  window.addEventListener('online', ()=>{ syncNet(); toast('Reconnected'); runQueue(); });
  window.addEventListener('offline', syncNet);
  syncNet();

  // Toast
  function toast(msg){
    const n = document.createElement('div');
    n.className = 'toast';
    Object.assign(n.style,{
      position:'fixed', right:'12px', bottom:'12px', zIndex:'121',
      background:'var(--panel)', border:'1px solid var(--line)',
      padding:'10px 14px', borderRadius:'12px', opacity:'0'
    });
    n.textContent = msg;
    document.body.appendChild(n);
    n.animate(
      [{opacity:0, transform:'translateY(6px)'},{opacity:1, transform:'translateY(0)'},{opacity:1},{opacity:0, transform:'translateY(6px)'}],
      {duration:2200, easing:'ease'}
    ).onfinish = ()=> n.remove();
  }

  // Resilient fetch queue
  const q = [];
  window.__resilientFetch = function(url, opts={}){
    return fetch(url, opts).catch(err=>{
      if(!navigator.onLine){
        return new Promise((res, rej)=> q.push(()=> fetch(url, opts).then(res).catch(rej)));
      }
      throw err;
    });
  };
  function runQueue(){ while(q.length){ try{ q.shift()(); }catch{} } }

  // Expose a tiny opener for commerce.js fallback
  window.__grid_openLayer = (el)=> {
    const ov = document.getElementById('ui-overlay');
    document.body.classList.add('no-scroll');
    ov?.classList.remove('hidden'); el?.classList.remove('hidden');
    ov?.classList.add('show'); el?.classList.add('show');
  };

  // Active nav on scroll
  const links=[...document.querySelectorAll('.nav a[href^="#"]')];
  const map=links.map(a=>({a, id:a.getAttribute('href').slice(1), el:null}));
  map.forEach(m=> m.el=document.getElementById(m.id));
  function setActive(){
    let best=null, bestTop=Infinity;
    map.forEach(m=>{
      if(!m.el) return;
      const rect=m.el.getBoundingClientRect();
      const top = Math.abs(rect.top - 80);
      if(rect.top <= window.innerHeight && top < bestTop){ bestTop=top; best=m; }
    });
    links.forEach(l=>l.classList.remove('active'));
    if(best) best.a.classList.add('active');
  }
  window.addEventListener('scroll', setActive, {passive:true});
  setActive();
})();
