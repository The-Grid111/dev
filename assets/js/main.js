// dev/assets/js/main.js
// Wire plan buttons + force top-of-page on load

document.addEventListener('DOMContentLoaded', () => {
  // Always start at the top (fixes “load at bottom” on iOS/GitHub Pages)
  try {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
      window.scrollTo(0, 0);
    }
  } catch {}

  // Helpers
  const smooth = (el) => el && el.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Targets we can find even without hardcoded IDs
  const contactSection =
    document.querySelector('#contact') ||
    document.querySelector('form')?.closest('section') ||
    document.querySelector('form');

  const subjectInput =
    document.querySelector('input[name="subject"]') ||
    document.querySelector('#subject');

  // Attach handlers to all visible buttons/links
  document.querySelectorAll('button, a').forEach((el) => {
    const label = (el.textContent || '').trim().toLowerCase();

    // CHOOSE → jump to Contact and prefill Subject
    if (label === 'choose') {
      el.addEventListener('click', (e) => {
        e.preventDefault();

        const card = el.closest('section, article, div') || document.body;
        const titleEl =
          card.querySelector('h1, h2, h3, h4, .card-title') ||
          document.querySelector('h1, h2, h3');

        const planTitle = (titleEl?.textContent || 'Plan').trim();
        if (subjectInput) subjectInput.value = `Join ${planTitle}`;

        smooth(contactSection || document.body);
      });
    }

    // DETAILS → focus the plan card (no page jump)
    if (label === 'details') {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const card = el.closest('section, article, div');
        smooth(card || document.body);
      });
    }

    // Start Setup / Order Pack / Get Pack → send to Contact with context
    if (['start setup', 'order pack', 'get pack'].includes(label)) {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        if (subjectInput) subjectInput.value = label.replace(/\b\w/g, c => c.toUpperCase());
        smooth(contactSection || document.body);
      });
    }
  });
});
