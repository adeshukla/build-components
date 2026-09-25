/**
 * Typed confirmation dialog — plain JavaScript, no dependencies.
 * The action stays disabled until the phrase is typed exactly, the dialog keeps Tab inside itself,
 * and focus goes back to the button that opened it.
 */
(function () {
  function createConfirmDialog(root) {
    const dialog = root.querySelector("[data-dialog]");
    const trigger = root.querySelector("[data-trigger]");
    const cancel = root.querySelector("[data-cancel]");
    const confirm = root.querySelector("[data-confirm]");
    const field = root.querySelector("[data-field]");
    const hint = root.querySelector("[data-hint]");
    const status = root.querySelector("[data-status]");
    const phrase = root.dataset.phrase;

    function check() {
      if (!field) return;
      // The phrase is compared as typed, apart from spaces either side: a near miss is not a match.
      const matches = field.value.trim() === phrase;
      confirm.disabled = !matches;
      if (hint) {
        hint.textContent = matches
          ? "That matches. The button below is now live."
          : confirm.textContent + " stays off until the words match exactly.";
      }
    }

    function close(outcome) {
      if (status) status.textContent = outcome;
      dialog.close();
      trigger.focus();
    }

    trigger.addEventListener("click", function () {
      if (field) field.value = "";
      if (status) status.textContent = "";
      check();
      dialog.showModal();
      (field || cancel).focus();
    });

    if (field) field.addEventListener("input", check);
    cancel.addEventListener("click", function () {
      close("Cancelled");
    });
    confirm.addEventListener("click", function () {
      close("Confirmed");
    });
    // Escape fires cancel on a modal dialog; say so rather than closing silently.
    dialog.addEventListener("cancel", function (event) {
      event.preventDefault();
      close("Cancelled");
    });

    // Keep Tab inside the dialog (APG dialog pattern).
    dialog.addEventListener("keydown", function (event) {
      if (event.key !== "Tab") return;
      const items = Array.from(dialog.querySelectorAll("button:not([disabled]), input"));
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

    check();
  }

  document.querySelectorAll("[data-confirm-dialog]").forEach(createConfirmDialog);
})();
