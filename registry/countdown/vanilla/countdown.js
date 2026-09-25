/**
 * Countdown — plain JavaScript, no dependencies.
 * The digits tick every second but are hidden from the reading order; what is said out loud changes
 * only when the coarse reading does.
 */
(function () {
  function unit(value, name) {
    return value + " " + name + (value === 1 ? "" : "s");
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
  function spoken(parts) {
    if (parts.done) return "";
    if (parts.days > 0) return unit(parts.days, "day") + " and " + unit(parts.hours, "hour") + " left";
    if (parts.hours > 0) return unit(parts.hours, "hour") + " and " + unit(parts.minutes, "minute") + " left";
    if (parts.minutes > 0) return unit(parts.minutes, "minute") + " left";
    return unit(parts.seconds, "second") + " left";
  }

  function createCountdown(root) {
    const waiting = root.querySelector("[data-waiting]");
    const boxes = root.querySelector("[data-boxes]");
    const done = root.querySelector("[data-done]");
    const status = root.querySelector("[data-status]");
    const values = Array.from(root.querySelectorAll("[data-unit]"));
    let lastSaid = "";

    function tick() {
      const parts = split(root.dataset.target);
      if (waiting) waiting.hidden = true;
      boxes.hidden = parts.done;
      if (done) done.hidden = !parts.done;
      values.forEach(function (value) {
        value.textContent = String(parts[value.dataset.unit]);
      });
      const phrase = parts.done ? root.dataset.finished : spoken(parts);
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
