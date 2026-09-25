/**
 * Keyboard shortcut help — plain JavaScript, no dependencies.
 * One key opens it from anywhere on the page, except while someone is typing, and focus goes back
 * where it came from on close.
 */
(function () {
  /** A single key pressed while typing belongs to the field, not to the page. */
  function isTyping(target) {
    if (!target || !target.tagName) return false;
    const tag = target.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
  }

  function createShortcutHelp(root) {
    const dialog = root.querySelector("[data-dialog]");
    const trigger = root.querySelector("[data-trigger]");
    const closeButton = root.querySelector("[data-close]");
    const openKey = root.dataset.openKey;
    let returnTo = null;

    function open() {
      if (dialog.open) return;
      returnTo = document.activeElement;
      dialog.showModal();
      closeButton.focus();
    }

    function close() {
      dialog.close();
      if (returnTo && returnTo.focus) returnTo.focus();
    }

    // The one shortcut that has to work from anywhere on the page — except from inside a field.
    document.addEventListener("keydown", function (event) {
      if (event.key !== openKey || event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTyping(event.target)) return;
      event.preventDefault();
      open();
    });

    if (trigger) trigger.addEventListener("click", open);
    closeButton.addEventListener("click", close);
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
  }

  document.querySelectorAll("[data-shortcut-help]").forEach(createShortcutHelp);
})();
