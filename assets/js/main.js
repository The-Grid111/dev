/* THE GRID — main.js (FULL REDO, SAFE)
   Wires buttons, renders pricing hooks notice, initializes hero video,
   and fills library counts using manifests. Designed to work at / and /dev/.
*/

(function () {
  // -------- helpers
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function log() { try { console.log.apply(console, ["[GRID]"].concat([].slice.call(arguments))); } catch (_) {} }
  function smoothScrollTo(el) {
    if (!el) return;
    try { el.scrollIntoView({ behavior: "smooth", block: "start" }); }
    catch (_) { var y = el.getBoundingClientRect().top + window.pageYOffset - 12; window.scrollTo(0, y); }
  }

  // -------- path base (works for / and /dev/)
  var inDev = location.pathname.indexOf("/dev/") !== -1;
  var ASSETS = inDev ? "assets/" : "assets/"; // site root already handles /dev/ via relative links
  // but some pages may be served from /dev/, so build candidate list:
  var BASES = [ "./assets/", "./dev/assets/", "../assets/" ];

  function withBases(sub) { return BASES.map(function (b) { return b + sub; }); }

  function fetchJSONFallback(candidates, cb) {
    var i = 0;
    function next() {
      if (i >= candidates.length) { cb(null); return; }
      var url = candidates[i++];

      fetch(url, { cache: "no-store" })
        .then(function (r) { if (!r.ok) throw new Error("not ok"); return r.json(); })
        .then(function (j) { log("Loaded", url); cb(j); })
        .catch(function () { next(); });
    }
    next();
  }

  // -------- DOM
  var dom = {
    heroWrap:   qs("[data-hero]") || qs("#hero"),
    heroVideo:  qs("[data-hero-video]") || qs("#heroVideo"),
    heroSource: qs("[data-hero-source]") || qs("#heroSource"),

    btnCustomize:  qs('[data-action="customize"]') || qs("#btn-customize"),
    btnJoin:       qs('[data-action="join"]') || qs("#btn-join"),
    btnOpenLib:    qs('[data-action="open-library"]') || qs("#btn-open-library"),
    btnSeePricing: qs('[data-action="see-pricing"]') || qs("#btn-see-pricing"),

    secLibrary: qs('[data-section="library"]') || qs("#library"),
    secPricing: qs('[data-section="pricing"]') || qs("#plans") || qs("#pricing"),
    secContact: qs('[data-section="contact"]') || qs("#contact"),

    // library counts (optional chips)
    countHero:        qs('[data-count="hero"]'),
    countReels916:    qs('[data-count="reels-916"]'),
    countReels169:    qs('[data-count="reels-169"]'),
    countBackgrounds: qs('[data-count="backgrounds"]'),
    countLogos:       qs('[data-count="logos"]'),
    countImages:      qs('[data-count="images"]')
  };

  // -------- hero
  function setHeroVideo(src) {
    if (!dom.heroVideo || !dom.heroSource || !src) return;
    try {
      dom.heroVideo.pause();
      dom.heroSource.setAttribute("src", src);
      dom.heroVideo.muted = true;
      dom.heroVideo.setAttribute("playsinline", "");
      dom.heroVideo.load();
      var p = dom.heroVideo.play();
      if (p && typeof p.catch === "function") { p.catch(function(){ dom.heroVideo.controls = true; }); }
    } catch (e) { log("hero error", e); }
  }

  function initHero() {
    fetchJSONFallback(withBases("videos/manifest.json"), function (vman) {
      var heroSrc = null;

      if (vman && vman.items && vman.items.length) {
        // prefer hero-tagged or named
        var picked = null;
        for (var i=0;i<vman.items.length;i++) {
          var it = vman.items[i] || {};
          var name = (it.name || it.file || it.src || "");
          var tags = it.tags || [];
          if (/hero/i.test(name) || tags.indexOf("hero") !== -1 || tags.indexOf("HERO") !== -1) { picked = it; break; }
        }
        if (!picked) {
          for (var j=0;j<vman.items.length;j++) {
            var it2 = vman.items[j] || {};
            var f = (it2.file || it2.src || "");
            if (f.toLowerCase().slice(-4) === ".mp4") { picked = it2; break; }
          }
        }
        if (picked) {
          var fpath = picked.file || picked.src || "";
          heroSrc = (/^https?:\/\//i.test(fpath)) ? fpath : (BASES[0] + "videos/" + fpath);
        }
      }

      // fallback to hero_1.mp4
      if (!heroSrc) {
        heroSrc = BASES[0] + "videos/hero_1.mp4";
      }

      setHeroVideo(heroSrc);
      if (dom.heroWrap) dom.heroWrap.setAttribute("data-has-hero", "1");
    });
  }

  // -------- library
  function setText(node, v) { if (node) node.textContent = String(v); }

  function initLibrary() {
    // videos
    fetchJSONFallback(withBases("videos/manifest.json"), function (vman) {
      if (!(vman && vman.items && vman.items.length)) return;

      function count(fn) {
        var n = 0; for (var i=0;i<vman.items.length;i++) { if (fn(vman.items[i]||{})) n++; } return n;
      }
      setText(dom.countHero,        count(function (it) {
        var name = (it.name||it.file||""); var tags = it.tags||[];
        return /hero/i.test(name) || tags.indexOf("hero") !== -1;
      }));
      setText(dom.countReels916,    count(function (it) {
        var a = (it.aspect||it.ratio||"")+""; return /9:?16/.test(a);
      }));
      setText(dom.countReels169,    count(function (it) {
        var a = (it.aspect||it.ratio||"")+""; return /16:?9/.test(a);
      }));
      setText(dom.countBackgrounds, count(function (it) {
        var t = it.tags||[]; return t.indexOf("background") !== -1;
      }));
    });

    // images
    fetchJSONFallback(withBases("images/manifest.json"), function (iman) {
      if (!(iman && iman.items && iman.items.length)) return;
      function count(fn) { var n=0; for (var i=0;i<iman.items.length;i++){ if(fn(iman.items[i]||{})) n++; } return n; }
      setText(dom.countLogos,  count(function (it) {
        var name = (it.name||it.file||""); var t = it.tags||[];
        return /logo/i.test(name) || t.indexOf("logo") !== -1;
      }));
      setText(dom.countImages, iman.items.length);
    });
  }

  // -------- buttons
  function wireButtons() {
    if (dom.btnCustomize) dom.btnCustomize.addEventListener("click", function (e) {
      e.preventDefault(); alert("Design Panel coming back next pass (saved per-device).");
    });

    if (dom.btnJoin) dom.btnJoin.addEventListener("click", function (e) {
      e.preventDefault(); smoothScrollTo(dom.secContact || document.body);
    });

    if (dom.btnSeePricing) dom.btnSeePricing.addEventListener("click", function (e) {
      e.preventDefault(); smoothScrollTo(dom.secPricing || document.body);
    });

    if (dom.btnOpenLib) dom.btnOpenLib.addEventListener("click", function (e) {
      e.preventDefault(); smoothScrollTo(dom.secLibrary || document.body);
    });

    // plan choose (if present)
    document.addEventListener("click", function (ev) {
      var t = ev.target;
      if (!t || !(t.matches && t.matches(".plan-choose,[data-plan]"))) return;
      ev.preventDefault();
      var tier = t.getAttribute("data-plan") || "BASIC";
      log("Plan selected:", tier);
      smoothScrollTo(dom.secContact || document.body);
    });
  }

  // -------- boot
  document.addEventListener("DOMContentLoaded", function () {
    wireButtons();
    initHero();
    initLibrary();
  });
})();
