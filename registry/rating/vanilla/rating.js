/**
 * Rating — plain JavaScript, no dependencies.
 * The radios do the work (arrow keys, labels, form submission); this only keeps the text in step.
 * The root fires "rating-change" with event.detail.value.
 */
(function () {
  function createRating(root) {
    const output = root.querySelector("[data-output]");
    const max = Number(root.dataset.max) || 5;
    root.addEventListener("change", function (event) {
      if (!event.target.matches(".ra-input")) return;
      const value = Number(event.target.value);
      if (output) output.textContent = value + " out of " + max;
      root.dispatchEvent(new CustomEvent("rating-change", { detail: { value: value } }));
    });
  }

  document.querySelectorAll("[data-rating]").forEach(createRating);
})();
