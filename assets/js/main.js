# file: dev/assets/js/main.js
/* THE GRID – baseline UX hooks (no HTML changes required)
   - Wires up action buttons by visible text
   - Adds a lightweight "Customize" panel shell
   - Safe to re-run; all listeners are idempotent
*/

(function () {
  const ready = (fn) =>
    document.readyState !== "loading"
      ? fn()
      : document.addEventListener("DOMContentLoaded", fn, { once: true });

  ready(() => {
    // ---------- helpers
    const byText = (tag, texts) => {
      const tset = new Set(texts.map((s) => s.toLowerCase()));
      return [...document.querySelectorAll(tag)].filter((el) =>
        tset.has(el.textContent.trim().toLowerCase())
      );
    };
    const scrollToId = (id) => {
      const el = document.getElementById(id) || document.querySelector(id);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    const openContact = () => scrollToId("contact") || scrollToId("#contact");

    // ---------- buttons → actions (text-based so it works with current HTML)
    // Choose → scroll to Contact (lead capture)
    byText("button, a", ["Choose"]).forEach((btn) => {
      btn.dataset.bound = "1";
      btn.addEventListener(
        "click",
        (e) => {
          e.preventDefault();
          openContact();
        },
        { once: false }
      );
    });

    // Details → scroll to Pricing (if we find a heading with 'Plans')
    byText("button, a", ["Details"]).forEach((btn) => {
      btn.dataset.bound = "1";
      btn.addEventListener(
        "click",
        (e) => {
          e.preventDefault();
          // Look for a Plans heading or pricing section
          const heading =
            [...document.querySelectorAll("h2,h3")]
              .find((h) => /plans/i.test(h.textContent)) || null;
          if (heading) heading.scrollIntoView({ behavior: "smooth" });
        },
        { once: false }
      );
    });

    // Start Setup / Order Pack / Get Pack → contact
    byText("button, a", ["Start Setup", "Order Pack", "Get Pack"]).forEach((btn) => {
      btn.dataset.bound = "1";
      btn.addEventListener(
        "click",
        (e) => {
          e.preventDefault();
          openContact();
        },
        { once: false }
      );
    });

    // ---------- Lightweight Customize panel (UI shell)
    // Skip if already injected
    if (!document.getElementById("tg-customize-toggle")) {
      const toggle = document.createElement("button");
      toggle.id = "tg-customize-toggle";
      toggle.type = "button";
      toggle.textContent = "Customize";
      Object.assign(toggle.style, {
        position: "fixed",
        right: "16px",
        bottom: "16px",
        zIndex: 9999,
        padding: "10px 14px",
        borderRadius: "999px",
        border: "1px solid rgba(255,255,255,.15)",
        background: "rgba(255,255,255,.06)",
        color: "var(--ink, #e7f5ff)",
        backdropFilter: "blur(6px)",
        cursor: "pointer",
      });

      const panel = document.createElement("div");
      panel.id = "tg-customize-panel";
      Object.assign(panel.style, {
        position: "fixed",
        top: 0,
        right: 0,
        width: "min(420px, 100%)",
        height: "100%",
        background: "var(--panel, rgba(17,25,29,.95))",
        color: "var(--ink, #e7f5ff)",
        borderLeft: "1px solid rgba(255,255,255,.08)",
        transform: "translateX(100%)",
        transition: "transform .24s ease",
        zIndex: 9998,
        padding: "20px 20px 28px",
        overflow: "auto",
      });
      panel.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;justify-content:space-between;">
          <h3 style="margin:0;font-size:18px;font-weight:700;">Customize</h3>
          <button id="tg-customize-close" type="button"
            style="border:1px solid rgba(255,255,255,.15);background:transparent;color:inherit;border-radius:8px;padding:6px 10px;cursor:pointer">
            Close
          </button>
        </div>
        <p style="opacity:.8;margin:.75rem 0 1rem">
          This is the baseline panel. We’ll add real controls (theme, logos, library categories)
          and have changes persist via <code>assets/manifest.json</code>.
        </p>
        <div style="display:grid;gap:10px">
          <label style="display:grid;gap:6px">
            <span>Theme</span>
            <select id="tg-theme" style="padding:10px;border-radius:10px;background:#0b1416;color:#e7f5ff;border:1px solid rgba(255,255,255,.12)">
              <option value="dark" selected>Dark</option>
              <option value="light">Light</option>
            </select>
          </label>
          <label style="display:grid;gap:6px">
            <span>Accent</span>
            <select id="tg-accent" style="padding:10px;border-radius:10px;background:#0b1416;color:#e7f5ff;border:1px solid rgba(255,255,255,.12)">
              <option value="#7dd3fc" selected>Sky</option>
              <option value="#facc15">Gold</option>
              <option value="#a78bfa">Violet</option>
            </select>
          </label>
          <button id="tg-apply" type="button"
            style="margin-top:6px;padding:10px 14px;border-radius:10px;border:1px solid rgba(255,255,255,.15);background:rgba(125,211,252,.1);color:inherit;cursor:pointer">
            Apply
          </button>
        </div>
      `;

      const mount = document.body;
      mount.appendChild(toggle);
      mount.appendChild(panel);

      const setOpen = (open) => {
        panel.style.transform = open ? "translateX(0%)" : "translateX(100%)";
      };

      toggle.addEventListener("click", () => setOpen(true));
      panel.querySelector("#tg-customize-close").addEventListener("click", () => setOpen(false));

      // Simple theme application (baseline)
      const apply = () => {
        const theme = panel.querySelector("#tg-theme").value;
        const accent = panel.querySelector("#tg-accent").value;
        const root = document.documentElement.style;
        if (theme === "light") {
          root.setProperty("--bg", "#f8fafc");
          root.setProperty("--ink", "#0b1416");
          root.setProperty("--muted", "#3b454b");
          root.setProperty("--card", "#ffffff");
        } else {
          root.setProperty("--bg", "#0b1416");
          root.setProperty("--ink", "#e7f5ff");
          root.setProperty("--muted", "#9fb0b7");
          root.setProperty("--card", "rgba(255,255,255,.04)");
        }
        root.setProperty("--accent", accent);
      };
      panel.querySelector("#tg-apply").addEventListener("click", apply);
    }
  });
})();
