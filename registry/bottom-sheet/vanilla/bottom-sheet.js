/**
 * Bottom sheet — plain JavaScript, no dependencies.
 * A native modal dialog pinned to the bottom, with three heights. The handle is a button, so the
 * heights are reachable from a keyboard; dragging is the extra, not the only way.
 */
(function () {
  // @config-start
  const config = {
    title: "Delivery slot",
    confirmLabel: "Use this slot",
    detents: "peek-half-full",
    startAt: "half",
    expandLabel: "Make the sheet taller",
    collapseLabel: "Make the sheet shorter",
  };
  // @config-end

  const said = {
    peek: "a third of the screen",
    half: "half the screen",
    full: "nearly the whole screen",
  };

  /** The heights this sheet offers, smallest first. */
  function detentsFor(setting) {
    if (setting === "full") return ["full"];
    if (setting === "half-full") return ["half", "full"];
    return ["peek", "half", "full"];
  }

  function createBottomSheet(root) {
    const trigger = root.querySelector("[data-trigger]");
    const sheet = root.querySelector("[data-sheet]");
    const handle = root.querySelector("[data-handle]");
    const height = root.querySelector("[data-height]");
    const result = root.querySelector("[data-result]");
    const confirm = root.querySelector("[data-confirm]");
    const cancel = root.querySelector("[data-cancel]");
    const steps = detentsFor(config.detents);
    let at = Math.max(steps.indexOf(config.startAt), 0);
    let opener = null;
    let dragFrom = null;

    function paint() {
      const detent = steps[Math.min(at, steps.length - 1)];
      sheet.dataset.detent = detent;
      handle.setAttribute("aria-label", at < steps.length - 1 ? config.expandLabel : config.collapseLabel);
      // Which height it is at, in words: a bar that has moved is not a message.
      if (height) {
        height.textContent = "Sheet height: " + said[detent] + "." + (at > 0 ? "" : " Already at its shortest.");
      }
    }

    function move(to) {
      at = Math.max(Math.min(to, steps.length - 1), 0);
      paint();
    }

    function open(from) {
      // Safari does not focus a button when it is clicked, so the opener is passed in.
      opener = from;
      at = Math.max(steps.indexOf(config.startAt), 0);
      if (result) result.textContent = "";
      paint();
      sheet.showModal();
    }

    function close(why) {
      // Focus cannot leave a modal dialog that is still open, so it closes first.
      sheet.close();
      if (result) result.textContent = why;
      if (opener) opener.focus();
    }

    trigger.addEventListener("click", function () {
      open(trigger);
    });

    handle.addEventListener("click", function () {
      move(at < steps.length - 1 ? at + 1 : 0);
    });
    handle.addEventListener("keydown", function (event) {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        move(at + 1);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        move(at - 1);
      } else if (event.key === "Home") {
        event.preventDefault();
        move(0);
      } else if (event.key === "End") {
        event.preventDefault();
        move(steps.length - 1);
      }
    });

    // Swipe the handle to change the height on a touch screen. Never the only way.
    handle.addEventListener("pointerdown", function (event) {
      dragFrom = event.clientY;
    });
    window.addEventListener("pointerup", function (event) {
      if (dragFrom === null) return;
      const moved = event.clientY - dragFrom;
      dragFrom = null;
      if (moved > 60) move(at - 1);
      else if (moved < -60) move(at + 1);
    });

    if (confirm) {
      confirm.addEventListener("click", function () {
        close(config.confirmLabel + " chosen.");
      });
    }
    if (cancel) {
      cancel.addEventListener("click", function () {
        close(config.title + " closed.");
      });
    }
    sheet.addEventListener("cancel", function (event) {
      event.preventDefault();
      close(config.title + " closed.");
    });

    paint();
  }

  document.querySelectorAll("[data-bottom-sheet]").forEach(createBottomSheet);
})();
