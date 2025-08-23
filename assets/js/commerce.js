/* THE GRID — lightweight commerce + contact helpers
   Static-site friendly (GitHub Pages). No gateways yet.
   Persists user intent locally so you don’t lose state. */

(() => {
  const CART_KEY = 'tgCart.v1';
  const USER_KEY = 'tgUser.v1';

  const $  = (s,r=document)=>r.querySelector(s);
  const $$ = (s,r=document)=>[...r.querySelectorAll(s)];

  /* ---------------- Cart state ---------------- */
  function readCart(){ try{return JSON.parse(localStorage.getItem(CART_KEY)||'{"items":[]}');}catch{ return {items:[]} } }
  function saveCart(cart){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); }
  function addItem(kind, code, meta={}){
    const cart = readCart();
    cart.items = cart.items.filter(i => !(i.kind===kind && i.code===code));
    cart.items.push({kind, code, meta, at:new Date().toISOString()});
    saveCart(cart);
    return cart;
  }
  function clearCart(){ saveCart({items:[]}); }

  /* ---------------- Choose & Details ----------------
     main.js already wires buttons for UI. Here we store intent
     and offer a checkout-by-email flow when the user clicks Join/Choose. */
  function onChoose(code){
    addItem('plan', code);
    // Pre-fill contact subject if present
    const subject = document.querySelector('#subject');
    if(subject) subject.value = `Join ${code}`;
  }

  // Add listener for all [data-choose] (defensive duplicate ok)
  $$('[data-choose]').forEach(btn=>{
    btn.addEventListener('click', ()=> onChoose(btn.dataset.choose), {passive:true});
  });

  /* ---------------- Checkout by email ----------------
     Generates a mailto link with current cart contents */
  function checkoutEmailLink(){
    const cart = readCart();
    const email = (window.TG_CONTACT_EMAIL || 'gridcoresystems@gmail.com');
    const subject = encodeURIComponent(`THE GRID — Checkout request (${cart.items.map(i=>i.code).join(', ') || 'No selection'})`);
    const bodyLines = [
      `Hi,`,
      ``,
      `I'd like to proceed with the following:`,
      ...cart.items.map(i=>`• ${i.kind.toUpperCase()} — ${i.code}`),
      ``,
      `My details:`,
      `Name: `,
      `Email: `,
      ``,
      `Additional notes: `,
      ``,
      `Sent from THE GRID site.`,
    ];
    const body = encodeURIComponent(bodyLines.join('\n'));
    return `mailto:${email}?subject=${subject}&body=${body}`;
  }

  // Wire “Join Now” inside the modal footer if present
  document.addEventListener('click', (e)=>{
    const t = e.target;
    if(t.matches('[data-checkout-email]')){
      e.preventDefault();
      location.href = checkoutEmailLink();
    }
  });

  /* ---------------- Contact form helper ----------------
     If you click Send, we open an email draft with the form content.
     (Can be swapped to a real endpoint later.) */
  const contactForm = document.querySelector('form.card.contact');
  if(contactForm){
    contactForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const form = new FormData(contactForm);
      const name = form.get('name') || contactForm.querySelector('input[type="text"]')?.value || '';
      const email= form.get('email')|| contactForm.querySelector('input[type="email"]')?.value || '';
      const subj = document.querySelector('#subject')?.value || 'General enquiry';
      const msg  = contactForm.querySelector('textarea')?.value || '';

      const to   = (window.TG_CONTACT_EMAIL || 'gridcoresystems@gmail.com');
      const subject = encodeURIComponent(`THE GRID — ${subj}`);
      const body = encodeURIComponent([
        `Name: ${name}`,
        `Email: ${email}`,
        ``,
        msg,
        ``,
        `Cart snapshot:`,
        JSON.stringify(readCart(), null, 2)
      ].join('\n'));
      location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    });
  }

  /* ---------------- Owner convenience ---------------- */
  // Expose small API for console use (optional)
  window.TG = Object.assign(window.TG||{}, {
    cart: { read:readCart, save:saveCart, add:addItem, clear:clearCart },
    checkoutEmailLink,
  });

  // If details modal has a “Choose” button, add email checkout option:
  const detailsModal = document.querySelector('#details-modal .modal-foot');
  if(detailsModal){
    const a = document.createElement('a');
    a.className = 'btn ghost';
    a.textContent = 'Email Checkout';
    a.href = '#';
    a.setAttribute('data-checkout-email','1');
    detailsModal.insertBefore(a, detailsModal.firstChild);
  }
})();
