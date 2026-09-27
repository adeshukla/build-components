/**
 * Time range — plain JavaScript, no dependencies.
 * Two native time inputs do the picking. This says how long the span is and refuses a backwards one
 * unless an overnight span is allowed.
 */
(function () {
  // @config-start
  const config = {
    allowOvernight: false,
    orderErrorText: "Closing time must be after opening time.",
  };
  // @config-end

  function toMinutes(value) {
    const parts = value.split(":").map(Number);
    return parts[0] * 60 + parts[1];
  }

  /** Spelled out: 3:30 in a status line reads as half past three. */
  function sayLength(minutes) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    const parts = [];
    if (hours > 0) parts.push(hours + " " + (hours === 1 ? "hour" : "hours"));
    if (rest > 0) parts.push(rest + " " + (rest === 1 ? "minute" : "minutes"));
    return parts.length === 0 ? "no time at all" : parts.join(" ");
  }

  function createTimeRange(root) {
    const from = root.querySelector("[data-from]");
    const to = root.querySelector("[data-to]");
    const error = root.querySelector("[data-error]");
    const status = root.querySelector("[data-status]");

    function refresh() {
      const both = from.value !== "" && to.value !== "";
      const gap = both ? toMinutes(to.value) - toMinutes(from.value) : 0;
      const outOfOrder = both && gap <= 0 && !config.allowOvernight;

      if (error) {
        error.textContent = config.orderErrorText;
        error.hidden = !outOfOrder;
      }
      if (outOfOrder) {
        to.setAttribute("aria-invalid", "true");
        to.setAttribute("aria-describedby", "tmr-error");
      } else {
        to.removeAttribute("aria-invalid");
        to.removeAttribute("aria-describedby");
      }

      if (status) {
        if (!both || outOfOrder) {
          status.textContent = "";
          return;
        }
        const length = gap <= 0 ? gap + 24 * 60 : gap;
        status.textContent = sayLength(length) + (gap <= 0 ? ", finishing the next day" : "");
      }
    }

    from.addEventListener("input", refresh);
    to.addEventListener("input", refresh);
    refresh();
  }

  document.querySelectorAll("[data-time-range]").forEach(createTimeRange);
})();
