/* Utility */
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];

/* Panels / overlay */
const overlay = $('#ui-overlay');
const sheet   = $('#design-panel');
const join    = $('#join-modal');
const details = $('#details-modal');
const detailsTitle = $('#details-title');
const detailsList  = $('#details-list');
const detailsChoose= $('#details-choose');

function openLayer(el){
  document.body.classList.add('no-scroll');
  overlay.classList.remove('hidden'); el.classList.remove('hidden');
  overlay.classList.add('show'); el.classList.add('show');
}
function closeLayers(){
  document.body.classList.remove('no-scroll');
  overlay.classList.remove('show'); $$('.modal,.sheet').forEach(x=>x.classList.remove('show'));
  setTimeout(()=>{ overlay.classList.add('hidden'); $$('.modal,.sheet').forEach(x=>x.classList.add('hidden')); },200);
}

/* Wire header buttons */
$$('[data-action="customize"]').forEach(b=>{
  b.addEventListener('click', e=>{e.preventDefault(); openLayer(sheet);}, {passive:false});
});
$$('[data-action="join"]').forEach(b=>{
  b.addEventListener('click', e=>{e.preventDefault(); openLayer(join);}, {passive:false});
});
overlay.addEventListener('click', closeLayers);
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeLayers(); });
$$('[data-close]').forEach(b=>b.addEventListener('click', closeLayers));

/* Live design controls */
const root = document.documentElement;
$('#ctrl-accent')?.addEventListener('input', e=>root.style.setProperty('--accent', e.target.value));
$('#ctrl-radius')?.addEventListener('input', e=>root.style.setProperty('--card-radius', `${e.target.value}px`));
$('#ctrl-glow')?.addEventListener('input',   e=>root.style.setProperty('--glow', e.target.value));

/* Library click (just visual confirmation for now) */
$$('.grid.tiles .tile').forEach(tile=>{
  tile.addEventListener('click', ()=>{
    const t = tile.dataset.title || tile.textContent.trim();
    alert(`Set hero to: ${t}`);
  });
});

/* Plan Choose + Details */
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
  // Fill contact subject for now (simulated checkout)
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
    const json = btn.getAttribute('data-details');
    try{
      const payload = JSON.parse(json);
      const article = btn.closest('.plan');
      const code = article?.dataset?.plan || payload.title;
      showDetails(payload, code);
    }catch(err){ console.error('Invalid details payload', err); }
  }, {passive:false});
});
