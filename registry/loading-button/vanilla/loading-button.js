/**
 * Loading button — plain JavaScript, no dependencies.
 * Replace run() with your own request. The states, the guard against a second press and the words in
 * the live region are the part worth keeping.
 */
(function () {
  // @config-start
  const config = {
    idleLabel: "Save changes",
    busyLabel: "Saving…",
    doneText: "Changes saved.",
    errorText: "Could not save. Nothing was changed.",
    retryLabel: "Try saving again",
    demoMs: 1200,
    demoOutcome: "saves",
  };
  // @config-end

  /** A stand-in for your request: it waits, then keeps or breaks its promise. */
  function work() {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        if (config.demoOutcome === "fails") reject(new Error("demo"));
        else resolve();
      }, config.demoMs);
    });
  }

  function createLoadingButton(root) {
    const button = root.querySelector("[data-button]");
    const label = root.querySelector("[data-label]");
    const spinner = root.querySelector("[data-spinner]");
    const outcome = root.querySelector("[data-outcome]");

    function set(phase) {
      button.dataset.phase = phase;
      const busy = phase === "busy";
      // aria-busy says it is working; aria-disabled says the press will do nothing. Neither takes the
      // button out of the tab order, which the disabled attribute would — along with the focus on it.
      if (busy) {
        button.setAttribute("aria-busy", "true");
        button.setAttribute("aria-disabled", "true");
      } else {
        button.removeAttribute("aria-busy");
        button.removeAttribute("aria-disabled");
      }
      if (spinner) spinner.hidden = !busy;
      label.textContent = busy ? config.busyLabel : phase === "error" ? config.retryLabel : config.idleLabel;
      if (outcome) {
        outcome.dataset.outcome = phase;
        outcome.textContent = phase === "done" ? config.doneText : phase === "error" ? config.errorText : "";
      }
    }

    button.addEventListener("click", function () {
      // A second press while it is working must not send a second request.
      if (button.dataset.phase === "busy") return;
      set("busy");
      work().then(
        function () {
          set("done");
        },
        function () {
          set("error");
        },
      );
    });

    set("idle");
  }

  document.querySelectorAll("[data-loading-button]").forEach(createLoadingButton);
})();
