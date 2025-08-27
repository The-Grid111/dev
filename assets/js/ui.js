export const ui = (()=>{

  // Toasts
  const $toasts = document.getElementById('toasts');
  function toast(msg, cls=''){ 
    const div = document.createElement('div'); 
    div.className = `toast ${cls}`;
    div.textContent = msg;
    $toasts.appendChild(div);
    setTimeout(()=>{ div.style.opacity='0'; }, 2400);
    setTimeout(()=>{ div.remove(); }, 3000);
  }
  function ok(m){ toast(m,'toast-ok'); }
  function warn(m){ toast(m,'toast-warn'); }

  // Modal
  const $overlay = document.getElementById('overlay');
  const $modal = document.getElementById('modal');
  const $title = document.getElementById('modalTitle');
  const $body = document.getElementById('modalBody');
  const $actions = document.getElementById('modalActions');
  document.getElementById('modalClose').addEventListener('click', close);
  $overlay.addEventListener('click', close);

  function open(title, html, actions=[]){
    $title.textContent = title;
    $body.innerHTML = html;
    $actions.innerHTML = '';
    actions.forEach(a=>{
      const btn = document.createElement('button');
      btn.className = 'btn ' + (a.variant==='primary'?'btn-primary':(a.variant==='outline'?'btn-outline':'btn-ghost'));
      btn.textContent = a.label;
      btn.addEventListener('click', a.onClick || (()=>{}));
      $actions.appendChild(btn);
    });
    $overlay.classList.remove('hidden');
    $modal.classList.remove('hidden');
  }
  function close(){
    $overlay.classList.add('hidden');
    $modal.classList.add('hidden');
  }

  // Greeting toast (time of day)
  function greet(){
    const h = new Date().getHours();
    const who = (JSON.parse(localStorage.getItem('grid.profile')||'{}').name)||'there';
    const part = h<12?'morning':(h<18?'afternoon':'evening');
    ok(`Good ${part}, ${who} — welcome back to THE GRID.`);
  }

  return { toast, ok, warn, modal:{open, close}, greet };
})();
