/**
 * Data grid — plain JavaScript, no dependencies.
 * Sortable columns that report aria-sort, a header that stays put while the body scrolls, and
 * columns that resize by drag or by arrow key.
 */
(function () {
  const MIN_WIDTH = 96;
  const MAX_WIDTH = 480;
  const clamp = function (value) {
    return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(value)));
  };

  function createDataGrid(root) {
    const body = root.querySelector("[data-body]");
    const status = root.querySelector("[data-status]");
    const headers = Array.from(root.querySelectorAll("[data-column]"));
    const cols = Array.from(root.querySelectorAll("[data-col]"));
    const order = headers.map(function (header) {
      return header.dataset.column;
    });
    let sortKey = null;
    let direction = "ascending";

    function cellText(row, key) {
      return row.children[order.indexOf(key)].textContent.trim();
    }

    function sortBy(key) {
      direction = sortKey === key && direction === "ascending" ? "descending" : "ascending";
      sortKey = key;
      const rows = Array.from(body.children);
      const factor = direction === "ascending" ? 1 : -1;
      rows
        .sort(function (a, b) {
          return cellText(a, key).localeCompare(cellText(b, key)) * factor;
        })
        .forEach(function (row) {
          body.append(row);
        });

      headers.forEach(function (header) {
        const here = header.dataset.column === key;
        header.setAttribute("aria-sort", here ? direction : "none");
        const arrow = header.querySelector(".dg-arrow");
        if (arrow) arrow.textContent = here ? (direction === "ascending" ? "↑" : "↓") : "↕";
        if (here && status) {
          const label = header.textContent.replace(/[↕↑↓]/g, "").trim();
          status.textContent = "Sorted by " + label + ", " + direction;
        }
      });
    }

    root.querySelectorAll("[data-sort]").forEach(function (button) {
      button.addEventListener("click", function () {
        sortBy(button.dataset.sort);
      });
    });

    function setWidth(handle, next) {
      const index = Number(handle.dataset.index);
      const width = clamp(next);
      cols[index].style.width = width + "px";
      handle.setAttribute("aria-valuenow", String(width));
      handle.setAttribute("aria-valuetext", width + " pixels");
    }

    root.querySelectorAll("[data-handle]").forEach(function (handle) {
      const start = Number(handle.getAttribute("aria-valuenow"));
      let drag = null;

      // Dragging is the quick way; the arrow keys are the way that works without a pointer.
      handle.addEventListener("keydown", function (event) {
        const step = event.shiftKey ? 48 : 16;
        const now = Number(handle.getAttribute("aria-valuenow"));
        if (event.key === "ArrowRight") setWidth(handle, now + step);
        else if (event.key === "ArrowLeft") setWidth(handle, now - step);
        else if (event.key === "Home") setWidth(handle, start);
        else return;
        event.preventDefault();
      });

      handle.addEventListener("pointerdown", function (event) {
        drag = { from: event.clientX, width: Number(handle.getAttribute("aria-valuenow")) };
        handle.setPointerCapture(event.pointerId);
      });
      handle.addEventListener("pointermove", function (event) {
        if (!drag) return;
        setWidth(handle, drag.width + (event.clientX - drag.from));
      });
      handle.addEventListener("pointerup", function () {
        drag = null;
      });
    });
  }

  document.querySelectorAll("[data-data-grid]").forEach(createDataGrid);
})();
