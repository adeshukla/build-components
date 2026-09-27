/**
 * Inline confirm — plain JavaScript, no dependencies.
 * The question replaces the button in the same row, rather than opening a dialog over the page. Focus
 * goes into the question and comes back out of it; Escape is the way out.
 */
(function () {
  // @config-start
  const config = {
    doneText: "Quarterly report.pdf deleted.",
    cancelledText: "Nothing was deleted.",
    focusOn: "cancel",
  };
  // @config-end

  function createInlineConfirm(root) {
    const row = root.querySelector("[data-row]");
    const name = root.querySelector("[data-name]");
    const start = root.querySelector("[data-start]");
    const ask = root.querySelector("[data-ask]");
    const confirm = root.querySelector("[data-confirm]");
    const cancel = root.querySelector("[data-cancel]");
    const done = root.querySelector("[data-done]");
    const result = root.querySelector("[data-result]");

    function show(state) {
      start.hidden = state !== "idle";
      ask.hidden = state !== "asking";
      if (done) done.hidden = state !== "gone";
    }

    function close(message, gone) {
      show(gone ? "gone" : "idle");
      if (result) result.textContent = message;
      if (gone) {
        if (name) name.dataset.gone = "true";
        // The button that was pressed has gone, so focus lands on the row it was in rather than on
        // the page body.
        row.focus();
      } else {
        start.focus();
      }
    }

    start.addEventListener("click", function () {
      if (result) result.textContent = "";
      show("asking");
      const target = config.focusOn === "confirm" ? confirm : cancel;
      if (target) target.focus();
    });

    if (confirm) {
      confirm.addEventListener("click", function () {
        close(config.doneText, true);
      });
    }
    if (cancel) {
      cancel.addEventListener("click", function () {
        close(config.cancelledText, false);
      });
    }

    // Escape is the way out of a question nobody meant to ask. Heard on the document, because Safari
    // does not focus a button when it is clicked.
    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape" || ask.hidden) return;
      close(config.cancelledText, false);
    });

    show("idle");
  }

  document.querySelectorAll("[data-inline-confirm]").forEach(createInlineConfirm);
})();
