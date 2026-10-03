/**
 * Site header — plain JavaScript, no dependencies.
 * The markup ships as real HTML; this only runs the small-screen menu.
 * Escape closes the menu and puts focus back on the button.
 */
(function () {
  // The light and dark switch: the visitor's choice for the whole page, remembered (<html data-bc-scheme>).
  function createSchemeSwitch(button) {
    const system = window.matchMedia("(prefers-color-scheme: dark)");
    const page = document.documentElement;
    const isDark = function () {
      return page.dataset.bcScheme ? page.dataset.bcScheme === "dark" : system.matches;
    };
    const show = function () {
      button.setAttribute("aria-pressed", String(isDark()));
    };
    button.addEventListener("click", function () {
      const scheme = isDark() ? "light" : "dark";
      page.dataset.bcScheme = scheme;
      try {
        localStorage.setItem("bc-scheme", scheme);
      } catch {
        // Storage blocked: the choice lasts this visit.
      }
    });
    system.addEventListener("change", show);
    new MutationObserver(show).observe(page, { attributes: true, attributeFilter: ["data-bc-scheme"] });
    show();
  }
  document.querySelectorAll("[data-scheme]").forEach(createSchemeSwitch);

  function createHeader(header) {
    const toggle = header.querySelector("[data-toggle]");
    const menu = header.querySelector(".hd-menu");
    if (!toggle || !menu) return;

    // Escape and outside clicks are handled on the document: Safari does not focus a button when it
    // is tapped, so a listener on the header alone would never hear the key.
    function onDocumentKeyDown(event) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      toggle.focus();
    }

    function onDocumentPointerDown(event) {
      if (!menu.contains(event.target) && !toggle.contains(event.target)) setOpen(false);
    }

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      menu.hidden = !open;
      header.toggleAttribute("data-open", open);
      if (open) {
        document.addEventListener("keydown", onDocumentKeyDown);
        document.addEventListener("pointerdown", onDocumentPointerDown);
      } else {
        document.removeEventListener("keydown", onDocumentKeyDown);
        document.removeEventListener("pointerdown", onDocumentPointerDown);
      }
    }

    toggle.addEventListener("click", () => {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    menu.addEventListener("click", (event) => {
      if (event.target.closest("a")) setOpen(false);
    });

    // Leaving the small-screen layout closes the menu, so the links never stay hidden.
    const widths = { sm: "(min-width: 640px)", md: "(min-width: 768px)", lg: "(min-width: 1024px)" };
    const wide = window.matchMedia(widths[header.dataset.breakpoint] || widths.md);
    wide.addEventListener("change", (event) => {
      if (event.matches) setOpen(false);
    });

    setOpen(false);
  }

  document.querySelectorAll("[data-header]").forEach(createHeader);
})();
