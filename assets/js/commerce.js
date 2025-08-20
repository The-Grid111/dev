/* THE GRID — commerce.js (FULL REDO)
   Renders pricing plans from dev/assets/data/plans.json
   Works whether site served at / or /dev/
*/

(() => {
  const qs = (s, r = document) => r.querySelector(s);
  const log = (...a) => console.log("[GRID]", ...a);

  const PATHS = ["./assets/", "./dev/assets/", "../assets/"];
  const urlTry = (sub) => PATHS.map(p => p + sub);

  const fetchJSONFirstOK = async (candidates) => {
    for (const u of candidates) {
      try {
        const r = await fetch(u, { cache: "no-store" });
        if (r.ok) { log("Loaded", u); return await r.json(); }
      } catch {}
    }
    return null;
  };

  const renderPlans = (plans) => {
    const host = qs("#plans .plans-grid") || qs('[data-plans-grid]');
    if (!host) return;

    host.innerHTML = ""; // clear existing

    plans.forEach(p => {
      const li = document.createElement("article");
      li.className = "plan-card";
      li.innerHTML = `
        <div class="plan-price">${p.price}/mo</div>
        <h3 class="plan-name">${p.tier}</h3>
        <ul class="plan-features">
          ${p.features.map(f => `<li>${f}</li>`).join("")}
        </ul>
        <button class="plan-choose" data-plan="${p.tier}">Choose</button>
      `;
      host.appendChild(li);
    });

    // Notify main.js so it can (re)wire choose buttons
    document.dispatchEvent(new CustomEvent("grid:pricing-rendered"));
  };

  const boot = async () => {
    const data = await fetchJSONFirstOK(urlTry("data/plans.json"));
    if (!data || !Array.isArray(data.plans)) return;
    renderPlans(data.plans);
  };

  window.addEventListener("DOMContentLoaded", boot);
})();
