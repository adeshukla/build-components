/**
 * Sidebar navigation — plain JavaScript, no dependencies.
 * Every link ships in the HTML. This folds the sections away and, on a narrow screen, runs the
 * drawer: Escape closes it and focus goes back to the button that opened it.
 */
(function () {
  const widths = { sm: 640, md: 768, lg: 1024 };

  function createSidebar(root) {
    const toggle = root.querySelector("[data-toggle]");
    const panel = root.querySelector(".sb-panel");
    if (!panel) return;
    const narrow = window.matchMedia("(max-width: " + ((widths[root.dataset.breakpoint] || 768) - 1) + "px)");

    function setDrawer(open) {
      if (!toggle) return;
      toggle.setAttribute("aria-expanded", String(open));
      root.dataset.open = String(open);
    }

    if (toggle) {
      toggle.addEventListener("click", function () {
        setDrawer(toggle.getAttribute("aria-expanded") !== "true");
      });
    }

    // Following a link closes the drawer behind you.
    panel.addEventListener("click", function (event) {
      if (event.target.closest("a") && narrow.matches) setDrawer(false);
    });

    root.querySelectorAll("[aria-controls]").forEach(function (button) {
      if (!button.classList.contains("sb-toggle-section")) return;
      const list = root.querySelector("#" + button.getAttribute("aria-controls"));
      button.addEventListener("click", function () {
        const open = button.getAttribute("aria-expanded") === "true";
        button.setAttribute("aria-expanded", String(!open));
        if (list) list.hidden = open;
      });
    });

    // Escape and outside clicks are handled on the document: Safari does not focus a button when
    // it is tapped, so a listener on the sidebar alone would never hear the key.
    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape" || !toggle || toggle.getAttribute("aria-expanded") !== "true") return;
      event.preventDefault();
      setDrawer(false);
      toggle.focus();
    });

    document.addEventListener("pointerdown", function (event) {
      if (!root.contains(event.target)) setDrawer(false);
    });

    narrow.addEventListener("change", function () {
      setDrawer(false);
    });

    setDrawer(false);
  }

  document.querySelectorAll("[data-sidebar]").forEach(createSidebar);
})();
