/**
 * Dropdown menu — plain JavaScript, no dependencies.
 * Follows the WAI-ARIA menu button pattern: the arrows open the menu and move between items,
 * typing jumps to an item, Escape returns focus to the button and Tab leaves the menu.
 */
(function () {
  function createMenu(root) {
    const button = root.querySelector("[data-button]");
    const list = root.querySelector(".mn-list");
    const items = Array.from(root.querySelectorAll(".mn-item"));
    if (!button || !list || items.length === 0) return;
    const typeAhead = root.dataset.typeAhead !== "false";
    let typed = "";
    let typedAt = 0;

    function setOpen(open, index) {
      button.setAttribute("aria-expanded", String(open));
      list.hidden = !open;
      if (open && typeof index === "number") items[index < 0 ? items.length - 1 : index].focus();
    }

    function close(focusButton) {
      setOpen(false);
      if (focusButton) button.focus();
    }

    button.addEventListener("click", function () {
      const open = button.getAttribute("aria-expanded") === "true";
      if (open) close(false);
      else setOpen(true, 0);
    });

    button.addEventListener("keydown", function (event) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setOpen(true, 0);
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setOpen(true, -1);
      }
    });

    items.forEach(function (item, index) {
      item.addEventListener("click", function () {
        close(item.tagName !== "A");
      });

      item.addEventListener("keydown", function (event) {
        const moves = {
          ArrowDown: (index + 1) % items.length,
          ArrowUp: (index - 1 + items.length) % items.length,
          Home: 0,
          End: items.length - 1,
        };
        if (event.key in moves) {
          event.preventDefault();
          items[moves[event.key]].focus();
          return;
        }
        if (event.key === "Tab") {
          setOpen(false); // Tab leaves the menu instead of walking through it.
          return;
        }
        if (!typeAhead || event.key.length !== 1 || event.metaKey || event.ctrlKey) return;
        const now = Date.now();
        typed = now - typedAt > 600 ? event.key : typed + event.key;
        typedAt = now;
        const order = items.slice(index + 1).concat(items.slice(0, index + 1));
        const found = order.find(function (other) {
          return other.textContent.trim().toLowerCase().indexOf(typed.toLowerCase()) === 0;
        });
        if (found) found.focus();
      });
    });

    // Escape and outside clicks are handled on the document: Safari does not focus a button when
    // it is tapped, so a listener on the menu alone would never hear the key.
    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape" || button.getAttribute("aria-expanded") !== "true") return;
      event.preventDefault();
      close(true);
    });

    document.addEventListener("pointerdown", function (event) {
      if (!root.contains(event.target)) close(false);
    });
  }

  document.querySelectorAll("[data-menu]").forEach(createMenu);
})();
