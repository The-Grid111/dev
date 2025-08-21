(() => {
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const ROOT = document.documentElement;
  const KEY  = "the-grid-theme";
  const defaults = {
    title: "THE GRID",
    tagline: "Cinematic AI visuals & TikTok creator hub",
    tiktok: "https://www.tiktok.com/@YOUR_HANDLE",
    accent: "#00d1ff",
    bg: "#0f1418",
    panel: "#0d232a",
    text: "#dfe7ee",
    radius: 20
  };

  function applyTheme(s){
    ROOT.style.setProperty("--accent", s.accent);
    ROOT.style.setProperty("--bg", s.bg);
    ROOT.style.setProperty("--panel", s.panel);
    ROOT.style.setProperty("--text", s.text);
    ROOT.style.setProperty("--radius", (s.radius|0) + "px");
    $("#site-title").textContent = s.title;
    $("#tagline").textContent    = s.tagline;
    // external links
    const tk = s.tiktok || defaults.tiktok;
    const links = ["#tiktok","#see-tiktok","#dm-tiktok"];
    links.forEach(sel => { const el=$(sel); if(el){ el.href = tk; }});
  }

  const read  = () => { try { return JSON.parse(localStorage.getItem(KEY)||"{}"); } catch { return {}; } };
  const save  = (s) => localStorage.setItem(KEY, JSON.stringify(s));
  const state = () => ({ ...defaults, ...read() });

  document.addEventListener("DOMContentLoaded", () => {
    // init
    applyTheme(state());

    // open/close panel
    $("#open-customize")?.addEventListener("click", (e)=>{
      e.preventDefault();
      $("#customize").hidden = false;
      fill();
    });
    $("#close-customize")?.addEventListener("click", (e)=>{
      e.preventDefault();
      $("#customize").hidden = true;
    });

    // wire live inputs if panel exists
    const bindings = [
      ["#cfg-title","title"],["#cfg-tagline","tagline"],["#cfg-tiktok","tiktok"],
      ["#cfg-accent","accent"],["#cfg-bg","bg"],["#cfg-panel","panel"],["#cfg-text","text"],["#cfg-radius","radius"]
    ];
    function current(){ const s={...defaults, ...read()}; bindings.forEach(([sel,key])=>{
      const el=$(sel); if(el){ s[key] = el.type==="range"||el.type==="text" ? el.value : el.value; }
    }); return s; }
    function fill(){ const s={...defaults, ...read()};
      $("#cfg-title").value=s.title; $("#cfg-tagline").value=s.tagline; $("#cfg-tiktok").value=s.tiktok;
      $("#cfg-accent").value=s.accent; $("#cfg-bg").value=s.bg; $("#cfg-panel").value=s.panel; $("#cfg-text").value=s.text; $("#cfg-radius").value=s.radius;
    }
    bindings.forEach(([sel])=> $(sel)?.addEventListener("input", ()=> applyTheme(current())));
    $("#cfg-save")?.addEventListener("click", ()=>{ save(current()); alert("Saved!"); });
    $("#cfg-reset")?.addEventListener("click", ()=>{ localStorage.removeItem(KEY); applyTheme(defaults); fill(); });

    // build a small inline panel if not present (keeps it working)
    if(!$("#customize")){
      const panel = document.createElement("div");
      panel.id = "customize";
      panel.className = "panel";
      panel.hidden = true;
      panel.innerHTML = `
        <div class="panel header"><h3>Customize</h3><a href="#" id="close-customize" class="btn ghost">Close</a></div>
        <div class="panel body">
          <label>Title<input id="cfg-title" type="text"></label>
          <label>Tagline<input id="cfg-tagline" type="text"></label>
          <label>TikTok URL<input id="cfg-tiktok" type="text"></label>
          <label>Accent<input id="cfg-accent" type="color"></label>
          <label>Background<input id="cfg-bg" type="color"></label>
          <label>Panel<input id="cfg-panel" type="color"></label>
          <label>Text<input id="cfg-text" type="color"></label>
          <label>Radius<input id="cfg-radius" type="range" min="0" max="28"></label>
          <div class="panel actions">
            <a class="btn" id="cfg-save">Save</a>
            <a class="btn ghost" id="cfg-reset">Reset</a>
          </div>
        </div>`;
      document.body.append(panel);
    }
  });
})();
:root{
  --accent:#00d1ff; --bg:#0f1418; --panel:#0d232a; --text:#dfe7ee; --ring:rgba(0,209,255,.35); --radius:20px;
}
*,*:before,*:after{box-sizing:border-box}
html,body{margin:0;padding:0;background:var(--bg);color:var(--text);font:16px/1.6 system-ui,Segoe UI,Roboto,Helvetica,Arial}
.wrap{max-width:1060px;margin:auto;padding:24px}
h1{font-size:44px;margin:24px 0;border-left:6px solid var(--accent);padding-left:12px;background:rgba(0,209,255,.08);border-radius:10px}
h2{font-size:28px;margin:32px 0 12px}
h3{margin:8px 0}
p{margin:0 0 16px;color:#9fb3c8}
nav{display:flex;gap:12px;flex-wrap:wrap;margin:8px 0}
nav a{color:var(--text);text-decoration:none;font-weight:700}
nav a:hover{opacity:.85}
.btn{display:inline-block;background:var(--accent);color:#081217;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:12px}
.btn.ghost{background:transparent;color:var(--text);border:2px solid var(--accent)}
.btn:focus,.btn:hover{outline:0;box-shadow:0 0 0 3px var(--ring)}
.hero-video{width:100%;height:auto;border:3px solid var(--ring);border-radius:var(--radius);background:#081217}
.cards{list-style:none;margin:24px 0;padding:0;display:grid;gap:16px}
.card{padding:16px;border:1px solid rgba(0,209,255,.15);background:var(--panel);border-radius:12px}
.pricing{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}
.price{background:var(--panel);border-radius:var(--radius);border:1px solid rgba(0,209,255,.15);padding:16px}
.price .amount{font-size:24px;margin:6px 0 12px;color:var(--text)}
.price.featured{border:2px solid var(--ring);box-shadow:0 0 3px var(--ring)}
.grid{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(140px,1fr))}
.ph{width:100%;height:auto;display:block;border-radius:12px;border:2px solid rgba(0,209,255,.15);background:#081217;fill:#9fb3c8}
footer{opacity:.85;margin:32px 0 24px}

/* Customizer */
.panel{position:fixed;inset:auto 12px 12px;max-width:920px;z-index:10;background:var(--panel);border:1px solid rgba(0,209,255,.25);border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.35)}
.panel .header{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(0,209,255,1);padding:12px}
.panel .body{padding:16px;display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}
.panel label{display:grid;gap:6px;font-size:14px;color:#9fb3c8}
.panel input[type="text"]{padding:10px;border:1px solid #2b5565;border-radius:10px;background:#0c151a;color:var(--text)}
.panel input[type="color"]{height:36px;padding:0;border:0;background:transparent}
.panel input[type="range"]{width:100%}