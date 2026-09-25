/**
 * Kanban board — plain JavaScript, no dependencies.
 * Cards move with the buttons on the card as well as by dragging, every move is announced, and
 * focus follows the card to its new column.
 */
(function () {
  function createKanban(root) {
    const columns = Array.from(root.querySelectorAll("[data-column]"));
    const status = root.querySelector("[data-status]");
    const names = columns.map(function (column) {
      return column.dataset.column;
    });

    function indexOfColumn(card) {
      return columns.indexOf(card.closest("[data-column]"));
    }

    /** The buttons say where the card would go, so they change with the card. */
    function relabel(card) {
      const index = indexOfColumn(card);
      card.querySelectorAll("[data-move]").forEach(function (button) {
        const to = index + Number(button.dataset.move);
        button.hidden = to < 0 || to >= columns.length;
        const sr = button.querySelector(".kb-sr");
        if (sr) sr.textContent = "Move " + card.dataset.title + " to " + (names[to] || "");
      });
    }

    function counts() {
      columns.forEach(function (column) {
        const count = column.querySelector("[data-count]");
        // The space is part of the name, so it reads "To do (2)" rather than "To do(2)".
        if (count) count.textContent = " (" + column.querySelectorAll("[data-card]").length + ")";
      });
    }

    function moveTo(card, index) {
      if (index < 0 || index >= columns.length) return;
      const list = columns[index].querySelector("[data-list]");
      list.append(card);
      relabel(card);
      counts();
      const siblings = Array.from(list.querySelectorAll("[data-card]"));
      if (status) {
        status.textContent =
          card.dataset.title + " moved to " + names[index] + ", " + (siblings.indexOf(card) + 1) + " of " + siblings.length;
      }
      // The button that was pressed may now be hidden, so focus the card's first usable one.
      const next = card.querySelector("[data-move]:not([hidden])");
      if (next) next.focus();
    }

    root.querySelectorAll("[data-card]").forEach(function (card) {
      relabel(card);
      card.querySelectorAll("[data-move]").forEach(function (button) {
        button.addEventListener("click", function () {
          moveTo(card, indexOfColumn(card) + Number(button.dataset.move));
        });
      });
      card.addEventListener("dragstart", function (event) {
        event.dataTransfer.setData("text/plain", card.dataset.title);
      });
    });

    if (root.dataset.drag === "true") {
      columns.forEach(function (column, index) {
        column.addEventListener("dragover", function (event) {
          event.preventDefault();
        });
        column.addEventListener("drop", function (event) {
          event.preventDefault();
          const title = event.dataTransfer.getData("text/plain");
          const card = root.querySelector('[data-card][data-title="' + title.replace(/"/g, '\\"') + '"]');
          if (card) moveTo(card, index);
        });
      });
    }

    counts();
  }

  document.querySelectorAll("[data-kanban]").forEach(createKanban);
})();
