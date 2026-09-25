/**
 * Toolbar — plain JavaScript, no dependencies.
 * The APG toolbar pattern: one tab stop for the whole bar, arrow keys to move inside it, and Home
 * and End to jump to the ends.
 */
(function () {
  function createToolbar(root) {
    const bar = root.querySelector("[data-bar]");
    const items = Array.from(root.querySelectorAll("[data-item]"));
    const status = root.querySelector("[data-status]");
    if (!items.length) return;
    let here = 0;

    function go(to) {
      here = (to + items.length) % items.length;
      items.forEach(function (item, index) {
        item.tabIndex = index === here ? 0 : -1;
      });
      items[here].focus();
    }

    bar.addEventListener("keydown", function (event) {
      const vertical = bar.getAttribute("aria-orientation") === "vertical";
      const forward = vertical ? "ArrowDown" : "ArrowRight";
      const back = vertical ? "ArrowUp" : "ArrowLeft";
      if (event.key === forward) go(here + 1);
      else if (event.key === back) go(here - 1);
      else if (event.key === "Home") go(0);
      else if (event.key === "End") go(items.length - 1);
      else return;
      event.preventDefault();
    });

    items.forEach(function (item, index) {
      item.addEventListener("focus", function () {
        here = index;
        items.forEach(function (other, i) {
          other.tabIndex = i === index ? 0 : -1;
        });
      });

      item.addEventListener("click", function () {
        if (item.dataset.kind === "toggle") {
          const on = item.getAttribute("aria-pressed") !== "true";
          item.setAttribute("aria-pressed", String(on));
          if (status) status.textContent = item.textContent + (on ? " on" : " off");
        } else if (status) {
          status.textContent = item.textContent + " done";
        }
      });
    });
  }

  document.querySelectorAll("[data-toolbar]").forEach(createToolbar);
})();
