/* UI helpers: sticky trial banner, Details modals, “Join Now” / “See Pricing” scroll, and localStorage dismiss */
(function () {
  // Smooth scroll helpers
  function scrollToId(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Join Now & See Pricing
  document.querySelectorAll("[data-scroll='pricing']").forEach(el => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      scrollToId("pricing");
    });
  });

  // Trial banner show/hide (persist)
  const BANNER_KEY = "gc_trial_banner_dismissed_v1";
  const banner = document.querySelector(".trial-banner");
  if (banner) {
    const dismissed = localStorage.getItem(BANNER_KEY) === "1";
    if (dismissed) banner.remove();
    const dismissBtn = banner.querySelector(".trial-dismiss");
    if (dismissBtn) {
      dismissBtn.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.setItem(BANNER_KEY, "1");
        banner.remove();
      });
    }
  }

  // Plan modals (Details)
  document.querySelectorAll(".js-details[data-plan]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const plan = btn.getAttribute("data-plan");
      const modal = document.getElementById(`modal-${plan}`);
      if (modal) {
        modal.showModal?.() || modal.classList.add("open");
      }
    });
  });
  document.querySelectorAll(".plan-modal .close, .plan-modal .x").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const dlg = btn.closest(".plan-modal");
      dlg?.close?.();
      dlg?.classList.remove("open");
    });
  });
})();
