/**
 * Undo snackbar — plain JavaScript, no dependencies.
 * The count runs only while nobody is using the snackbar, which is what makes the time limit
 * adjustable — WCAG 2.2.1 asks that of anything that disappears on its own. Nought seconds never does.
 */
(function () {
  // @config-start
  const config = {
    message: "Message archived.",
    undoneText: "Message put back.",
    keptText: "Message stayed archived.",
    seconds: 8,
    showCountdown: true,
  };
  // @config-end

  function createUndoSnackbar(root) {
    const trigger = root.querySelector("[data-trigger]");
    const bar = root.querySelector("[data-snackbar]");
    const said = root.querySelector("[data-said]");
    const undo = root.querySelector("[data-undo]");
    const close = root.querySelector("[data-close]");
    const countdown = root.querySelector("[data-countdown]");
    let left = config.seconds;
    let held = false;
    let timer;

    function paint() {
      if (!countdown) return;
      countdown.textContent = held ? "held" : left + "s";
    }

    function stop(message) {
      clearInterval(timer);
      bar.hidden = true;
      if (said) said.textContent = message;
    }

    function run() {
      clearInterval(timer);
      if (config.seconds <= 0) return;
      timer = setInterval(function () {
        if (held) return;
        left -= 1;
        paint();
        if (left <= 0) stop(config.keptText);
      }, 1000);
    }

    trigger.addEventListener("click", function () {
      left = config.seconds;
      held = false;
      bar.hidden = false;
      // The words go in a region of their own, not in the snackbar.
      if (said) said.textContent = config.message;
      paint();
      run();
    });

    // Using it holds the clock. Focus is never moved here: taking it would interrupt whatever the
    // person was doing, and the action has already happened.
    bar.addEventListener("mouseenter", function () {
      held = true;
      paint();
    });
    bar.addEventListener("mouseleave", function () {
      held = false;
      paint();
    });
    bar.addEventListener("focusin", function () {
      held = true;
      paint();
    });
    bar.addEventListener("focusout", function (event) {
      if (bar.contains(event.relatedTarget)) return;
      held = false;
      paint();
    });

    if (undo) {
      undo.addEventListener("click", function () {
        stop(config.undoneText);
      });
    }
    if (close) {
      close.addEventListener("click", function () {
        stop(config.keptText);
      });
    }

    bar.hidden = true;
    paint();
  }

  document.querySelectorAll("[data-undo-snackbar]").forEach(createUndoSnackbar);
})();
