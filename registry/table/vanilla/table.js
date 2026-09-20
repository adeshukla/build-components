/**
 * Data table — plain JavaScript, no dependencies.
 * Every row ships in the HTML, so the table reads and prints before this runs. This adds
 * sorting (announced through aria-sort) and row selection (announced through a live count).
 */
(function () {
  const asNumber = function (value) {
    return Number(String(value).replace(/[^0-9.-]/g, ""));
  };
  const isNumeric = function (value) {
    return String(value).trim() !== "" && isFinite(asNumber(value)) && /\d/.test(value);
  };

  function createTable(root) {
    const body = root.querySelector("[data-body]");
    if (!body) return;
    const rows = Array.from(body.querySelectorAll("tr"));
    const count = root.querySelector("[data-count]");
    const selectAll = root.querySelector("[data-select-all]");
    const picks = Array.from(root.querySelectorAll("[data-select]"));

    root.querySelectorAll("[data-sort]").forEach(function (button) {
      const index = Number(button.dataset.sort);
      const head = button.closest("th");

      button.addEventListener("click", function () {
        const current = head.getAttribute("aria-sort");
        const direction = current === "ascending" ? "descending" : "ascending";

        // Only one column is sorted at a time, and the rest say so.
        root.querySelectorAll("th[aria-sort]").forEach(function (other) {
          other.setAttribute("aria-sort", "none");
        });
        head.setAttribute("aria-sort", direction);
        root.querySelectorAll(".tl-arrow").forEach(function (arrow) {
          arrow.textContent = "▴";
        });
        button.querySelector(".tl-arrow").textContent = direction === "descending" ? "▾" : "▴";

        const cellsOf = function (row) {
          return Array.from(row.querySelectorAll("th, td")).filter(function (cell) {
            return !cell.classList.contains("tl-pick");
          });
        };
        const numeric = rows.every(function (row) {
          return isNumeric(cellsOf(row)[index].textContent);
        });

        const sorted = rows.slice().sort(function (a, b) {
          const left = cellsOf(a)[index].textContent.trim();
          const right = cellsOf(b)[index].textContent.trim();
          const result = numeric ? asNumber(left) - asNumber(right) : left.localeCompare(right);
          return direction === "ascending" ? result : -result;
        });
        sorted.forEach(function (row) {
          body.appendChild(row);
        });
        paintStripes();
      });
    });

    function paintStripes() {
      Array.from(body.querySelectorAll("tr")).forEach(function (row, index) {
        row.classList.toggle("tl-odd", index % 2 === 1);
      });
    }

    function paintCount() {
      if (!count) return;
      const chosen = picks.filter(function (pick) {
        return pick.checked;
      }).length;
      count.textContent = chosen === 0 ? "No rows selected" : chosen + " of " + picks.length + " rows selected";
      if (selectAll) {
        selectAll.checked = chosen === picks.length && picks.length > 0;
        // "Some but not all" is its own state, and the browser draws it for us.
        selectAll.indeterminate = chosen > 0 && chosen < picks.length;
      }
    }

    picks.forEach(function (pick) {
      pick.addEventListener("change", paintCount);
    });
    if (selectAll) {
      selectAll.addEventListener("change", function () {
        picks.forEach(function (pick) {
          pick.checked = selectAll.checked;
        });
        paintCount();
      });
    }

    paintStripes();
    paintCount();
  }

  document.querySelectorAll("[data-table]").forEach(createTable);
})();
