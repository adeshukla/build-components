/**
 * Tabs — plain JavaScript, no dependencies.
 * The markup ships as real HTML with the first panel open; this adds the keyboard behaviour
 * from the WAI-ARIA Tabs pattern: arrow keys move, Home and End jump to the ends.
 */
(function () {
  /** The key as the reader means it (D93): in a right-to-left page, Left goes forward and Right goes back. */
  function keyOf(event) {
    const rtl = event.target instanceof Element && getComputedStyle(event.target).direction === "rtl";
    const swapped = { ArrowLeft: "ArrowRight", ArrowRight: "ArrowLeft" };
    return rtl ? (swapped[event.key] ?? event.key) : event.key;
  }

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
        if (!(keyOf(event) in moves)) return;
        event.preventDefault();
        focusTab(moves[keyOf(event)]);
      });
    });
  }

  document.querySelectorAll("[data-tabs]").forEach(createTabs);
})();
