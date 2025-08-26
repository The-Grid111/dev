/* main.js — simple, safe bootstrapping for the landing page */

(function () {
  // Render a minimal library list if empty (visual proof of update)
  const list = document.getElementById('library-list');
  if (list && list.children.length === 0) {
    const items = [
      { title: 'Starter Blueprint', note: 'Paste a Save to adapt instantly.' },
      { title: 'Commerce Demo',    note: 'Stripe-ready patterns.' },
      { title: 'Creator Kit',      note: 'Audience & content flows.' }
    ];
    list.innerHTML = items.map(i => `
      <article class="card">
        <h3>${i.title}</h3>
        <p>${i.note}</p>
        <button class="btn btn-small">Preview</button>
      </article>
    `).join('');
  }
})();
