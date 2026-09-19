/**
 * Popover — plain JavaScript, no dependencies.
 * Unlike a tooltip, a popover holds things you can use, so focus moves into it when it opens
 * and back to the trigger when it closes.
 */
(function () {
  function createPopover(root) {
    const trigger = root.querySelector("[data-trigger]");
    const panel = root.querySelector(".pv-panel");
    if (!trigger || !panel) return;
    const closeOutside = root.dataset.closeOutside !== "false";

    function setOpen(open) {
      trigger.setAttribute("aria-expanded", String(open));
      panel.hidden = !open;
      if (!open) return;
      const first = panel.querySelector("button, [href], input, select, textarea");
      if (first) first.focus();
    }

    function close(focusTrigger) {
      setOpen(false);
      if (focusTrigger) trigger.focus();
    }

    trigger.addEventListener("click", function () {
      setOpen(trigger.getAttribute("aria-expanded") !== "true");
    });

    const closeButton = panel.querySelector("[data-close]");
    if (closeButton) {
      closeButton.addEventListener("click", function () {
        close(true);
      });
    }

    // Escape and outside clicks are handled on the document: Safari does not focus a button when
    // it is tapped, so a listener on the popover alone would never hear the key.
    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape" || trigger.getAttribute("aria-expanded") !== "true") return;
      event.preventDefault();
      close(true);
    });

    document.addEventListener("pointerdown", function (event) {
      if (!closeOutside || root.contains(event.target)) return;
      close(false);
    });
  }

  document.querySelectorAll("[data-popover]").forEach(createPopover);
})();
