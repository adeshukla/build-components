/**
 * Sortable list — plain JavaScript, no dependencies.
 * Three ways to reorder: drag a handle, pick an item up with Space and move it with the arrow
 * keys, or use the move buttons (a way that needs no dragging, as WCAG 2.2 asks).
 * After every move the root fires "sortable-change": event.detail.order is the labels in order.
 */
(function () {
  function createSortableList(root) {
    const list = root.querySelector("[data-list]");
    const status = root.querySelector("[data-status]");
    let grabbed = null;
    let before = [];
    let moving = false;

    const rows = () => Array.from(list.children);
    const labelOf = (row) => row.dataset.label;
    const position = (row) => "position " + (rows().indexOf(row) + 1) + " of " + rows().length;

    function announce(message) {
      status.textContent = message;
    }

    /** Numbers, end buttons and the change event follow every move. */
    function refresh() {
      const all = rows();
      all.forEach(function (row, index) {
        const number = row.querySelector(".so-number");
        if (number) number.textContent = String(index + 1);
        [
          [row.querySelector("[data-up]"), index === 0],
          [row.querySelector("[data-down]"), index === all.length - 1],
        ].forEach(function (pair) {
          if (!pair[0]) return;
          if (pair[1]) pair[0].setAttribute("aria-disabled", "true");
          else pair[0].removeAttribute("aria-disabled");
        });
      });
      root.dispatchEvent(new CustomEvent("sortable-change", { detail: { order: all.map(labelOf) } }));
    }

    /** Moving a DOM node drops its focus, so focus is put back on the control that moved it. */
    function moveTo(row, index, control) {
      const all = rows();
      if (index < 0 || index >= all.length || all[index] === row) return false;
      const focused = control || document.activeElement;
      moving = true;
      const target = all[index];
      list.insertBefore(row, index > all.indexOf(row) ? target.nextSibling : target);
      if (focused && row.contains(focused)) focused.focus();
      moving = false;
      refresh();
      return true;
    }

    function drop(row) {
      grabbed = null;
      row.removeAttribute("data-active");
      row.querySelector("[data-handle]").setAttribute("aria-pressed", "false");
    }

    list.addEventListener("keydown", function (event) {
      const handle = event.target.closest("[data-handle]");
      if (!handle) return;
      const row = handle.closest(".so-item");
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        if (grabbed === row) {
          drop(row);
          announce(labelOf(row) + " dropped at " + position(row) + ".");
        } else {
          if (grabbed) drop(grabbed);
          grabbed = row;
          before = rows();
          row.setAttribute("data-active", "");
          handle.setAttribute("aria-pressed", "true");
          announce("Picked up " + labelOf(row) + ", " + position(row) + ". Use the up and down arrows to move it, Space to drop, Escape to cancel.");
        }
      } else if (grabbed === row && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
        event.preventDefault();
        const index = rows().indexOf(row) + (event.key === "ArrowUp" ? -1 : 1);
        if (moveTo(row, index, handle)) announce(labelOf(row) + " moved to " + position(row) + ".");
      } else if (grabbed === row && event.key === "Escape") {
        event.preventDefault();
        moving = true;
        before.forEach(function (original) {
          list.appendChild(original);
        });
        handle.focus();
        moving = false;
        refresh();
        drop(row);
        announce("Cancelled. " + labelOf(row) + " is back at " + position(row) + ".");
      }
    });

    // Leaving a picked-up item drops it where it is.
    list.addEventListener("focusout", function (event) {
      if (moving || !grabbed || !event.target.matches("[data-handle]")) return;
      if (event.target.closest(".so-item") === grabbed) drop(grabbed);
    });

    list.addEventListener("click", function (event) {
      const button = event.target.closest("[data-up], [data-down]");
      if (!button) return;
      const row = button.closest(".so-item");
      const up = button.hasAttribute("data-up");
      if (moveTo(row, rows().indexOf(row) + (up ? -1 : 1), button)) {
        announce(labelOf(row) + " moved to " + position(row) + ".");
      } else {
        announce(labelOf(row) + " is already " + (up ? "first" : "last") + ".");
      }
    });

    // Pointer dragging: the row follows the pointer past each neighbour's midpoint.
    list.addEventListener("pointerdown", function (event) {
      const handle = event.target.closest("[data-handle]");
      if (!handle || event.button !== 0) return;
      const row = handle.closest(".so-item");
      const start = rows().indexOf(row);
      row.setAttribute("data-active", "");
      row.setAttribute("data-dragging", "");

      function onMove(moveEvent) {
        const all = rows();
        const from = all.indexOf(row);
        let to = from;
        all.forEach(function (other, index) {
          if (index === from) return;
          const box = other.getBoundingClientRect();
          const middle = box.top + box.height / 2;
          if (index < from && moveEvent.clientY < middle) to = Math.min(to, index);
          if (index > from && moveEvent.clientY > middle) to = Math.max(to, index);
        });
        if (to !== from) moveTo(row, to, handle);
      }

      function onUp() {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        row.removeAttribute("data-dragging");
        if (grabbed !== row) row.removeAttribute("data-active");
        if (rows().indexOf(row) !== start) announce(labelOf(row) + " dropped at " + position(row) + ".");
      }

      // On the window, not the handle: moving the row's node would drop pointer capture.
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    });
  }

  document.querySelectorAll("[data-sortable-list]").forEach(createSortableList);
})();
