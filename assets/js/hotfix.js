/* Simple wiring to restore interactions + library rendering
   Safe to include alongside your existing main.js (runs after).
*/
(() => {
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];

  // ---- Ready ----
  document.addEventListener('DOMContentLoaded', () => {
    // Buttons in header / hero
    const panel = $('#panel');
    const planModal = $('#planModal');

    $('#btnCustomize')?.addEventListener('click', () => panel?.showModal());
    $('#btnJoin')?.addEventListener('click', () => {
      $('#plans')?.scrollIntoView({behavior:'smooth', block:'start'});
    });

    // CTA buttons
    $$('a[href="#library"]').forEach(a =>
      a.addEventListener('click', e => {
        e.preventDefault();
        $('#library')?.scrollIntoView({behavior:'smooth', block:'start'});
      })
    );
    $$('a[href="#plans"]').forEach(a =>
      a.addEventListener('click', e => {
        e.preventDefault();
        $('#plans')?.scrollIntoView({behavior:'smooth', block:'start'});
      })
    );

    // Plan “Choose/Details”
    function openPlanDetails(tier) {
      if (!planModal) return;
      const copy = {
        basic: {
          title: 'BASIC plan',
          who: 'Creators getting started or teams who want a clean base fast.',
          gets: [
            'Starter templates & blocks',
            'Access to the media library (videos, images, logos)',
            'Email support within 48h',
            '7-day refund guarantee',
            'Upgrade anytime — keep your settings, no rebuilds'
          ]
        },
        silver: {
          title: 'SILVER plan',
          who: 'Teams that want advanced effects without custom builds.',
          gets: [
            'Everything in Basic',
            'Advanced effects & presets',
            'Priority email (24h)'
          ]
        },
        gold: {
          title: 'GOLD plan',
          who: 'Creators who want hands-on help and automations.',
          gets: [
            'Full customization session',
            'Admin toolkit & automations',
            '1:1 onboarding (45 min)'
          ]
        },
        diamond: {
          title: 'DIAMOND plan',
          who: 'Businesses needing custom pipelines & priority turnaround.',
          gets: [
            'Custom pipelines & integrations',
            'Hands-on help building your stack',
            'Priority roadmap & turnaround',
            'Private components when needed'
          ]
        }
      }[tier] || {title:'Plan details', who:'', gets:[]};

      $('#mTitle').textContent = copy.title;
      $('#mBody').innerHTML = `
        <h4>Who it’s for</h4><p>${copy.who}</p>
        <h4>What you get</h4>
        <ul>${copy.gets.map(x=>`<li>${x}</li>`).join('')}</ul>
        <button class="btn primary" style="margin-top:8px">Sounds good</button>
      `;
      planModal.showModal();
    }

    // Delegate buttons inside plan cards
    $$('#plans .plan').forEach(card => {
      const tier = card.getAttribute('data-tier');
      card.querySelector('.details')?.addEventListener('click', () => openPlanDetails(tier));
      card.querySelector('.choose')?.addEventListener('click', () => openPlanDetails(tier));
    });

    // ---- Library rendering (manifest-aware) ----
    const state = {
      heroSrc: 'assets/images/hero_1.jpg',
      library: {},
      tags: []
    };

    const defaultManifest = {
      "Hero": [
        "assets/videos/hero_1.mp4",
        "assets/images/hero_1.jpg"
      ],
      "Reels 9:16": [],
      "Reels 16:9": [
        "assets/videos/hero_1.mp4"
      ],
      "Backgrounds": [
        "assets/images/grid_natural_1.jpg",
        "assets/images/grid_spread_1.jpg",
        "assets/images/grid_transform_1.jpg"
      ],
      "Logos": [
        "assets/videos/gc_spin.mp4",
        "assets/images/gc_logo.png"
      ],
      "Images": [
        "assets/images/hero_1.jpg",
        "assets/images/hero_2.jpg",
        "assets/images/hero_3.jpg"
      ]
    };

    const libTabs = $('#libTabs');
    const libTags = $('#libTags');
    const libGrid = $('#libGrid');
    const heroBox = $('#hero');
    const heroSelect = $('#uiHero');

    function setHero(src){
      state.heroSrc = src;
      renderHero();
      // Keep the select (if present) in sync
      if (heroSelect) {
        const opt = [...heroSelect.options].find(o => o.value === src);
        if (opt) heroSelect.value = src;
      }
    }

    function renderHero(){
      if (!heroBox) return;
      heroBox.innerHTML = '<div class="heroOverlay"></div>';
      const isVid = /\.(mp4|webm|mov)$/i.test(state.heroSrc);
      if (isVid){
        const v = document.createElement('video');
        Object.assign(v, {
          src: state.heroSrc, controls: true, playsInline: true, className:'hero-media'
        });
        heroBox.prepend(v);
      } else {
        const i = document.createElement('img');
        Object.assign(i, {src: state.heroSrc, alt:'hero', className:'hero-media'});
        heroBox.prepend(i);
      }
    }

    function pill(txt, active=false){
      const b = document.createElement('div');
      b.className = 'pill' + (active ? ' active' : '');
      b.textContent = txt;
      return b;
    }

    function renderGrid(list){
      if (!libGrid) return;
      libGrid.innerHTML = '';
      list.forEach(src => {
        const row = document.createElement('div');
        row.className = 'tile';
        const th = document.createElement('div');
        th.className = 'thumb';
        const label = document.createElement('div');
        label.innerHTML = `<b>${src.split('/').pop()}</b><div class="meta">${src}</div>`;
        if (/\.(mp4|webm|mov)$/i.test(src)){
          const v = document.createElement('video');
          Object.assign(v, {src, muted:true, playsInline:true, loop:true, autoplay:true});
          th.appendChild(v);
        } else {
          const i = document.createElement('img');
          i.src = src;
          th.appendChild(i);
        }
        row.appendChild(th);
        row.appendChild(label);
        row.addEventListener('click', () => setHero(src));
        libGrid.appendChild(row);
      });
    }

    function buildLibrary(){
      if (!libTabs) return;
      libTabs.innerHTML = '';
      libTags.innerHTML = '';
      const cats = Object.keys(state.library);
      const active = localStorage.getItem('thegrid.activeTab') || cats[0];

      // Tabs
      cats.forEach(cat => {
        const b = pill(cat, cat===active);
        b.onclick = () => {
          localStorage.setItem('thegrid.activeTab', cat);
          buildLibrary();
        };
        libTabs.appendChild(b);
      });

      const all = state.library[active] || [];

      // Tags (from filenames)
      const tags = [...new Set(all.flatMap(x => {
        const name = x.split('/').pop().toLowerCase();
        return name.split(/[_\-.]/g).filter(w => w.length>2 && !/mp4|jpg|jpeg|png|webm|mov/.test(w));
      }))].slice(0, 6);
      state.tags = tags;

      libTags.innerHTML = '';
      tags.forEach(t => {
        const b = pill(t);
        b.onclick = () => renderGrid(all.filter(x => x.toLowerCase().includes(t)));
        libTags.appendChild(b);
      });

      // Populate the hero source select too
      if (heroSelect){
        heroSelect.innerHTML = '';
        const allFiles = [...new Set(Object.values(state.library).flat())];
        allFiles.forEach(src => heroSelect.add(new Option(src, src, src===state.heroSrc, src===state.heroSrc)));
        heroSelect.oninput = e => setHero(e.target.value);
      }

      renderGrid(all);
    }

    async function loadManifest(){
      try{
        const res = await fetch('assets/manifest.json', {cache:'no-store'});
        state.library = res.ok ? await res.json() : defaultManifest;
      } catch(e){
        state.library = defaultManifest;
      }
      buildLibrary();
      renderHero();
    }

    loadManifest();
  });
})();
