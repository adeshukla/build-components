/**
 * Navigation progress — plain JavaScript, no dependencies.
 * Point start() and finish() at your own router's events. The delay before anything is drawn and the
 * words in the live region are the part worth keeping.
 */
(function () {
  // @config-start
  const config = {
    pageName: "Parts catalogue",
    delayMs: 200,
    demoMs: 1400,
    loadingText: "Loading",
    doneText: "Loaded",
    showBar: true,
  };
  // @config-end

  function createNavProgress(root) {
    const trigger = root.querySelector("[data-trigger]");
    const track = root.querySelector("[data-track]");
    const state = root.querySelector("[data-state]");
    let timers = [];

    function clear() {
      timers.forEach(clearTimeout);
      timers = [];
    }

    function show(on) {
      if (!track) return;
      track.hidden = !on;
      if (!on) return;
      // Re-adding the bar restarts its animation, which a hidden element's does not do on its own.
      track.textContent = "";
      const bar = document.createElement("div");
      bar.className = "np-bar";
      track.appendChild(bar);
    }

    function start() {
      clear();
      // Waiting, not loading: a bar that flashes for 80ms is worse than no bar, so nothing is drawn
      // until the load has already outlasted the delay.
      state.dataset.phase = "waiting";
      state.textContent = config.loadingText + "…";
      timers.push(
        setTimeout(function () {
          state.dataset.phase = "loading";
          if (config.showBar) show(true);
        }, config.delayMs),
      );
      timers.push(setTimeout(finish, Math.max(config.demoMs, config.delayMs)));
    }

    function finish() {
      clear();
      show(false);
      state.dataset.phase = "done";
      state.textContent = config.doneText + ": " + config.pageName;
    }

    trigger.addEventListener("click", start);
    show(false);
  }

  document.querySelectorAll("[data-nav-progress]").forEach(createNavProgress);
})();
