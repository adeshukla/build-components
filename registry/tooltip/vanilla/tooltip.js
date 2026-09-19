/**
 * Tooltip — plain JavaScript, no dependencies.
 * Opens on hover after the delay and on keyboard focus straight away; closes on Escape, on blur
 * and when the pointer leaves. Focus never moves into the tooltip.
 */
(function () {
  function createTooltip(root) {
    const trigger = root.querySelector("[data-trigger]");
    const tip = root.querySelector(".tt-tip");
    if (!trigger || !tip) return;
    const delay = Number(root.dataset.delay) || 0;
    let timer = null;

    function show(immediate) {
      clearTimeout(timer);
      const reveal = function () {
        tip.hidden = false;
        trigger.setAttribute("aria-describedby", tip.id);
      };
      if (immediate || delay === 0) reveal();
      else timer = setTimeout(reveal, delay);
    }

    function hide() {
      clearTimeout(timer);
      tip.hidden = true;
      trigger.removeAttribute("aria-describedby");
    }

    trigger.addEventListener("mouseenter", function () {
      show(false);
    });
    trigger.addEventListener("mouseleave", hide);
    trigger.addEventListener("focus", function () {
      show(true);
    });
    trigger.addEventListener("blur", hide);

    // Escape closes the tooltip without moving focus, so it can never hide what you are reading.
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") hide();
    });
  }

  document.querySelectorAll("[data-tooltip]").forEach(createTooltip);
})();
