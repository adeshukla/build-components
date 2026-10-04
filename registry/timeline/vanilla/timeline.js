/**
 * Activity timeline — plain JavaScript, no dependencies.
 * Shows the newest few and reveals the rest on request, saying how many arrived.
 */
(function () {
  /** Words with something put in them: "{count} left" (D94). */
  function fill(words, values) {
    return words.replace(/\{(\w+)\}/g, function (match, name) {
      return name in values ? String(values[name]) : match;
    });
  }

  function createTimeline(root) {
    const more = root.querySelector("[data-more]");
    const status = root.querySelector("[data-status]");
    if (!more) return;

    more.addEventListener("click", function () {
      const hidden = Array.from(root.querySelectorAll("[data-entry][hidden]"));
      hidden.forEach(function (entry) {
        entry.hidden = false;
      });
      more.hidden = true;
      if (status) status.textContent = fill(root.dataset.allShown, { count: root.dataset.total });
      // The button has gone, so focus goes to the first entry that was just revealed.
      const first = hidden[0];
      if (first) {
        first.setAttribute("tabindex", "-1");
        first.focus();
      }
    });
  }

  document.querySelectorAll("[data-timeline]").forEach(createTimeline);
})();
