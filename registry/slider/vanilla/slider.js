/**
 * Range slider — plain JavaScript, no dependencies.
 * Real range inputs ship in the HTML, so the slider works before this runs. This keeps the two
 * ends from crossing, paints the filled part of the track and keeps the value text in step.
 */
(function () {
  function createSlider(root) {
    const single = root.querySelector("[data-single]");
    const lower = root.querySelector("[data-lower]");
    const upper = root.querySelector("[data-upper]");
    const output = root.querySelector("[data-output]");
    const min = Number(root.dataset.min) || 0;
    const max = Number(root.dataset.max) || 100;
    const prefix = root.dataset.prefix || "";
    const suffix = root.dataset.suffix || "";

    function show(amount) {
      return prefix + amount + suffix;
    }

    function percent(amount) {
      return ((amount - min) / (max - min)) * 100 + "%";
    }

    function paint() {
      if (single) {
        const value = Number(single.value);
        single.setAttribute("aria-valuetext", show(value));
        root.style.setProperty("--sl-from", "0%");
        root.style.setProperty("--sl-to", percent(value));
        if (output) output.textContent = show(value);
        return;
      }
      const low = Number(lower.value);
      const high = Number(upper.value);
      lower.setAttribute("aria-valuetext", show(low));
      upper.setAttribute("aria-valuetext", show(high));
      root.style.setProperty("--sl-from", percent(low));
      root.style.setProperty("--sl-to", percent(high));
      if (output) output.textContent = show(low) + " – " + show(high);
    }

    if (single) single.addEventListener("input", paint);

    if (lower && upper) {
      // The two ends cannot cross: each one stops where the other one is.
      lower.addEventListener("input", function () {
        if (Number(lower.value) > Number(upper.value)) lower.value = upper.value;
        paint();
      });
      upper.addEventListener("input", function () {
        if (Number(upper.value) < Number(lower.value)) upper.value = lower.value;
        paint();
      });
    }

    paint();
  }

  document.querySelectorAll("[data-slider]").forEach(createSlider);
})();
