/**
 * Session timeout warning — plain JavaScript, no dependencies.
 * Warns after a stretch of nothing happening, counts down out loud at the marks worth hearing, and
 * treats Escape as staying rather than as signing out.
 */
(function () {
  /** The marks worth saying out loud; every second would talk over the person. */
  const SPOKEN = [30, 20, 10, 5];

  function clock(seconds) {
    const whole = Math.max(0, Math.round(seconds));
    return Math.floor(whole / 60) + ":" + String(whole % 60).padStart(2, "0");
  }

  function createSessionTimeout(root) {
    const dialog = root.querySelector("[data-dialog]");
    const trigger = root.querySelector("[data-trigger]");
    const stay = root.querySelector("[data-stay]");
    const out = root.querySelector("[data-out]");
    const face = root.querySelector("[data-clock]");
    const status = root.querySelector("[data-status]");
    const idle = Math.max(5, Number(root.dataset.idle));
    const countdown = Math.max(5, Number(root.dataset.countdown));
    let idleTimer = null;
    let tick = null;
    let left = countdown;
    let returnTo = null;

    function startIdle() {
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(function () {
        warn();
      }, idle * 1000);
    }

    // Safari does not focus a button when it is clicked, so the opener is passed in rather than read
    // from document.activeElement, which would be the body there.
    function warn(from) {
      if (dialog.open) return;
      window.clearTimeout(idleTimer);
      left = countdown;
      if (face) face.textContent = clock(left);
      if (status) status.textContent = "";
      returnTo = from || document.activeElement;
      dialog.showModal();
      stay.focus();
      tick = window.setInterval(function () {
        left -= 1;
        if (face) face.textContent = clock(left);
        if (SPOKEN.indexOf(left) !== -1 && status) status.textContent = left + " seconds left";
        if (left <= 0) finish("Signed out");
      }, 1000);
    }

    function finish(outcome) {
      window.clearInterval(tick);
      dialog.close();
      if (status) status.textContent = outcome;
      if (returnTo && returnTo.focus) returnTo.focus();
      startIdle();
    }

    if (trigger) {
      trigger.addEventListener("click", function () {
        warn(trigger);
      });
    }
    stay.addEventListener("click", function () {
      finish("Still signed in");
    });
    out.addEventListener("click", function () {
      finish("Signed out");
    });
    // Escape must not sign anyone out by accident: treat it as staying.
    dialog.addEventListener("cancel", function (event) {
      event.preventDefault();
      finish("Still signed in");
    });

    // Keep Tab inside the dialog (APG dialog pattern).
    dialog.addEventListener("keydown", function (event) {
      if (event.key !== "Tab") return;
      const items = Array.from(dialog.querySelectorAll("button"));
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    });

    // Any real activity puts the clock back to the beginning.
    if (root.dataset.watch === "true") {
      ["pointerdown", "keydown", "scroll"].forEach(function (name) {
        document.addEventListener(
          name,
          function () {
            if (!dialog.open) startIdle();
          },
          { passive: true },
        );
      });
    }

    startIdle();
  }

  document.querySelectorAll("[data-session-timeout]").forEach(createSessionTimeout);
})();
