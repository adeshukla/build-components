/**
 * Cursor pagination — plain JavaScript, no dependencies.
 * Newer and Older, no page numbers: this is the pattern for a list whose length nobody knows. Swap the
 * rows for your own request; the ends, the focus move and the announcement are the part worth keeping.
 */
(function () {
  /** Words with something put in them: "{count} left" (D94). */
  function fill(words, values) {
    return words.replace(/\{(\w+)\}/g, function (match, name) {
      return name in values ? String(values[name]) : match;
    });
  }

  // @config-start
  const config = {
    itemNoun: "entry",
    pageSize: 5,
    totalItems: 23,
    knowsTotal: false,
    showingText: "Showing {item} {range}",
    showingTotalText: "Showing {item} {range} of {total}",
    rangeText: "{start} to {end}",
  };
  // @config-end

  function createCursorPagination(root) {
    const heading = root.querySelector("[data-heading]");
    const range = root.querySelector("[data-range]");
    const list = root.querySelector("[data-list]");
    const previous = root.querySelector("[data-previous]");
    const next = root.querySelector("[data-next]");
    const atStartReason = root.querySelector("[data-at-start]");
    const atEndReason = root.querySelector("[data-at-end]");
    let start = 0;

    function capitalise(word) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }

    function paint(moved) {
      const count = Math.min(config.pageSize, Math.max(config.totalItems - start, 0));
      list.textContent = "";
      for (let index = 0; index < count; index++) {
        const row = start + index + 1;
        const li = document.createElement("li");
        li.className = "cp-row";
        const number = document.createElement("span");
        number.className = "cp-index";
        number.textContent = "#" + row;
        const label = document.createElement("span");
        label.textContent = " " + capitalise(config.itemNoun) + " " + row;
        li.appendChild(number);
        li.appendChild(label);
        list.appendChild(li);
      }

      const atStart = start === 0;
      // A cursor page knows it is the last because it came back short, not because it counted the rest.
      const atEnd = count < config.pageSize || start + count >= config.totalItems;

      [
        [previous, atStart, atStartReason],
        [next, atEnd, atEndReason],
      ].forEach(function (pair) {
        const button = pair[0];
        const stuck = pair[1];
        const reason = pair[2];
        if (stuck) {
          button.setAttribute("aria-disabled", "true");
          if (reason) {
            reason.hidden = false;
            button.setAttribute("aria-describedby", reason.id);
          }
        } else {
          button.removeAttribute("aria-disabled");
          button.removeAttribute("aria-describedby");
          if (reason) reason.hidden = true;
        }
      });

      if (range) {
        const numbers = fill(config.rangeText, { start: start + 1, end: start + count });
        range.textContent = config.knowsTotal
          ? fill(config.showingTotalText, { item: config.itemNoun, range: numbers, total: config.totalItems })
          : fill(config.showingText, { item: config.itemNoun, range: numbers });
      }

      // Focus goes to the heading: the buttons are at the bottom, so without this the new rows are
      // above where the keyboard is and nothing says they arrived.
      if (moved && heading) heading.focus();
    }

    previous.addEventListener("click", function () {
      if (previous.getAttribute("aria-disabled") === "true") return;
      start = Math.max(start - config.pageSize, 0);
      paint(true);
    });
    next.addEventListener("click", function () {
      if (next.getAttribute("aria-disabled") === "true") return;
      start = start + config.pageSize;
      paint(true);
    });

    paint(false);
  }

  document.querySelectorAll("[data-cursor-pagination]").forEach(createCursorPagination);
})();
