/**
 * Dual range slider — plain JavaScript, no dependencies.
 * Two native range inputs, one per end. This keeps a gap between them, draws the span and says it.
 */
(function () {
  /** Words with something put in them: "{count} left" (D94). */
  function fill(words, values) {
    return words.replace(/\{(\w+)\}/g, function (match, name) {
      return name in values ? String(values[name]) : match;
    });
  }

  // @config-start
  const config = {
    minGap: 20,
    valuePrefix: "£",
    valueSuffix: "",
    rangeText: "{low} to {high}",
  };
  // @config-end

  /** Grouped by hand: a locale-formatted number differs between machines. */
  function group(value) {
    const parts = Math.abs(value).toString().split(".");
    const spaced = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return (value < 0 ? "-" : "") + spaced + (parts[1] ? "." + parts[1] : "");
  }

  function createDualSlider(root) {
    const low = root.querySelector("[data-low]");
    const high = root.querySelector("[data-high]");
    const lowOut = root.querySelector("[data-low-value]");
    const highOut = root.querySelector("[data-high-value]");
    const bar = root.querySelector("[data-fill]");
    const status = root.querySelector("[data-status]");

    function say(value) {
      return config.valuePrefix + group(value) + config.valueSuffix;
    }

    function refresh() {
      const min = Number(low.min);
      const max = Number(low.max);
      const span = max - min || 1;
      const left = ((Number(low.value) - min) / span) * 100;
      const right = ((Number(high.value) - min) / span) * 100;

      if (lowOut) lowOut.textContent = say(Number(low.value));
      if (highOut) highOut.textContent = say(Number(high.value));
      low.setAttribute("aria-valuetext", say(Number(low.value)));
      high.setAttribute("aria-valuetext", say(Number(high.value)));
      if (bar) {
        bar.style.marginInlineStart = left + "%";
        bar.style.width = Math.max(right - left, 1) + "%";
      }
      if (status) status.textContent = fill(config.rangeText, { low: say(Number(low.value)), high: say(Number(high.value)) });
    }

    // The two ends clamp each other rather than swapping, so the thumb being dragged keeps its meaning.
    low.addEventListener("input", function () {
      const ceiling = Number(high.value) - config.minGap;
      if (Number(low.value) > ceiling) low.value = String(ceiling);
      refresh();
    });
    high.addEventListener("input", function () {
      const floor = Number(low.value) + config.minGap;
      if (Number(high.value) < floor) high.value = String(floor);
      refresh();
    });

    refresh();
  }

  document.querySelectorAll("[data-dual-slider]").forEach(createDualSlider);
})();
