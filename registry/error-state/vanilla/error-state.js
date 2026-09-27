/**
 * Error state — plain JavaScript, no dependencies.
 * Point attempt() at your own request. Focus moving to the panel, and the panel saying what to do next,
 * are the parts worth keeping.
 */
(function () {
  // @config-start
  const config = {
    okText: "Report loaded.",
    retrySucceeds: true,
  };
  // @config-end

  function createErrorState(root) {
    const trigger = root.querySelector("[data-trigger]");
    const panel = root.querySelector("[data-panel]");
    const retry = root.querySelector("[data-retry]");
    const status = root.querySelector("[data-status]");
    let tried = 0;

    function attempt() {
      tried += 1;
      const ok = config.retrySucceeds && tried > 1;
      panel.hidden = ok;
      trigger.hidden = !ok;
      if (status) status.textContent = ok ? config.okText : "";
      // Focus goes to the panel, not to the retry button: the reason has to be read before it is retried.
      if (!ok) panel.focus();
    }

    trigger.addEventListener("click", attempt);
    if (retry) retry.addEventListener("click", attempt);

    panel.hidden = true;
  }

  document.querySelectorAll("[data-error-state]").forEach(createErrorState);
})();
