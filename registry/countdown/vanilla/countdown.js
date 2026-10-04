/**
 * Countdown — plain JavaScript, no dependencies.
 * The digits tick every second but are hidden from the reading order; what is said out loud changes
 * only when the coarse reading does.
 */
(function () {
  /** Words with something put in them: "{count} left" (D94). */
  function fill(words, values) {
    return words.replace(/\{(\w+)\}/g, function (match, name) {
      return name in values ? String(values[name]) : match;
    });
  }

  function unit(value, one, many) {
    return fill(value === 1 ? one : many, { count: value });
  }

  /** Whole units left, worked out by hand: Intl would disagree between the server and the browser. */
  function split(target) {
    const end = new Date(target).getTime();
    const left = Math.max(0, Math.floor((end - Date.now()) / 1000));
    return {
      days: Math.floor(left / 86400),
      hours: Math.floor((left % 86400) / 3600),
      minutes: Math.floor((left % 3600) / 60),
      seconds: left % 60,
      done: isNaN(end) || left === 0,
    };
  }

  /** What a screen reader hears: the coarse reading, without the second hand ticking over it. */
  function spoken(parts, w) {
    if (parts.done) return "";
    const days = unit(parts.days, w.dayOne, w.dayMany);
    const hours = unit(parts.hours, w.hourOne, w.hourMany);
    const minutes = unit(parts.minutes, w.minuteOne, w.minuteMany);
    if (parts.days > 0) return fill(w.two, { first: days, second: hours });
    if (parts.hours > 0) return fill(w.two, { first: hours, second: minutes });
    if (parts.minutes > 0) return fill(w.one, { first: minutes });
    return fill(w.one, { first: unit(parts.seconds, w.secondOne, w.secondMany) });
  }

  function createCountdown(root) {
    const waiting = root.querySelector("[data-waiting]");
    const boxes = root.querySelector("[data-boxes]");
    const done = root.querySelector("[data-done]");
    const status = root.querySelector("[data-status]");
    const values = Array.from(root.querySelectorAll("[data-unit]"));
    // The words, from the options (D94).
    const words = JSON.parse(root.dataset.words);
    let lastSaid = "";

    function tick() {
      const parts = split(root.dataset.target);
      if (waiting) waiting.hidden = true;
      boxes.hidden = parts.done;
      if (done) done.hidden = !parts.done;
      values.forEach(function (value) {
        value.textContent = String(parts[value.dataset.unit]);
      });
      const phrase = parts.done ? root.dataset.finished : spoken(parts, words);
      if (phrase !== lastSaid) {
        lastSaid = phrase;
        if (status) status.textContent = phrase;
      }
    }

    tick();
    window.setInterval(tick, 1000);
  }

  document.querySelectorAll("[data-countdown]").forEach(createCountdown);
})();
