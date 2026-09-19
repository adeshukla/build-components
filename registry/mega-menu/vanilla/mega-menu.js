/**
 * Mega menu — plain JavaScript, no dependencies.
 * The markup ships as real HTML with every panel written into the page and hidden.
 * On a wide screen this opens and closes the panels. On a narrow one the bar becomes a menu
 * button and the panels are shown one step at a time, with a back button.
 */
(function () {
  const widths = { sm: 640, md: 768, lg: 1024 };

  function createMegaMenu(root) {
    const menus = Array.from(root.querySelectorAll(".mm-menu"));
    if (menus.length === 0) return;
    const hoverOpens = root.dataset.openOn === "hover";
    const toggle = root.querySelector("[data-toggle]");
    const narrow = window.matchMedia("(max-width: " + ((widths[root.dataset.breakpoint] || 768) - 1) + "px)");

    function setOpen(menu, open) {
      const button = menu.querySelector(".mm-button");
      const panel = menu.querySelector(".mm-panel");
      button.setAttribute("aria-expanded", String(open));
      panel.hidden = !open;
      if (open) menu.dataset.active = "true";
      else delete menu.dataset.active;
      // On a narrow screen the open menu is the whole step, so the rest of the bar steps aside.
      if (narrow.matches && open) root.dataset.step = menu.dataset.menu;
      if (!open && root.dataset.step === menu.dataset.menu) delete root.dataset.step;
    }

    function closeAll(except) {
      menus.forEach(function (menu) {
        if (menu !== except) setOpen(menu, false);
      });
    }

    function openMenu() {
      return menus.find(function (menu) {
        return menu.querySelector(".mm-button").getAttribute("aria-expanded") === "true";
      });
    }

    function setDrawer(open) {
      if (!toggle) return;
      toggle.setAttribute("aria-expanded", String(open));
      root.dataset.open = String(open);
      if (!open) closeAll(null);
    }

    if (toggle) {
      toggle.addEventListener("click", function () {
        setDrawer(toggle.getAttribute("aria-expanded") !== "true");
      });
    }

    menus.forEach(function (menu) {
      const button = menu.querySelector(".mm-button");
      const panel = menu.querySelector(".mm-panel");
      const back = panel.querySelector("[data-back]");

      button.addEventListener("click", function () {
        const open = button.getAttribute("aria-expanded") === "true";
        closeAll(menu);
        setOpen(menu, !open);
        if (narrow.matches && !open) {
          const first = panel.querySelector("[data-back]");
          if (first) first.focus();
        }
      });

      button.addEventListener("keydown", function (event) {
        if (event.key !== "ArrowDown" || narrow.matches) return;
        event.preventDefault();
        closeAll(menu);
        setOpen(menu, true);
        const first = panel.querySelector("a");
        if (first) first.focus();
      });

      if (back) {
        back.addEventListener("click", function () {
          setOpen(menu, false);
          button.focus();
        });
      }

      if (hoverOpens) {
        menu.addEventListener("mouseenter", function () {
          if (narrow.matches) return;
          closeAll(menu);
          setOpen(menu, true);
        });
      }

      // Picking a link closes the panel it came from, and the drawer with it.
      panel.addEventListener("click", function (event) {
        if (!event.target.closest("a")) return;
        setOpen(menu, false);
        setDrawer(false);
      });
    });

    if (hoverOpens) {
      root.addEventListener("mouseleave", function () {
        if (!narrow.matches) closeAll(null);
      });
    }

    // Escape and outside clicks are handled on the document: Safari does not focus a button when
    // it is tapped, so a listener on the nav alone would never hear the key.
    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      const open = openMenu();
      if (open) {
        event.preventDefault();
        setOpen(open, false);
        (narrow.matches && toggle ? toggle : open.querySelector(".mm-button")).focus();
        return;
      }
      if (toggle && toggle.getAttribute("aria-expanded") === "true") {
        event.preventDefault();
        setDrawer(false);
        toggle.focus();
      }
    });

    document.addEventListener("pointerdown", function (event) {
      if (root.contains(event.target)) return;
      closeAll(null);
      setDrawer(false);
    });

    // Rotating the phone (or resizing) starts again from a closed menu, in the right mode.
    narrow.addEventListener("change", function () {
      closeAll(null);
      setDrawer(false);
    });

    setDrawer(false);
  }

  document.querySelectorAll("[data-mega-menu]").forEach(createMegaMenu);
})();
