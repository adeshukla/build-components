/**
 * Back to top — plain JavaScript, no dependencies.
 * Appears once there is enough page behind you, and moves focus as well as scrolling: scrolling
 * alone would leave a keyboard user still at the bottom of the page.
 */
(function () {
  function createBackToTop(root) {
    const button = root.querySelector("[data-button]");
    const after = Number(root.dataset.after) || 0;

    function paint() {
      button.hidden = window.scrollY <= after;
    }

    button.addEventListener("click", function () {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      const target = root.dataset.target ? document.getElementById(root.dataset.target) : null;
      const landing = target || document.querySelector("h1") || document.body;
      if (landing && landing.tabIndex < 0) landing.tabIndex = -1;
      if (landing) landing.focus({ preventScroll: true });
    });

    window.addEventListener("scroll", paint, { passive: true });
    paint();
  }

  document.querySelectorAll("[data-back-to-top]").forEach(createBackToTop);
})();
