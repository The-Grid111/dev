(() => {
  // Subtle parallax on hero
  const hero = document.querySelector('.hero');
  if (hero) {
    window.addEventListener('scroll', () => {
      const y = Math.min(160, window.scrollY * 0.25);
      hero.style.transform = `translateY(${y * 0.02}px)`;
    }, {passive:true});
  }
})();
