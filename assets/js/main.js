// main.js — small UI niceties only; keep stability
(function () {
  // Dismiss update bar
  const dismiss = document.getElementById('newsDismiss');
  if (dismiss) {
    dismiss.addEventListener('click', () => {
      const bar = document.getElementById('newsbar');
      if (bar) bar.style.display = 'none';
    });
  }

  // Plan "Details" -> friendly alert (kept simple & stable)
  document.querySelectorAll('.plan-details').forEach(btn => {
    btn.addEventListener('click', () => {
      const plan = btn.getAttribute('data-plan');
      const copy = {
        basic: `BASIC\n\n• Starter hero & sections\n• Access to Library + manifest system\n• Email support within 48h\n• Cancel/upgrade anytime`,
        silver: `SILVER\n\n• Everything in Basic\n• Advanced effects & presets\n• Priority email (24h)\n• Quarterly tune-ups`,
        gold: `GOLD\n\n• Monthly collab session\n• Admin toolkit & automations\n• 1:1 onboarding (45 min)\n• Priority hotfix`,
        diamond: `DIAMOND\n\n• Custom pipelines (Notion/Airtable/Zapier)\n• Hands-on stack build\n• Priority roadmap & fast turnaround\n• Quarterly strategy review`
      };
      alert(copy[plan] || 'Plan details');
    });
  });
})();
