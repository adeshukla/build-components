/**
 * Unsaved changes guard — plain JavaScript, no dependencies.
 * Asks before leaving while there is something to lose: a dialog for in-page navigation, and the
 * browser's own warning for closing the tab.
 */
(function () {
  function createUnsavedChanges(root) {
    const field = root.querySelector("[data-field]");
    const dirtyLine = root.querySelector("[data-dirty]");
    const save = root.querySelector("[data-save]");
    const leave = root.querySelector("[data-leave]");
    const dialog = root.querySelector("[data-dialog]");
    const stay = root.querySelector("[data-stay]");
    const discard = root.querySelector("[data-discard]");
    const status = root.querySelector("[data-status]");
    let saved = field.value;

    function isDirty() {
      return field.value !== saved;
    }

    function ask(event) {
      event.preventDefault();
    }

    function refresh() {
      const dirty = isDirty();
      if (dirtyLine) dirtyLine.textContent = dirty ? "Unsaved changes" : "Nothing to save";
      // The browser's own warning, for closing the tab or reloading. It only gets to ask while there
      // is something to lose, and the browser writes the wording itself.
      window.removeEventListener("beforeunload", ask);
      if (dirty && root.dataset.warnOnReload === "true") window.addEventListener("beforeunload", ask);
    }

    field.addEventListener("input", refresh);

    save.addEventListener("click", function () {
      saved = field.value;
      refresh();
      if (status) status.textContent = "Saved";
    });

    leave.addEventListener("click", function () {
      if (!isDirty()) {
        if (status) status.textContent = "Left with nothing unsaved";
        return;
      }
      dialog.showModal();
      stay.focus();
    });

    function close() {
      dialog.close();
      leave.focus();
    }

    stay.addEventListener("click", close);
    discard.addEventListener("click", function () {
      field.value = saved;
      refresh();
      if (status) status.textContent = "Left, changes discarded";
      close();
    });
    // Escape is the cautious choice: stay on the page and keep the text.
    dialog.addEventListener("cancel", function (event) {
      event.preventDefault();
      close();
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

    refresh();
  }

  document.querySelectorAll("[data-unsaved-changes]").forEach(createUnsavedChanges);
})();
