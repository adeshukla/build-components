/**
 * Menu bar — plain JavaScript, no dependencies.
 * The APG menubar keyboard model: one tab stop for the whole bar, arrows inside it, sideways from
 * within a menu moves to the next menu already open, and a typed letter jumps.
 */
(function () {
  /** The key as the reader means it (D93): in a right-to-left page, Left goes forward and Right goes back. */
  function keyOf(event) {
    const rtl = event.target instanceof Element && getComputedStyle(event.target).direction === "rtl";
    const swapped = { ArrowLeft: "ArrowRight", ArrowRight: "ArrowLeft" };
    return rtl ? (swapped[event.key] ?? event.key) : event.key;
  }

  function createMenuBar(root) {
    const tops = Array.from(root.querySelectorAll("[data-top]"));
    const menus = tops.map(function (top) {
      return root.querySelector('[data-menu="' + top.dataset.top + '"]');
    });
    const status = root.querySelector("[data-status]");
    let focusAt = 0;
    let openAt = null;

    function itemsIn(index) {
      return Array.from(menus[index].querySelectorAll('[role="menuitem"]'));
    }

    function paintTabStops() {
      // One tab stop for the whole bar: the arrows move inside it, which is what a menubar is.
      tops.forEach(function (top, index) {
        top.tabIndex = index === focusAt ? 0 : -1;
      });
    }

    function shut() {
      menus.forEach(function (menu, index) {
        menu.hidden = true;
        tops[index].setAttribute("aria-expanded", "false");
      });
      openAt = null;
    }

    function openMenu(index, place) {
      shut();
      openAt = index;
      focusAt = index;
      paintTabStops();
      menus[index].hidden = false;
      tops[index].setAttribute("aria-expanded", "true");
      const list = itemsIn(index);
      const target = place === "last" ? list[list.length - 1] : list[0];
      if (target) target.focus();
    }

    function moveTop(to, keepOpen) {
      const next = (to + tops.length) % tops.length;
      if (keepOpen) {
        openMenu(next, "first");
        return;
      }
      shut();
      focusAt = next;
      paintTabStops();
      tops[next].focus();
    }

    /** Type a letter to jump to the next item starting with it — the APG's own type-ahead. */
    function typeAhead(list, from, key) {
      const lower = key.toLowerCase();
      for (let step = 1; step <= list.length; step++) {
        const at = list[(from + step) % list.length];
        if (at.textContent.trim().toLowerCase().indexOf(lower) === 0) {
          at.focus();
          return true;
        }
      }
      return false;
    }

    tops.forEach(function (top, index) {
      top.addEventListener("click", function () {
        if (openAt === index) {
          shut();
          top.focus();
        } else {
          openMenu(index, "first");
        }
      });

      top.addEventListener("keydown", function (event) {
        if (keyOf(event) === "ArrowRight") {
          event.preventDefault();
          moveTop(index + 1, openAt !== null);
        } else if (keyOf(event) === "ArrowLeft") {
          event.preventDefault();
          moveTop(index - 1, openAt !== null);
        } else if (keyOf(event) === "ArrowDown" || keyOf(event) === "Enter" || keyOf(event) === " ") {
          event.preventDefault();
          openMenu(index, "first");
        } else if (keyOf(event) === "ArrowUp") {
          event.preventDefault();
          openMenu(index, "last");
        } else if (keyOf(event) === "Home") {
          event.preventDefault();
          moveTop(0, false);
        } else if (keyOf(event) === "End") {
          event.preventDefault();
          moveTop(tops.length - 1, false);
        }
      });
    });

    menus.forEach(function (menu, index) {
      itemsIn(index).forEach(function (item, at) {
        item.tabIndex = -1;

        item.addEventListener("click", function () {
          if (status) status.textContent = "Chose: " + (item.dataset.label || item.textContent.trim());
          shut();
          tops[index].focus();
        });

        item.addEventListener("keydown", function (event) {
          const list = itemsIn(index);
          if (keyOf(event) === "ArrowDown") {
            event.preventDefault();
            list[(at + 1) % list.length].focus();
          } else if (keyOf(event) === "ArrowUp") {
            event.preventDefault();
            list[(at - 1 + list.length) % list.length].focus();
          } else if (keyOf(event) === "Home") {
            event.preventDefault();
            list[0].focus();
          } else if (keyOf(event) === "End") {
            event.preventDefault();
            list[list.length - 1].focus();
          } else if (keyOf(event) === "ArrowRight") {
            // From inside a menu, sideways means the next menu — opened, as the APG has it.
            event.preventDefault();
            moveTop(index + 1, true);
          } else if (keyOf(event) === "ArrowLeft") {
            event.preventDefault();
            moveTop(index - 1, true);
          } else if (keyOf(event) === "Tab") {
            // Tab leaves the whole bar rather than walking the menu it opened.
            shut();
          } else if (keyOf(event).length === 1 && /\S/.test(keyOf(event))) {
            if (typeAhead(list, at, keyOf(event))) event.preventDefault();
          }
        });
      });
    });

    // Escape and outside clicks are heard on the document: Safari does not focus a clicked button, so
    // listening on the component's own root would miss them.
    document.addEventListener("keydown", function (event) {
      if (keyOf(event) !== "Escape" || openAt === null) return;
      const at = openAt;
      shut();
      tops[at].focus();
    });
    document.addEventListener("pointerdown", function (event) {
      if (openAt !== null && !root.contains(event.target)) shut();
    });

    shut();
    paintTabStops();
  }

  document.querySelectorAll("[data-menu-bar]").forEach(createMenuBar);
})();
