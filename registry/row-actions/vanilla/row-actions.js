/**
 * Row actions — plain JavaScript, no dependencies.
 * Each button already carries the record in its accessible name; this only says what was done.
 */
(function () {
  // @config-start
  const config = {
    doneTemplate: "{action} — {record}",
  };
  // @config-end

  function createRowActions(root) {
    const status = root.querySelector("[data-status]");

    root.querySelectorAll("[data-action]").forEach(function (button) {
      button.addEventListener("click", function () {
        if (!status) return;
        status.textContent = config.doneTemplate
          .replace("{action}", button.dataset.action)
          .replace("{record}", button.dataset.record);
      });
    });
  }

  document.querySelectorAll("[data-row-actions]").forEach(createRowActions);
})();
