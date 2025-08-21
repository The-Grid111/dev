/* assets/js/main.js — full redo
   - Smooth scrolling for CTAs & nav
   - “Choose / Details / Start Setup / Order Pack / Get Pack” → scroll & prefill contact form
   - Builds simple Library tiles from assets/manifest.json (optional)
   - Contact form uses mailto: with prefilled subject/body (no backend needed)
*/

(() => {
  const qs  = (s, el=document) => el.querySelector(s);
  const qsa = (s, el=document) => [...el.querySelectorAll(s)];
  const byId = id => document.getElementById(id);

  // -------- Smooth scroll helper
  const smoothScrollTo = (target) => {
    const el = typeof target === 'string' ? qs(target) : target;
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.pageYOffset - 12;
    window.scrollTo({ top: y, behavior: 'smooth' });
  };

  // -------- Contact form helpers
  const contact = {
    form: null,
    name: null,
    email: null,
    subject: null,
    message: null,
    setSubject(txt) {
      if (this.subject) this.subject.value = txt || '';
      // Focus subject if user was sent here via a button
      if (this.subject) this.subject.focus({ preventScroll: true });
    },
    init() {
      this.form    = qs('#contact-form') || qs('form[action="#contact"]') || qs('form');
      this.name    = qs('#contact-name')    || qs('input[name="name"], input[placeholder*="Name"]');
      this.email   = qs('#contact-email')   || qs('input[type="email"]');
      this.subject = qs('#contact-subject') || qs('input[name="subject"]');
      this.message = qs('#contact-message') || qs('textarea');

      if (!this.form) return;

      // If a subject was passed in the URL (?subject=xxx), apply it.
      const urlParams = new URLSearchParams(location.search);
      const presetSubject = urlParams.get('subject');
      if (presetSubject) this.setSubject(presetSubject);

      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        const to = 'gridcoresystems@gmail.com'; // change if you ever need to
        const subj = encodeURIComponent(this.subject?.value?.trim() || 'Website enquiry');
        const lines = [];
        if (this.name?.value)  lines.push(`Name: ${this.name.value}`);
        if (this.email?.value) lines.push(`Email: ${this.email.value}`);
        if (this.message?.value) {
          lines.push('');
          lines.push(this.message.value);
        }
        const body = encodeURIComponent(lines.join('\n'));
        // Open mail client
        window.location.href = `mailto:${to}?subject=${subj}&body=${body}`;
      });
    }
  };

  // -------- CTA wiring
  const wireCTAs = () => {
    const map = [
      // [selector, targetSection, optionalSubject]
      ['a[href="#library"], button[data-action="open-library"]', '#library', ''],
      ['a[href="#pricing"], button[data-action="see-pricing"]', '#pricing', ''],
      ['a[href="#contact"], button[data-action="contact"]', '#contact', ''],

      ['button[data-plan="BASIC"]',   '#contact', 'Plan: BASIC'],
      ['button[data-plan="SILVER"]',  '#contact', 'Plan: SILVER'],
      ['button[data-plan="GOLD"]',    '#contact', 'Plan: GOLD'],
      ['button[data-plan="DIAMOND"]', '#contact', 'Plan: DIAMOND'],

      ['button[data-action="start-setup"]', '#contact', 'Service: Setup'],
      ['button[data-action="order-reels"]', '#contact', 'Service: Reels'],
      ['button[data-action="get-templates"]', '#contact', 'Service: Templates'],
    ];

    // Turn plain anchor CTAs (Open Library / See Pricing) into smooth scroll
    qsa('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (!id || id === '#') return;
        const tgt = qs(id);
        if (!tgt) return;
        e.preventDefault();
        smoothScrollTo(tgt);
      });
    });

    // Buttons with data attributes
    map.forEach(([selector, target, subject]) => {
      qsa(selector).forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const tgt = qs(target);
          if (subject) contact.setSubject(subject);
          if (tgt) smoothScrollTo(tgt);
        });
      });
    });
  };

  // -------- Library builder (optional, from assets/manifest.json)
  // It looks for headings with the text "Featured Reels" and "Hero Alternates"
  // and inserts a flex grid of tiles below them.
  const buildLibrary = async () => {
    // where to mount
    const ensureMountAfterHeading = (headingText, mountId) => {
      let mount = byId(mountId);
      if (mount) return mount;
      const h2 = qsa('h2, h3').find(h => h.textContent.trim().toLowerCase() === headingText.toLowerCase());
      if (!h2) return null;
      mount = document.createElement('div');
      mount.id = mountId;
      mount.className = 'tile-grid';
      h2.insertAdjacentElement('afterend', mount);
      return mount;
    };

    const featuredMount = ensureMountAfterHeading('Featured Reels', 'featured-reels');
    const heroAltMount  = ensureMountAfterHeading('Hero Alternates', 'hero-alternates');
    if (!featuredMount && !heroAltMount) return;

    let manifest = null;
    try {
      const res = await fetch('assets/manifest.json', { cache: 'no-store' });
      if (!res.ok) throw new Error('manifest fetch failed');
      manifest = await res.json();
    } catch (_) {
      // Graceful fallback: show simple placeholders if manifest not found
      if (featuredMount) featuredMount.innerHTML = `<p class="muted">Add items via <code>assets/manifest.json</code> to populate the Library.</p>`;
      return;
    }

    // Expect manifest like:
    // { images: [{src:"assets/images/hero_1.jpg", tags:["hero"] }], videos: [{src:"assets/videos/hero_1.mp4", poster:"...", tags:["9x16","hero"]}] }
    const items = [
      ...(Array.isArray(manifest.videos) ? manifest.videos : []),
      ...(Array.isArray(manifest.images) ? manifest.images : []),
    ];

    const makeTile = (item) => {
      const btn = document.createElement('button');
      btn.className = 'tile';
      btn.type = 'button';
      btn.setAttribute('data-tags', (item.tags || []).join(','));
      // Image tiles
      if (/\.(png|jpg|jpeg|webp|gif)$/i.test(item.src)) {
        btn.innerHTML = `<img loading="lazy" src="${item.src}" alt="${item.alt || 'Image'}">`;
      } else if (/\.(mp4|webm|mov)$/i.test(item.src)) {
        // Video tiles (use poster if provided)
        const poster = item.poster ? ` poster="${item.poster}"` : '';
        btn.innerHTML = `<video${poster} preload="none" muted playsinline></video>`;
        // lazy set src on interaction to avoid auto-download
        btn.addEventListener('pointerenter', () => {
          const v = qs('video', btn);
          if (v && !v.src) v.src = item.src;
        }, { once: true });
      } else {
        btn.textContent = item.title || item.src.split('/').pop();
      }
      btn.addEventListener('click', () => setHero(item));
      return btn;
    };

    const setHero = (item) => {
      // A minimal “Hero”: if you add <figure id="hero"> in HTML, we will populate it.
      let hero = byId('hero');
      if (!hero) {
        // Create a hero block at top of Library if missing
        const libHeading = byId('library') || qsa('h2, h1').find(h => h.textContent.trim().toLowerCase() === 'library');
        hero = document.createElement('figure');
        hero.id = 'hero';
        hero.className = 'hero';
        if (libHeading) libHeading.insertAdjacentElement('afterend', hero);
        else document.body.prepend(hero);
      }
      hero.innerHTML = '';
      if (/\.(png|jpg|jpeg|webp|gif)$/i.test(item.src)) {
        hero.innerHTML = `<img src="${item.src}" alt="${item.alt || 'Selected image'}">`;
      } else {
        const poster = item.poster ? ` poster="${item.poster}"` : '';
        hero.innerHTML = `<video${poster} src="${item.src}" controls playsinline></video>`;
      }
      smoothScrollTo(hero);
    };

    // Simple split: anything tagged 'hero' goes to hero alternates, otherwise featured
    const heroAlt = items.filter(it => (it.tags || []).map(t => t.toLowerCase()).includes('hero'));
    const featured = items.filter(it => !heroAlt.includes(it));

    if (featuredMount) {
      featuredMount.innerHTML = '';
      featured.slice(0, 8).forEach(it => featuredMount.appendChild(makeTile(it)));
    }
    if (heroAltMount) {
      heroAltMount.innerHTML = '';
      heroAlt.slice(0, 8).forEach(it => heroAltMount.appendChild(makeTile(it)));
    }
  };

  // -------- Kickoff
  document.addEventListener('DOMContentLoaded', () => {
    contact.init();
    wireCTAs();
    buildLibrary();
  });
})();
