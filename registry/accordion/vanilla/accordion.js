/**
 * Accordion — plain JavaScript, no dependencies.
 * Every section ships in the HTML, so the content is there before this runs. This only opens
 * and closes them, and keeps one open at a time when that is what you asked for.
 */
(function () {
  function createAccordion(root) {
    const buttons = Array.from(root.querySelectorAll(".ac-button"));
    if (buttons.length === 0) return;
    const multiple = root.dataset.multiple === "true";

    function setOpen(button, open) {
      const panel = root.querySelector("#" + button.getAttribute("aria-controls"));
      button.setAttribute("aria-expanded", String(open));
      if (panel) panel.hidden = !open;
    }

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        const open = button.getAttribute("aria-expanded") === "true";
        if (!multiple) {
          buttons.forEach(function (other) {
            if (other !== button) setOpen(other, false);
          });
        }
        setOpen(button, !open);
      });
    });
  }

  document.querySelectorAll("[data-accordion]").forEach(createAccordion);
})();
