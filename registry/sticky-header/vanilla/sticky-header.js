/**
 * Shrinking sticky header — plain JavaScript, no dependencies.
 * Two data attributes and CSS do the work. This only decides when to set them, and brings the header
 * back whenever anything inside it takes focus.
 */
(function () {
  // @config-start
  const config = {
    shrink: true,
    hideOnScrollDown: true,
    threshold: 80,
    navLabel: "Sections",
  };
  // @config-end

  function createStickyHeader(root) {
    const scroller = root.querySelector("[data-scroller]");
    const header = root.querySelector("[data-header]");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lastY = 0;

    // Written as true or false rather than added and removed, so a header that has never been told
    // anything is distinguishable from one that has been told no.
    function set(name, on) {
      header.setAttribute(name, on ? "true" : "false");
    }

    scroller.addEventListener(
      "scroll",
      function () {
        const y = scroller.scrollTop;
        const previous = lastY;
        set("data-shrunk", config.shrink && y > config.threshold);
        // Shrinking the header shortens the content above, and the browser nudges scrollTop by a few
        // pixels to keep the view still. Those nudges arrive as scroll events going the other way, so
        // a header that reads every event as direction pops straight back the moment it shrinks. Only
        // a real move counts, and the last decisive position is what the next one is measured against.
        if (Math.abs(y - previous) < 8) return;
        lastY = y;
        // Hiding a header is motion in the way that matters, so under reduced motion it stays put.
        if (!config.hideOnScrollDown || still.matches) {
          set("data-away", false);
          return;
        }
        set("data-away", y > config.threshold && y > previous);
      },
      { passive: true },
    );

    set("data-shrunk", false);
    set("data-away", false);

    // Focus anywhere inside brings it back: a keyboard moving up the page must not chase a header
    // that has hidden itself.
    header.addEventListener("focusin", function () {
      set("data-away", false);
    });
  }

  document.querySelectorAll("[data-sticky-header]").forEach(createStickyHeader);
})();
