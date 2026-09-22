/**
 * Guided tour — plain JavaScript, no dependencies.
 * Each step is a non-modal dialog placed beside its target, with a ring round the target. Focus
 * moves to every step; Skip and Escape end it from anywhere, and focus goes back to the start.
 * The root fires "tour-end" with event.detail.finished (true when the last step was reached).
 */
(function () {
  /** A step's target, or nothing if the selector is invalid or matches nothing on this page. */
  function find(selector) {
    try {
      return document.querySelector(selector);
    } catch {
      return null;
    }
  }

  function createTour(root) {
    const start = root.querySelector("[data-start]");
    const ring = root.querySelector("[data-ring]");
    const popup = root.querySelector("[data-step]");
    const count = root.querySelector("[data-count]");
    const title = popup.querySelector("#tour-title");
    const body = popup.querySelector("#tour-body");
    const back = popup.querySelector("[data-back]");
    const next = popup.querySelector("[data-next]");
    const showProgress = root.dataset.progress !== "false";
    let all = [];
    try {
      all = JSON.parse(root.querySelector("[data-steps]").textContent);
    } catch {
      all = [];
    }
    let steps = [];
    let index = -1;
    let target = null;

    /** The ring round the target and the step beside it: below if it fits, otherwise above. */
    function place() {
      if (!target) return;
      const box = target.getBoundingClientRect();
      const gap = 12;
      const pad = 6;
      ring.style.top = box.top - pad + "px";
      ring.style.left = box.left - pad + "px";
      ring.style.width = box.width + pad * 2 + "px";
      ring.style.height = box.height + pad * 2 + "px";
      let top = box.bottom + gap;
      if (top + popup.offsetHeight > window.innerHeight - 8) top = Math.max(8, box.top - gap - popup.offsetHeight);
      popup.style.top = top + "px";
      popup.style.left = Math.min(Math.max(8, box.left), window.innerWidth - popup.offsetWidth - 8) + "px";
    }

    function show(at) {
      index = at;
      const step = steps[at];
      target = find(step.target);
      count.textContent = showProgress ? "Step " + (at + 1) + " of " + steps.length : "";
      title.textContent = step.title;
      body.textContent = step.body;
      back.hidden = at === 0;
      next.textContent = at === steps.length - 1 ? "Finish" : "Next";
      ring.hidden = false;
      popup.hidden = false;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
      place();
      // Focus moves to the step, so a screen reader reads it.
      title.focus({ preventScroll: true });
    }

    function end(finished) {
      index = -1;
      target = null;
      ring.hidden = true;
      popup.hidden = true;
      start.focus();
      root.dispatchEvent(new CustomEvent("tour-end", { detail: { finished: finished } }));
    }

    start.addEventListener("click", function () {
      // Only steps whose target is on the page, so the tour never points at nothing.
      steps = all.filter((step) => step.title && find(step.target));
      if (steps.length) show(0);
    });
    popup.querySelector("[data-skip]").addEventListener("click", function () {
      end(false);
    });
    back.addEventListener("click", function () {
      show(index - 1);
    });
    next.addEventListener("click", function () {
      if (index === steps.length - 1) end(true);
      else show(index + 1);
    });

    // Escape ends the tour from anywhere (on the document: Safari does not focus clicked buttons).
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && index !== -1) end(false);
    });
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
  }

  document.querySelectorAll("[data-tour]").forEach(createTour);
})();
