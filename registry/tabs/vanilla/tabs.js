/**
 * Tabs — plain JavaScript, no dependencies.
 * The markup ships as real HTML with the first panel open; this adds the keyboard behaviour
 * from the WAI-ARIA Tabs pattern: arrow keys move, Home and End jump to the ends.
 */
(function () {
  function createTabs(root) {
    const tabs = Array.from(root.querySelectorAll('[role="tab"]'));
    if (tabs.length === 0) return;
    const automatic = root.dataset.activation !== "manual";
    const vertical = root.classList.contains("tb--vertical");

    function select(index) {
      tabs.forEach(function (tab, i) {
        const panel = root.querySelector("#" + tab.getAttribute("aria-controls"));
        tab.setAttribute("aria-selected", String(i === index));
        tab.tabIndex = i === index ? 0 : -1;
        if (panel) panel.hidden = i !== index;
      });
    }

    function focusTab(index) {
      tabs[index].focus();
      if (automatic) select(index);
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () {
        select(index);
      });
      tab.addEventListener("keydown", function (event) {
        const moves = {
          Home: 0,
          End: tabs.length - 1,
        };
        moves[vertical ? "ArrowUp" : "ArrowLeft"] = (index - 1 + tabs.length) % tabs.length;
        moves[vertical ? "ArrowDown" : "ArrowRight"] = (index + 1) % tabs.length;
        if (!(event.key in moves)) return;
        event.preventDefault();
        focusTab(moves[event.key]);
      });
    });
  }

  document.querySelectorAll("[data-tabs]").forEach(createTabs);
})();
