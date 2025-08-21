// v11 boot
console.log("THE GRID main.js v11 loaded");

// smooth scroll for local nav
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click',e=>{
    const id=a.getAttribute('href');
    const el=document.querySelector(id);
    if(el){ e.preventDefault(); el.scrollIntoView({behavior:'smooth'}); }
  });
});

// ensure build label matches
const b=document.getElementById('build');
if(b) b.textContent='Build: v11';