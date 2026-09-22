/**
 * Drawer — plain JavaScript, no dependencies.
 * A native modal dialog that slides in from one edge (WAI-ARIA APG "Dialog (Modal)" pattern).
 * Pressing the main button fires "drawer-apply" on the root: event.detail.choices is what was ticked.
 */
(function () {
  /** How far a swipe has to travel, in pixels, to close the drawer. */
  const SWIPE_CLOSE = 80;

  function createDrawer(root) {
    const trigger = root.querySelector("[data-trigger]");
    const dialog = root.querySelector("dialog");
    const title = dialog.querySelector(".dr-title");
    const status = root.querySelector("[data-status]");
    const choices = Array.from(dialog.querySelectorAll("[data-choice]"));
    const side = root.classList.contains("dr--left") ? "left" : root.classList.contains("dr--bottom") ? "bottom" : "right";
    let previousOverflow = "";
    let swipe = null;

    trigger.addEventListener("click", function () {
      if (dialog.open) return;
      dialog.style.translate = "";
      dialog.showModal();
      // Stop the page behind the drawer from scrolling.
      previousOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = "hidden";
      title.focus();
    });

    dialog.addEventListener("close", function () {
      document.documentElement.style.overflow = previousOverflow;
      trigger.focus();
    });

    dialog.querySelector("[data-close]").addEventListener("click", function () {
      dialog.close();
    });

    const clear = dialog.querySelector("[data-clear]");
    if (clear) {
      clear.addEventListener("click", function () {
        choices.forEach(function (choice) {
          choice.checked = false;
        });
      });
    }

    dialog.querySelector("[data-apply]").addEventListener("click", function () {
      const picked = choices.filter((choice) => choice.checked).map((choice) => choice.value);
      status.textContent = picked.length ? "Showing: " + picked.join(", ") + "." : "Showing everything.";
      root.dispatchEvent(new CustomEvent("drawer-apply", { detail: { choices: picked } }));
      dialog.close();
    });

    dialog.addEventListener("mousedown", function (event) {
      // A click on the backdrop must not pull keyboard focus out of the drawer.
      if (event.target === dialog) event.preventDefault();
    });
    dialog.addEventListener("click", function (event) {
      if (root.dataset.backdropClose !== "false" && event.target === dialog) dialog.close();
    });

    // Keep Tab inside the drawer (APG dialog pattern), including from the focused title.
    dialog.addEventListener("keydown", function (event) {
      if (event.key !== "Tab") return;
      const items = Array.from(dialog.querySelectorAll("button, a[href], input, select, textarea"));
      const index = items.indexOf(document.activeElement);
      if (event.shiftKey && index <= 0) {
        event.preventDefault();
        items[items.length - 1].focus();
      } else if (!event.shiftKey && index === items.length - 1) {
        event.preventDefault();
        items[0].focus();
      }
    });

    // Swiping toward the edge it came from closes it. Touch only, so a mouse can still select text.
    if (root.dataset.swipe !== "false") {
      dialog.addEventListener("pointerdown", function (event) {
        if (event.pointerType === "touch") swipe = { x: event.clientX, y: event.clientY, distance: 0 };
      });
      dialog.addEventListener("pointermove", function (event) {
        if (!swipe) return;
        const delta = side === "right" ? event.clientX - swipe.x : side === "left" ? swipe.x - event.clientX : event.clientY - swipe.y;
        swipe.distance = Math.max(0, delta);
        const offset = side === "left" ? -swipe.distance : swipe.distance;
        dialog.style.translate = side === "bottom" ? "0 " + offset + "px" : offset + "px 0";
      });
      const end = function () {
        if (!swipe) return;
        const distance = swipe.distance;
        swipe = null;
        dialog.style.translate = "";
        if (distance > SWIPE_CLOSE) dialog.close();
      };
      dialog.addEventListener("pointerup", end);
      dialog.addEventListener("pointercancel", end);
    }
  }

  document.querySelectorAll("[data-drawer]").forEach(createDrawer);
})();
