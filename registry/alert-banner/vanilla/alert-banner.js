/**
 * Alert banner — plain JavaScript, no dependencies.
 * Only the dismiss button needs script. Focus is moved somewhere sensible before the message goes,
 * so it is never left on an element that has just been removed.
 */
(function () {
  function createAlertBanner(root) {
    const dismiss = root.querySelector("[data-dismiss]");
    if (!dismiss) return;
    dismiss.addEventListener("click", function () {
      const after = document.querySelector("[data-after-dismiss]");
      root.remove();
      if (after) after.focus();
      document.dispatchEvent(new CustomEvent("alert-dismissed"));
    });
  }

  document.querySelectorAll("[data-alert-banner]").forEach(createAlertBanner);
})();
