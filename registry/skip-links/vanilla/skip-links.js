/**
 * Skip links — plain JavaScript, no dependencies.
 * The CSS does the showing. This moves focus, because browsers have not always done it reliably and a
 * link that only scrolls leaves the keyboard in the header it just skipped.
 */
(function () {
  function createSkipLinks(root) {
    root.querySelectorAll("[data-skip]").forEach(function (link) {
      link.addEventListener("click", function (event) {
        const target = document.getElementById(link.getAttribute("href").slice(1));
        if (target === null) return;
        event.preventDefault();
        target.focus();
        target.scrollIntoView({ block: "start" });
      });
    });
  }

  document.querySelectorAll("[data-skip-links]").forEach(createSkipLinks);
})();
