/**
 * Activity timeline — plain JavaScript, no dependencies.
 * Shows the newest few and reveals the rest on request, saying how many arrived.
 */
(function () {
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
      if (status) status.textContent = "Showing all " + root.dataset.total + " entries";
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
