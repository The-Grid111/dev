import { ui } from './ui.js';
import { plans, setPlanLocal, getPlanLocal, startCheckout } from './commerce.js';
import { ensureStripe } from './stripe.js';

// ---------- Simple SPA router ----------
const routes = ['#home', '#library', '#pricing', '#how-it-works'];
function go(hash){
  if(!routes.includes(hash)) hash = '#home';
  location.hash = hash;
  // scroll into view
  const el = document.querySelector(hash.replace('#','.') ? hash : hash);
  if (el) el.scrollIntoView({behavior:'smooth', block:'start'});
}
document.querySelectorAll('[data-route]').forEach(btn => btn.addEventListener('click', e => go(e.currentTarget.dataset.route)));
window.addEventListener('hashchange', () => go(location.hash || '#home'));

// ---------- Header actions ----------
document.getElementById('btnProfile').addEventListener('click', openProfile);
document.getElementById('btnPasteSave').addEventListener('click', openPasteSave);
document.getElementById('btnAdmin').addEventListener('click', openAdminPanel);

// Trial ribbon
document.getElementById('btnStartTrialRibbon').addEventListener('click', () => choosePlan('TRIAL'));
document.getElementById('btnLaunchTrial').addEventListener('click', () => choosePlan('TRIAL'));

// Pricing buttons
document.querySelectorAll('.price-card .plan').forEach(btn=>{
  btn.addEventListener('click', () => choosePlan(btn.dataset.plan));
});

// Library previews
document.querySelectorAll('[data-blueprint]').forEach(btn=>{
  btn.addEventListener('click', e=>{
    const key = e.currentTarget.dataset.blueprint;
    ui.modal.open('Preview', `
      <p><strong>${label(key)}</strong> preview is ready.</p>
      <p>Paste a Save to adapt, or load a demo Save now.</p>
    `, [
      {label:'Load demo Save', variant:'primary', onClick:()=>loadDemoSave(key)},
      {label:'Close', onClick:ui.modal.close}
    ]);
  });
});

function label(k){
  return ({
    starter:'Starter Blueprint',
    commerce:'Commerce Demo',
    creator:'Creator Kit'
  })[k] || k;
}

// ---------- Profile ----------
function openProfile(){
  const prof = getProfile();
  ui.modal.open('Profile', `
    <div class="grid">
      <label>Name<br/><input id="pf_name" value="${escape(prof.name||'')}" placeholder="Display name"></label><br/>
      <label>Email<br/><input id="pf_email" value="${escape(prof.email||'')}" placeholder="name@domain.com"></label><br/>
      <p class="muted">Plan: <strong>${getPlanLocal() || 'None'}</strong></p>
    </div>
  `, [
    {label:'Save', variant:'primary', onClick:()=>{
      const name = document.getElementById('pf_name').value.trim();
      const email = document.getElementById('pf_email').value.trim();
      saveProfile({name,email});
      ui.toast.ok('Profile saved locally');
      ui.modal.close();
    }},
    {label:'Close', onClick:ui.modal.close}
  ]);
}

// ---------- Paste Save ----------
function openPasteSave(){
  const existing = localStorage.getItem('grid.save') || '';
  ui.modal.open('Paste Save', `
    <textarea id="saveInput" rows="10" placeholder="Paste your Save JSON here...">${escape(existing)}</textarea>
    <p class="muted">We store this locally in your browser. Admins can import to the site Library later.</p>
  `, [
    {label:'Store', variant:'primary', onClick:()=>{
      const txt = document.getElementById('saveInput').value.trim();
      if (!txt) return ui.toast.warn('Nothing pasted.');
      localStorage.setItem('grid.save', txt);
      ui.toast.ok('Save stored locally');
      ui.modal.close();
    }},
    {label:'Close', onClick:ui.modal.close}
  ]);
}

// ---------- Admin panel (local-only) ----------
function openAdminPanel(){
  // This is intentionally local-only. A simple "unlock" pattern for now.
  const admin = JSON.parse(localStorage.getItem('grid.admin') || 'null');
  const unlocked = admin && admin.unlocked;
  ui.modal.open('Admin (local)', `
    <div class="grid">
      <label>Unlock code<br/><input id="adm_code" placeholder="Enter one-time code" ${unlocked ? 'value="•••••• (unlocked)" disabled' : ''}></label>
      <label>Feature video URL<br/><input id="adm_video" placeholder="https://..." value="${escape(localStorage.getItem('grid.video')||'')}"></label>
      <label>Pinned trial ribbon<br/>
        <select id="adm_ribbon">
          <option value="on" ${isRibbonOn()?'selected':''}>On</option>
          <option value="off" ${!isRibbonOn()?'selected':''}>Off</option>
        </select>
      </label>
    </div>
    <p class="muted">Admins can rearrange sections soon. For now, use this panel for quick tweaks. Stored locally.</p>
  `, [
    {label: unlocked ? 'Save' : 'Unlock & Save', variant:'primary', onClick:()=>{
      const code = (document.getElementById('adm_code')||{}).value || '';
      if (!unlocked && code.trim().length < 4) return ui.toast.warn('Enter a valid unlock code (any 4+ chars for local dev).');
      localStorage.setItem('grid.admin', JSON.stringify({unlocked:true, at:Date.now()}));
      const video = document.getElementById('adm_video').value.trim();
      const ribbon = document.getElementById('adm_ribbon').value;
      localStorage.setItem('grid.video', video);
      localStorage.setItem('grid.ribbon', ribbon);
      applyAdminPrefs();
      ui.toast.ok('Admin settings saved locally');
      ui.modal.close();
    }},
    {label:'Close', onClick:ui.modal.close}
  ]);
}

// ---------- Plans / Checkout ----------
async function choosePlan(planId){
  const plan = plans[planId];
  if(!plan){ ui.toast.warn('Unknown plan.'); return; }

  // If Stripe publishable key exists, try real checkout; else store locally.
  const hasLiveStripe = await ensureStripe();

  if (hasLiveStripe && plan.stripePriceId){
    startCheckout(planId).catch(err=>{
      console.warn(err);
      ui.toast.warn('Checkout could not start. Using local set instead.');
      setPlanLocal(planId);
      reflectPlan();
    });
  } else {
    setPlanLocal(planId);
    reflectPlan();
    ui.toast.ok(`Plan set locally to ${planId}. Add Stripe IDs for real checkout.`);
  }
}

function reflectPlan(){
  const current = getPlanLocal();
  document.querySelectorAll('.price-card').forEach(card=>{
    const id = card.dataset.plan;
    const btn = card.querySelector('button.plan');
    if(!btn) return;
    if(id === current){
      btn.textContent = 'Current Plan';
      btn.disabled = true;
      btn.classList.remove('btn-ghost'); btn.classList.add('btn-primary');
    }else{
      btn.disabled = false;
      btn.textContent = plans[id]?.cta || 'Choose';
      btn.classList.remove('btn-primary'); btn.classList.add('btn-ghost');
    }
  });
}

// ---------- Demo saves ----------
function loadDemoSave(kind){
  const demo = ({
    starter: {meta:{name:'Starter Demo'}, content:'Hello, Starter!'},
    commerce:{meta:{name:'Commerce Demo'}, content:'Stripe patterns ready.'},
    creator: {meta:{name:'Creator Demo'}, content:'Audience & flows.'}
  })[kind];
  localStorage.setItem('grid.save', JSON.stringify(demo,null,2));
  ui.toast.ok(`${label(kind)} Save loaded locally.`);
  ui.modal.close();
}

// ---------- Profile storage ----------
function getProfile(){
  try{ return JSON.parse(localStorage.getItem('grid.profile')||'{}'); }
  catch{return {}}
}
function saveProfile(obj){
  localStorage.setItem('grid.profile', JSON.stringify(obj||{}));
}

// ---------- Admin prefs ----------
function isRibbonOn(){ return (localStorage.getItem('grid.ribbon')||'on') === 'on'; }
function applyAdminPrefs(){
  // ribbon
  document.getElementById('trialRibbon').style.display = isRibbonOn() ? '' : 'none';
  // video
  const src = (localStorage.getItem('grid.video')||'').trim();
  const video = document.getElementById('heroVideo');
  const empty = document.getElementById('videoEmpty');
  if(src){
    video.querySelector('source').src = src;
    video.load();
    video.style.display='block';
    empty.style.display='none';
  }else{
    video.style.display='none';
    empty.style.display='flex';
  }
}

// ---------- Utilities ----------
function escape(s=''){ return s.replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }

// ---------- Init ----------
applyAdminPrefs();
reflectPlan();
go(location.hash || '#home');
ui.greet();
