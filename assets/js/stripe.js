/* Wire plan buttons to Stripe links from config/stripe.json
   - .js-choose[data-plan] goes to Stripe
   - .js-trial goes to trial link
   - .js-details[data-plan] opens plan modal (handled in ui.js)
*/
(function () {
  const cfgUrl = "/dev/assets/config/stripe.json";
  let CFG = null;

  async function loadCfg() {
    if (CFG) return CFG;
    const r = await fetch(cfgUrl, { cache: "no-store" });
    if (!r.ok) throw new Error("stripe.json load failed");
    CFG = await r.json();
    return CFG;
  }

  function hrefForPlan(plan) {
    if (!CFG) return "#";
    return (CFG[plan] && typeof CFG[plan] === "string") ? CFG[plan] : "#";
  }

  function wireChooseButtons() {
    document.querySelectorAll(".js-choose[data-plan]").forEach(btn => {
      const plan = btn.getAttribute("data-plan");
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const link = hrefForPlan(plan);
        if (link && link !== "#") {
          window.location.href = link;
        } else {
          alert("Checkout link not configured yet.");
        }
      });
    });
  }

  function wireTrialButtons() {
    const trialBtns = document.querySelectorAll(".js-trial");
    trialBtns.forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        await loadCfg();
        const link = hrefForPlan("trial");
        if (link && link !== "#") window.location.href = link;
        else alert("Trial link not configured yet.");
      });
    });
  }

  // init
  (async function init() {
    try {
      await loadCfg();
    } catch (e) {
      console.error(e);
    }
    wireChooseButtons();
    wireTrialButtons();
    document.dispatchEvent(new CustomEvent("stripe-config-ready", { detail: { CFG } }));
  })();
})();
