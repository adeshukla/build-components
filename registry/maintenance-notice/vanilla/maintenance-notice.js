/**
 * Maintenance notice — plain JavaScript, no dependencies.
 * Storage throws in a sandboxed frame and in private browsing, so the memory of a dismissal falls back
 * to memory rather than taking the notice down with it.
 */
(function () {
  // @config-start
  const config = {
    remember: true,
    storageKey: "maintenance-2026-10-04",
    monthNames: "January,February,March,April,May,June,July,August,September,October,November,December",
    momentText: "{day} {month} at {time}",
    windowText: "{start} until {end}",
    dismissedText: "Notice dismissed.",
    dismissedForeverText: "Notice dismissed. It will not come back on this browser.",
  };
  // @config-end

  const remembered = {};

  function readDismissed(key) {
    try {
      return window.localStorage.getItem("bc-" + key) === "yes";
    } catch {
      return remembered[key] === true;
    }
  }

  function writeDismissed(key) {
    remembered[key] = true;
    try {
      window.localStorage.setItem("bc-" + key, "yes");
    } catch {
      // Memory is the fallback; nothing else to do.
    }
  }

  function createMaintenanceNotice(root) {
    const notice = root.querySelector("[data-notice]");
    const dismiss = root.querySelector("[data-dismiss]");
    const said = root.querySelector("[data-said]");

    if (config.remember && readDismissed(config.storageKey)) notice.hidden = true;

    if (dismiss) {
      dismiss.addEventListener("click", function () {
        if (config.remember) writeDismissed(config.storageKey);
        notice.hidden = true;
        if (said) {
          said.textContent = config.remember
            ? config.dismissedForeverText
            : config.dismissedText;
        }
      });
    }
  }

  document.querySelectorAll("[data-maintenance-notice]").forEach(createMaintenanceNotice);
})();
