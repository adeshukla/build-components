/**
 * Time range — plain JavaScript, no dependencies.
 * Two native time inputs do the picking. This says how long the span is and refuses a backwards one
 * unless an overnight span is allowed.
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
    allowOvernight: false,
    orderErrorText: "Closing time must be after opening time.",
    hourOneText: "{count} hour",
    hoursText: "{count} hours",
    minuteOneText: "{count} minute",
    minutesText: "{count} minutes",
    noTimeText: "no time at all",
    nextDayText: "{length}, finishing the next day",
  };
  // @config-end

  function toMinutes(value) {
    const parts = value.split(":").map(Number);
    return parts[0] * 60 + parts[1];
  }

  /** Spelled out: 3:30 in a status line reads as half past three. */
  function sayLength(minutes, words) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    const parts = [];
    if (hours > 0) parts.push(fill(hours === 1 ? words.hourOne : words.hours, { count: hours }));
    if (rest > 0) parts.push(fill(rest === 1 ? words.minuteOne : words.minutes, { count: rest }));
    return parts.length === 0 ? words.noTime : parts.join(" ");
  }

  function createTimeRange(root) {
    const from = root.querySelector("[data-from]");
    const to = root.querySelector("[data-to]");
    const error = root.querySelector("[data-error]");
    const status = root.querySelector("[data-status]");
    const words = JSON.parse(root.dataset.words);

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
        status.textContent = gap <= 0 ? fill(words.nextDay, { length: sayLength(length, words) }) : sayLength(length, words);
      }
    }

    from.addEventListener("input", refresh);
    to.addEventListener("input", refresh);
    refresh();
  }

  document.querySelectorAll("[data-time-range]").forEach(createTimeRange);
})();
