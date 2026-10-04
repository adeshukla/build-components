/**
 * Date range — plain JavaScript, no dependencies.
 * Two native date inputs do the picking. This keeps them in order, narrows each one's limits to the
 * other, and says the span in words.
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
    spanUnit: "nights",
    orderErrorText: "Check-out cannot be before check-in.",
    monthNames: "January,February,March,April,May,June,July,August,September,October,November,December",
    dateText: "{day} {month} {year}",
    nightOne: "{count} night",
    nightMany: "{count} nights",
    dayOne: "{count} day",
    dayMany: "{count} days",
    spanText: "{span}, {from} to {to}",
  };
  // @config-end

  /** Formatted by hand from the Words options (D94): a locale-formatted date differs between machines. */
  function sayDate(iso) {
    const parts = iso.split("-").map(Number);
    if (parts.length !== 3 || !parts[0]) return iso;
    const month = (config.monthNames.split(",")[parts[1] - 1] || String(parts[1])).trim();
    return fill(config.dateText, { day: parts[2], month: month, year: parts[0] });
  }


  function daysBetween(from, to) {
    const f = from.split("-").map(Number);
    const t = to.split("-").map(Number);
    return Math.round((Date.UTC(t[0], t[1] - 1, t[2]) - Date.UTC(f[0], f[1] - 1, f[2])) / 86400000);
  }

  function createDateRange(root) {
    const from = root.querySelector("[data-from]");
    const to = root.querySelector("[data-to]");
    const error = root.querySelector("[data-error]");
    const status = root.querySelector("[data-status]");
    const limitMin = root.dataset.rangeMin || "";
    const limitMax = root.dataset.rangeMax || "";

    function refresh() {
      // The earliest end is the start, so the browser's own picker greys out the impossible days.
      if (from.value) to.min = from.value;
      else if (limitMin) to.min = limitMin;
      else to.removeAttribute("min");
      if (to.value) from.max = to.value;
      else if (limitMax) from.max = limitMax;
      else from.removeAttribute("max");

      const bothSet = from.value !== "" && to.value !== "";
      const outOfOrder = bothSet && daysBetween(from.value, to.value) < 0;
      if (error) {
        error.hidden = !outOfOrder;
        error.textContent = config.orderErrorText;
      }
      if (outOfOrder) {
        to.setAttribute("aria-invalid", "true");
        to.setAttribute("aria-describedby", "dr-error");
      } else {
        to.removeAttribute("aria-invalid");
        to.removeAttribute("aria-describedby");
      }

      if (status) {
        if (!bothSet || outOfOrder) {
          status.textContent = "";
          return;
        }
        const days = daysBetween(from.value, to.value);
        const count = config.spanUnit === "nights" ? days : days + 1;
        const span = config.spanUnit === "nights" ? (count === 1 ? config.nightOne : config.nightMany) : count === 1 ? config.dayOne : config.dayMany;
        status.textContent = fill(config.spanText, { span: fill(span, { count: count }), from: sayDate(from.value), to: sayDate(to.value) });
      }
    }

    from.addEventListener("input", refresh);
    to.addEventListener("input", refresh);
    refresh();
  }

  document.querySelectorAll("[data-date-range]").forEach(createDateRange);
})();
