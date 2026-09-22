/**
 * Time picker — plain JavaScript, no dependencies.
 * An editable combobox (WAI-ARIA APG): type a time in any common form, or pick one from the list.
 * The hidden input submits the time as HH:MM, 24-hour.
 */
(function () {
  /** Minutes after midnight from what someone typed: "14:30", "1430", "9", "2:30 pm", "2pm". */
  function parseTime(raw) {
    const match = String(raw).trim().toLowerCase().replace(/[\s.]/g, "").match(/^(\d{1,2})(?::?(\d{2}))?(am|pm|a|p)?$/);
    if (!match) return null;
    let hours = Number(match[1]);
    const minutes = Number(match[2] || 0);
    const half = match[3] ? match[3][0] : "";
    if (minutes > 59) return null;
    if (half) {
      if (hours < 1 || hours > 12) return null;
      hours = (hours % 12) + (half === "p" ? 12 : 0);
    } else if (hours > 23) {
      return null;
    }
    return hours * 60 + minutes;
  }

  /** Written by hand, never by locale. */
  function formatTime(total, format) {
    const hours = Math.floor(total / 60);
    const minutes = String(total % 60).padStart(2, "0");
    if (format === "24h") return String(hours).padStart(2, "0") + ":" + minutes;
    return (hours % 12 || 12) + ":" + minutes + " " + (hours < 12 ? "am" : "pm");
  }

  function squash(value) {
    return value.toLowerCase().replace(/[^0-9a-z]/g, "");
  }

  function createTimePicker(root) {
    const input = root.querySelector("[data-input]");
    const toggle = root.querySelector("[data-toggle]");
    const list = root.querySelector("[data-list]");
    const errorText = root.querySelector("[data-error]");
    const status = root.querySelector("[data-status]");
    const hidden = root.querySelector("[data-value]");
    const format = root.dataset.format === "12h" ? "12h" : "24h";
    const earliest = Number(root.dataset.earliest) || 0;
    const latest = Number(root.dataset.latest) || 23 * 60 + 59;
    const step = Number(root.dataset.interval) || 30;
    const example = format === "24h" ? "14:30" : "2:30 pm";
    const slots = [];
    for (let time = earliest; time <= latest; time += step) slots.push(time);

    let value = parseTime(input.value);
    let matches = slots;
    let active = -1;
    let open = false;

    function typed() {
      return value !== null && input.value === formatTime(value, format) ? "" : squash(input.value);
    }

    function setExpanded(expanded) {
      list.hidden = !expanded;
      input.setAttribute("aria-expanded", String(expanded));
      toggle.setAttribute("aria-expanded", String(expanded));
      if (!expanded) input.removeAttribute("aria-activedescendant");
    }

    function paint() {
      const query = typed();
      matches = query
        ? slots.filter(function (slot) {
            const label = squash(formatTime(slot, format));
            return label.indexOf(query) === 0 || label.replace(/^0/, "").indexOf(query) === 0;
          })
        : slots;
      list.innerHTML = "";
      matches.forEach(function (slot, index) {
        const option = document.createElement("li");
        option.className = "tp-option";
        option.id = "time-picker-option-" + index;
        option.setAttribute("role", "option");
        option.setAttribute("aria-selected", String(slot === value));
        option.textContent = formatTime(slot, format);
        if (slot === value) {
          option.insertAdjacentHTML(
            "beforeend",
            '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m5 12 5 5L20 7"/></svg>',
          );
        }
        if (index === active) option.setAttribute("data-active", "");
        option.addEventListener("mousedown", function (event) {
          event.preventDefault();
        });
        option.addEventListener("mousemove", function () {
          if (active !== index) setActive(index);
        });
        option.addEventListener("click", function () {
          choose(slot);
        });
        list.appendChild(option);
      });
      setExpanded(open && matches.length > 0);
      if (open && matches.length > 0 && active >= 0) input.setAttribute("aria-activedescendant", "time-picker-option-" + active);
      status.textContent =
        open && query
          ? matches.length
            ? matches.length + (matches.length === 1 ? " time" : " times") + " listed."
            : "No listed time matches; you can still type one."
          : "";
    }

    function setActive(index) {
      active = index;
      paint();
      const option = list.querySelector("#time-picker-option-" + index);
      if (option) option.scrollIntoView({ block: "nearest" });
    }

    function setError(message) {
      errorText.textContent = message;
      if (message) input.setAttribute("aria-invalid", "true");
      else input.removeAttribute("aria-invalid");
    }

    /** Opening lands on the chosen time, or the first one after it. */
    function openList() {
      open = true;
      paint();
      if (value === null || typed()) return;
      let at = matches.findIndex(function (slot) {
        return slot >= value;
      });
      if (at < 0) at = matches.length - 1;
      setActive(at);
    }

    function close() {
      open = false;
      active = -1;
      paint();
    }

    function choose(time) {
      value = time;
      input.value = formatTime(time, format);
      if (hidden) hidden.value = formatTime(time, "24h");
      setError("");
      close();
    }

    input.addEventListener("input", function () {
      open = true;
      active = 0;
      setError("");
      paint();
    });
    input.addEventListener("click", openList);

    input.addEventListener("keydown", function (event) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (!open) {
          openList();
          return;
        }
        if (event.altKey || matches.length === 0) return;
        const count = matches.length;
        setActive(event.key === "ArrowDown" ? (active + 1) % count : active <= 0 ? count - 1 : active - 1);
      } else if (event.key === "Enter") {
        if (!list.hidden && active >= 0) {
          event.preventDefault();
          choose(matches[active]);
        }
      } else if (event.key === "Escape") {
        if (!list.hidden) {
          event.preventDefault();
          close();
        }
      } else if (event.key === "Tab") {
        close();
      }
    });

    /** Anything typed that reads as a time is kept, even between the listed slots. */
    input.addEventListener("blur", function () {
      close();
      const raw = input.value.trim();
      if (raw === "") {
        value = null;
        if (hidden) hidden.value = "";
        setError("");
        return;
      }
      const time = parseTime(raw);
      if (time === null) {
        value = null;
        if (hidden) hidden.value = "";
        setError("Enter a time like " + example + ".");
      } else if (time < earliest || time > latest) {
        value = null;
        if (hidden) hidden.value = "";
        setError("Choose a time between " + formatTime(earliest, format) + " and " + formatTime(latest, format) + ".");
      } else {
        choose(time);
      }
    });

    toggle.addEventListener("mousedown", function (event) {
      event.preventDefault();
    });
    toggle.addEventListener("click", function () {
      if (open) close();
      else openList();
      input.focus();
    });
  }

  document.querySelectorAll("[data-time-picker]").forEach(createTimePicker);
})();
