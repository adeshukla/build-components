/**
 * Mega menu — plain JavaScript, no dependencies.
 * The markup ships as real HTML with every panel written into the page and hidden; this opens
 * and closes them. Escape closes and puts focus back on the button.
 */
(function () {
  function createMegaMenu(root) {
    const menus = Array.from(root.querySelectorAll(".mm-menu"));
    if (menus.length === 0) return;
    const hoverOpens = root.dataset.openOn === "hover";

    function setOpen(menu, open) {
      const button = menu.querySelector(".mm-button");
      const panel = menu.querySelector(".mm-panel");
      button.setAttribute("aria-expanded", String(open));
      panel.hidden = !open;
    }

    function closeAll(except) {
      menus.forEach(function (menu) {
        if (menu !== except) setOpen(menu, false);
      });
    }

    menus.forEach(function (menu) {
      const button = menu.querySelector(".mm-button");
      const panel = menu.querySelector(".mm-panel");

      button.addEventListener("click", function () {
        const open = button.getAttribute("aria-expanded") === "true";
        closeAll(menu);
        setOpen(menu, !open);
      });

      button.addEventListener("keydown", function (event) {
        if (event.key !== "ArrowDown") return;
        event.preventDefault();
        closeAll(menu);
        setOpen(menu, true);
        const first = panel.querySelector("a");
        if (first) first.focus();
      });

      if (hoverOpens) {
        menu.addEventListener("mouseenter", function () {
          closeAll(menu);
          setOpen(menu, true);
        });
      }

      // Picking a link closes the panel it came from.
      panel.addEventListener("click", function (event) {
        if (event.target.closest("a")) setOpen(menu, false);
      });
    });

    if (hoverOpens) {
      root.addEventListener("mouseleave", function () {
        closeAll(null);
      });
    }

    // Escape and outside clicks are handled on the document: Safari does not focus a button when
    // it is tapped, so a listener on the nav alone would never hear the key.
    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      const openMenu = menus.find(function (menu) {
        return menu.querySelector(".mm-button").getAttribute("aria-expanded") === "true";
      });
      if (!openMenu) return;
      event.preventDefault();
      setOpen(openMenu, false);
      openMenu.querySelector(".mm-button").focus();
    });

    document.addEventListener("pointerdown", function (event) {
      if (!root.contains(event.target)) closeAll(null);
    });
  }

  document.querySelectorAll("[data-mega-menu]").forEach(createMegaMenu);
})();
