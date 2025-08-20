/* THE GRID — main.js (full redo)
   - Robust button wiring (Open Library / See Pricing / Join Now / Customize)
   - Gentle scroll + cache-safe data loads
   - Optional plans rendering if a container exists
*/

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const log = (...a) => console.debug("[THEGRID]", ...a);

  // Smooth scroll to a section if it exists
  function scrollToId(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    else log("Missing section #"+id);
  }

  // Attach the same handler to many possible selectors (be liberal with IDs/classes)
  function hook(selectors, handler) {
    selectors.forEach((sel) => {
      $$(sel).forEach((el) => {
        if (el.dataset.wired) return;
        el.addEventListener("click", (e) => {
          e.preventDefault();
          try { handler(e); } catch (err) { console.error(err); }
        });
        el.dataset.wired = "1";
      });
    });
  }

  // Minimal, safe HTML escape
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c])
    );
  }

  function planCard(p) {
    const bullets = (p.bullets || []).map((b) => `<li>${esc(b)}</li>`).join("");
    const label = esc(p.label || p.name || "Plan");
    const code  = esc(p.code || p.sku || label.toLowerCase());
    const price = esc(p.price ?? "");
    return `
      <div class="plan-card">
        <div class="plan-price"><span class="amount">£${price}</span><span class="per">/mo</span></div>
        <div class="plan-label">${label}</div>
        <ul class="plan-bullets">${bullets}</ul>
        <button class="plan-choose" data-plan="${code}">Choose</button>
      </div>
    `;
  }

  async function maybeRenderPlans() {
    // Only render if a target container exists (non-destructive)
    const container =
      $("#plans-cards") || $("#plans .cards") || $("#plans .plans") || null;

    if (!container) { log("No plans container found; skipping render"); return; }

    try {
      const res = await fetch("assets/data/plans.json", { cache: "no-store" });
      if (!res.ok) throw new Error("plans.json fetch " + res.status);
      const plans = await res.json();
      if (!Array.isArray(plans)) throw new Error("plans.json is not an array");

      container.innerHTML = plans.map(planCard).join("");

      // When user clicks Choose → jump to contact for now
      $$(".plan-choose", container).forEach((btn) => {
        btn.addEventListener("click", () => scrollToId("contact"));
      });
    } catch (err) {
      console.error("[THEGRID] Plans render failed:", err);
    }
  }

  function openCustomizer() {
    let modal = $("#tg-customizer");
    if (modal) { modal.remove(); } // reset
    modal = document.createElement("div");
    modal.id = "tg-customizer";
    modal.style.cssText =
      "position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:9999;";
    modal.innerHTML = `
      <div class="tg-modal" style="background:#121212;border:1px solid #2a2a2a;border-radius:16px;padding:20px;max-width:420px;width:92%;box-shadow:0 10px 40px rgba(0,0,0,.5)">
        <h3 style="margin:0 0 12px">Customize</h3>
        <label style="display:flex;gap:8px;align-items:center;margin:8px 0 16px">
          <input type="checkbox" id="tg-high-contrast">
          <span>High contrast mode</span>
        </label>
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button id="tg-close"  style="padding:8px 12px;border-radius:10px;border:1px solid #2a2a2a;background:#1c1c1c">Close</button>
          <button id="tg-save"   style="padding:8px 12px;border-radius:10px;border:0;background:#ffd24a">Save</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // load saved state
    $("#tg-high-contrast")!.checked = (localStorage.getItem("tg:contrast") === "high");

    modal.addEventListener("click", (e) => {
      if (e.target && (e.target === modal || e.target.id === "tg-close")) modal.remove();
    });
    $("#tg-save").addEventListener("click", () => {
      const hc = $("#tg-high-contrast").checked;
      document.documentElement.dataset.contrast = hc ? "high" : "";
      localStorage.setItem("tg:contrast", hc ? "high" : "");
      modal.remove();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    // Buttons: support multiple possible IDs/data attributes to match older HTML
    hook(["#btn-open-library","#open-library","[data-action='open-library']"], () => scrollToId("library"));
    hook(["#btn-see-pricing","#see-pricing","[data-action='see-pricing']"],   () => scrollToId("plans"));
    hook(["#btn-join","#join-now","#joinNow","[data-action='join-now']"],     () => scrollToId("contact"));
    hook(["#btn-customize","#customize","[data-action='customize']"],         () => openCustomizer());

    // Optional render of plans if a container is present
    maybeRenderPlans();
  });
})();
