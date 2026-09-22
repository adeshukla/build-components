/**
 * Resizable panels — plain JavaScript, no dependencies.
 * Follows the WAI-ARIA APG "Window Splitter" pattern. The root fires "panels-resize" with
 * event.detail.size (the first panel's percentage, 0 when collapsed).
 */
(function () {
  function createResizablePanels(root) {
    const first = root.querySelector("[data-first]");
    const divider = root.querySelector("[data-divider]");
    const min = Number(root.dataset.min) || 0;
    const max = Number(root.dataset.max) || 100;
    const step = Number(root.dataset.step) || 5;
    const collapsible = root.dataset.collapsible !== "false";
    const title = root.dataset.title || "";
    const horizontal = root.classList.contains("rp--horizontal");
    let size = Number(divider.getAttribute("aria-valuenow")) || min;
    let collapsed = false;
    let dragging = false;

    function paint() {
      const shown = collapsed ? 0 : size;
      first.hidden = collapsed;
      first.style.flexBasis = shown + "%";
      divider.setAttribute("aria-valuenow", String(shown));
      divider.setAttribute("aria-valuetext", collapsed ? title + " collapsed" : title + " " + shown + "%");
      root.dispatchEvent(new CustomEvent("panels-resize", { detail: { size: shown } }));
    }

    function resize(value) {
      collapsed = false;
      size = Math.min(max, Math.max(min, Math.round(value)));
      paint();
    }

    // Arrows move it, Home/End jump to the limits, Enter collapses and restores.
    divider.addEventListener("keydown", function (event) {
      const less = horizontal ? "ArrowLeft" : "ArrowUp";
      const more = horizontal ? "ArrowRight" : "ArrowDown";
      let handled = true;
      if (event.key === less) resize((collapsed ? 0 : size) - step);
      else if (event.key === more) resize(collapsed ? min : size + step);
      else if (event.key === "Home") resize(min);
      else if (event.key === "End") resize(max);
      else if (event.key === "Enter" && collapsible) {
        collapsed = !collapsed;
        paint();
      } else handled = false;
      if (handled) event.preventDefault();
    });

    divider.addEventListener("pointerdown", function (event) {
      if (event.button !== 0) return;
      divider.setPointerCapture(event.pointerId);
      divider.focus();
      dragging = true;
    });
    divider.addEventListener("pointermove", function (event) {
      if (!dragging) return;
      const box = root.getBoundingClientRect();
      const at = horizontal ? (event.clientX - box.left) / box.width : (event.clientY - box.top) / box.height;
      resize(at * 100);
    });
    const stop = function () {
      dragging = false;
    };
    divider.addEventListener("pointerup", stop);
    divider.addEventListener("pointercancel", stop);
    divider.addEventListener("dblclick", function () {
      if (!collapsible) return;
      collapsed = !collapsed;
      paint();
    });
  }

  document.querySelectorAll("[data-resizable-panels]").forEach(createResizablePanels);
})();
