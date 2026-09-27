/**
 * Date range — plain JavaScript, no dependencies.
 * Two native date inputs do the picking. This keeps them in order, narrows each one's limits to the
 * other, and says the span in words.
 */
(function () {
  // @config-start
  const config = {
    spanUnit: "nights",
    orderErrorText: "Check-out cannot be before check-in.",
  };
  // @config-end

  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  /** Formatted by hand: a locale-formatted date differs between machines. */
  function sayDate(iso) {
    const parts = iso.split("-").map(Number);
    if (parts.length !== 3 || !parts[0]) return iso;
    return parts[2] + " " + MONTHS[parts[1] - 1] + " " + parts[0];
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
        const unit = config.spanUnit === "nights" ? "night" : "day";
        status.textContent = count + " " + (count === 1 ? unit : unit + "s") + ", " + sayDate(from.value) + " to " + sayDate(to.value);
      }
    }

    from.addEventListener("input", refresh);
    to.addEventListener("input", refresh);
    refresh();
  }

  document.querySelectorAll("[data-date-range]").forEach(createDateRange);
})();
