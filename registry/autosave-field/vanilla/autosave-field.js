/**
 * Autosaving field — plain JavaScript, no dependencies.
 * Replace saveDraft with your own request. Everything else — the pause, the polite status, the way
 * back from a failure — stays the same.
 */
(function () {
  // @config-start
  const config = {
    pauseMs: 900,
    unsavedText: "Not saved yet",
    savingText: "Saving…",
    savedText: "Saved",
    errorText: "Could not save.",
    demoOutcome: "saves",
  };
  // @config-end

  /** A stand-in for your request: it waits, then keeps or breaks its promise. */
  function saveDraft() {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        if (config.demoOutcome === "fails") reject(new Error("demo"));
        else resolve();
      }, 300);
    });
  }

  /** Two digits, written out rather than formatted by locale. */
  function clockTime(date) {
    function pad(value) {
      return String(value).padStart(2, "0");
    }
    return pad(date.getHours()) + ":" + pad(date.getMinutes());
  }

  function createAutosaveField(root) {
    const field = root.querySelector("[data-field]");
    const status = root.querySelector("[data-status]");
    const retry = root.querySelector("[data-retry]");
    let timer;

    function set(state, text) {
      status.dataset.state = state;
      status.textContent = text;
      if (retry) retry.hidden = state !== "error";
    }

    function save() {
      set("saving", config.savingText);
      saveDraft(field.value).then(
        function () {
          set("saved", config.savedText + " at " + clockTime(new Date()));
        },
        function () {
          set("error", config.errorText);
        },
      );
    }

    field.addEventListener("input", function () {
      set("unsaved", config.unsavedText);
      clearTimeout(timer);
      // Saving on every keystroke sends a request per letter; the pause is what makes it one.
      timer = setTimeout(save, config.pauseMs);
    });

    // The work is still in the field, so the way out of a failure is one button, not a lost draft.
    if (retry) retry.addEventListener("click", save);
  }

  document.querySelectorAll("[data-autosave-field]").forEach(createAutosaveField);
})();
