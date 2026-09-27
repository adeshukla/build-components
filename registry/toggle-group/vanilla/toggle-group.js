/**
 * Toggle group — plain JavaScript, no dependencies.
 * The boxes do the work. This stops the last one turning itself off when the group needs one, and
 * says what is picked.
 */
(function () {
  function createToggleGroup(root) {
    const boxes = Array.from(root.querySelectorAll("[data-option]"));
    const status = root.querySelector("[data-status]");
    const minOne = root.dataset.minOne === "true";

    function picked() {
      return boxes.filter(function (box) {
        return box.checked;
      });
    }

    function label(box) {
      return box.closest(".tg-option").textContent.trim();
    }

    function refresh() {
      const on = picked();
      // The one that cannot be turned off says so, rather than silently refusing the click.
      if (minOne) {
        boxes.forEach(function (box) {
          if (box.checked && on.length === 1) box.setAttribute("aria-disabled", "true");
          else box.removeAttribute("aria-disabled");
        });
      }
      if (status) {
        status.textContent = on.length ? on.length + " picked: " + on.map(label).join(", ") : "Nothing picked";
      }
    }

    boxes.forEach(function (box) {
      box.addEventListener("click", function (event) {
        // By the time a click is heard the box has already flipped: putting it back is the refusal.
        if (minOne && !box.checked && picked().length === 0) {
          event.preventDefault();
          return;
        }
        refresh();
      });
    });

    refresh();
  }

  document.querySelectorAll("[data-toggle-group]").forEach(createToggleGroup);
})();
