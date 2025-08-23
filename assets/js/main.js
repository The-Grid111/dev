/* tiny helpers */
const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];

/* layers */
const overlay = $('#ui-overlay');
const sheet   = $('#design-panel');
const join    = $('#join-modal');
const details = $('#details-modal');
const detailsTitle  = $('#details-title');
const detailsList   = $('#details-list');
const detailsChoose = $('#details-choose');

function openLayer(el){
  document.body.classList.add('no-scroll');
  overlay.classList.remove('hidden'); el.classList.remove('hidden');
  requestAnimationFrame(()=>{ overlay.classList.add('show'); el.classList.add('show'); });
}
function closeLayers(){
  document.body.classList.remove('no-scroll');
  overlay.classList.remove('show'); $$('.modal,.sheet').forEach(x=>x.classList.remove('show'));
  setTimeout(()=>{ overlay.classList.add('hidden'); $$('.modal,.sheet').forEach(x=>x.classList.add('hidden')); }, 180);
}

/* wire header */
$$('[data-action="customize"]').forEach(b=>{
  b.addEventListener('click', e=>{e.preventDefault(); openLayer(sheet);}, {passive:false});
});
$$('[data-action="join"]').forEach(b=>{
  b.addEventListener('click', e=>{e.preventDefault(); openLayer(join);}, {passive:false});
});
overlay?.addEventListener('click', closeLayers);
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeLayers(); });
$$('[data-close]').forEach(b=>b.addEventListener('click', closeLayers));

/* live controls */
const root = document.documentElement;
$('#ctrl-accent')?.addEventListener('input', e=>root.style.setProperty('--accent', e.target.value));
$('#ctrl-radius')?.addEventListener('input', e=>root.style.setProperty('--card-radius', `${e.target.value}px`));
$('#ctrl-glow')  ?.addEventListener('input', e=>root.style.setProperty('--glow', e.target.value));

/* library visual click */
$$('.grid.tiles .tile').forEach(tile=>{
  tile.addEventListener('click', ()=>{
    const t = tile.dataset.title || tile.textContent.trim();
    alert(`Set hero to: ${t}`);
  });
});

/* plan choose + details */
function showDetails(payload, planCode){
  detailsTitle.textContent = payload.title || 'Plan Details';
  detailsList.innerHTML = '';
  (payload.points||[]).forEach(p=>{
    const li=document.createElement('li'); li.textContent=p; detailsList.appendChild(li);
  });
  detailsChoose.onclick = () => { closeLayers(); confirmChoice(planCode || payload.title); };
  openLayer(details);
}
function confirmChoice(code){
  const subject = $('#subject');
  if(subject) subject.value = `Join ${code}`;
  alert(`Selected: ${code}`);
}
$$('[data-choose]').forEach(btn=>{
  btn.addEventListener('click', e=>{
    e.preventDefault(); confirmChoice(btn.dataset.choose);
  }, {passive:false});
});
$$('[data-details]').forEach(btn=>{
  btn.addEventListener('click', e=>{
    e.preventDefault();
    try{
      const payload = JSON.parse(btn.getAttribute('data-details'));
      const code = btn.closest('.plan')?.dataset?.plan || payload.title;
      showDetails(payload, code);
    }catch(err){ console.error('Invalid details payload', err); }
  }, {passive:false});
});

/* hero video fallback */
(function(){
  const vid = $('#heroVideo');
  const poster = $('#heroPoster');
  if(!vid) return;
  const showPoster = ()=>{ poster.style.opacity = 1; };
  vid.addEventListener('error', showPoster);
  vid.addEventListener('stalled', showPoster);
  vid.addEventListener('loadeddata', ()=>{ poster.style.opacity = 0; });
})();
