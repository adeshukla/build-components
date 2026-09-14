/**
 * Date picker — plain JavaScript, no dependencies.
 * Markup: <div data-date-picker></div>  Styles: date-picker.css
 * Keyboard and ARIA follow the WAI-ARIA APG "Date Picker Dialog" pattern.
 */
(function () {
  // @config-start
  const defaultConfig = {
    label: "Date",
    helperText: false,
    helperTextContent: "Select or type a date.",
    format: "DD/MM/YYYY",
    mode: "single",
    weekStartsOn: "monday",
    clearButton: false,
    todayButton: false,
    accentColor: "#2563eb",
    radius: 6,
    size: "md",
  };
  // @config-end

  const pad = (n) => String(n).padStart(2, "0");
  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const sameDay = (a, b) =>
    !!a &&
    !!b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  function today() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  function addMonths(d, n) {
    const first = new Date(d.getFullYear(), d.getMonth() + n, 1);
    const day = Math.min(d.getDate(), daysInMonth(first.getFullYear(), first.getMonth()));
    return new Date(first.getFullYear(), first.getMonth(), day);
  }

  function formatDate(d, format) {
    return format
      .replace("YYYY", String(d.getFullYear()))
      .replace("MM", pad(d.getMonth() + 1))
      .replace("DD", pad(d.getDate()));
  }

  function parseDate(text, format) {
    const hint = `Enter the date as ${format}.`;
    const parts = text.trim().split(/[^0-9]+/);
    if (parts.length !== 3) return { error: hint };
    const value = Object.fromEntries(format.split(/[^A-Z]+/).map((token, i) => [token, parts[i]]));
    if (!/^[1-9]\d{3}$/.test(value.YYYY) || !/^\d{1,2}$/.test(value.MM) || !/^\d{1,2}$/.test(value.DD)) {
      return { error: hint };
    }
    const year = Number(value.YYYY);
    const month = Number(value.MM);
    const day = Number(value.DD);
    if (month < 1 || month > 12) return { error: `${value.MM} isn't a valid month. Use 01 to 12.` };
    const max = daysInMonth(year, month - 1);
    if (day < 1 || day > max) return { error: `Day ${value.DD} doesn't exist — that month has ${max} days.` };
    return { date: new Date(year, month - 1, day) };
  }

  function parseValue(text, config) {
    const trimmed = text.trim();
    if (!trimmed) return { dates: [] };
    if (config.mode === "single") {
      const result = parseDate(trimmed, config.format);
      return result.error ? result : { dates: [result.date] };
    }
    const parts = trimmed.split(/\s*–\s*|\s+-\s+|\s+to\s+/);
    if (parts.length !== 2) return { error: `Enter the dates as ${config.format} – ${config.format}.` };
    const start = parseDate(parts[0], config.format);
    if (start.error) return { error: `Start date: ${start.error}` };
    const end = parseDate(parts[1], config.format);
    if (end.error) return { error: `End date: ${end.error}` };
    if (end.date < start.date) return { error: "The end date is before the start date." };
    return { dates: [start.date, end.date] };
  }

  // WCAG relative luminance, used to keep text and focus rings readable on any accent colour.
  function luminance(hex) {
    const [r, g, b] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  const svg = (body) =>
    `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${body}</svg>`;
  const icons = {
    clear: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
    calendar: svg('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
    prev: svg('<path d="m15 18-6-6 6-6"/>'),
    next: svg('<path d="m9 18 6-6-6-6"/>'),
  };

  let count = 0;

  function createDatePicker(root, config) {
    const id = `date-picker-${++count}`;
    const range = config.mode === "range";
    const startIdx = config.weekStartsOn === "monday" ? 1 : 0;
    const chooseLabel = range ? "Choose dates" : "Choose date";
    const placeholder = range ? `${config.format} – ${config.format}` : config.format;
    const showHelper = config.helperText && config.helperTextContent !== "";
    let dates = [];
    let focused = today();
    let rangeStart = null;

    const accentLuminance = luminance(config.accentColor);
    root.classList.add("dp", `dp--${config.size}`);
    if (range) root.classList.add("dp--range");
    root.style.setProperty("--dp-accent", config.accentColor);
    root.style.setProperty("--dp-on-accent", accentLuminance > 0.179 ? "#000000" : "#ffffff");
    root.style.setProperty("--dp-ring", accentLuminance <= 0.3 ? config.accentColor : "#000000");
    root.style.setProperty("--dp-radius", `${config.radius}px`);

    // Only ids and icons are interpolated here; user-provided text is set with textContent below.
    root.innerHTML = `
      <label class="dp-label" for="${id}-input"><span data-label></span><span class="dp-sr-only" data-format></span></label>
      <div class="dp-field">
        <input class="dp-input" id="${id}-input" type="text" autocomplete="off">
        ${config.clearButton ? `<button type="button" class="dp-icon-button" data-clear hidden>${icons.clear}</button>` : ""}
        <button type="button" class="dp-icon-button" data-open aria-haspopup="dialog">${icons.calendar}</button>
      </div>
      ${showHelper ? `<p class="dp-helper" id="${id}-help"></p>` : ""}
      <p class="dp-error" id="${id}-error" role="alert"></p>
      <dialog class="dp-dialog">
        <div class="dp-dialog-inner">
          <div class="dp-header">
            <button type="button" class="dp-nav" data-prev aria-label="Previous month">${icons.prev}</button>
            <h2 class="dp-month" id="${id}-month" aria-live="polite"></h2>
            <button type="button" class="dp-nav" data-next aria-label="Next month">${icons.next}</button>
          </div>
          <table class="dp-grid" role="grid" aria-labelledby="${id}-month">
            <thead><tr></tr></thead>
            <tbody></tbody>
          </table>
          <p class="dp-status" aria-live="polite"></p>
          ${config.todayButton ? '<div class="dp-footer"><button type="button" class="dp-text-button" data-today>Today</button></div>' : ""}
        </div>
      </dialog>`;

    const find = (selector) => root.querySelector(selector);
    const field = find(".dp-field");
    const input = find(".dp-input");
    const clearButton = find("[data-clear]");
    const openButton = find("[data-open]");
    const errorText = find(".dp-error");
    const dialog = find("dialog");
    const monthHeading = find(".dp-month");
    const tbody = find("tbody");
    const status = find(".dp-status");

    find("[data-label]").textContent = config.label;
    find("[data-format]").textContent = ` (${placeholder})`;
    input.placeholder = placeholder;
    openButton.setAttribute("aria-label", chooseLabel);
    dialog.setAttribute("aria-label", chooseLabel);
    if (showHelper) find(".dp-helper").textContent = config.helperTextContent;
    if (clearButton) clearButton.setAttribute("aria-label", range ? "Clear dates" : "Clear date");

    const headRow = find("thead tr");
    for (let i = 0; i < 7; i++) {
      const day = new Date(2026, 0, 4 + startIdx + i); // 4 Jan 2026 was a Sunday
      const th = document.createElement("th");
      th.scope = "col";
      th.abbr = day.toLocaleDateString(undefined, { weekday: "long" });
      th.textContent = day.toLocaleDateString(undefined, { weekday: "short" });
      headRow.append(th);
    }

    function setError(message) {
      errorText.textContent = message;
      field.toggleAttribute("data-invalid", !!message);
      if (message) input.setAttribute("aria-invalid", "true");
      else input.removeAttribute("aria-invalid");
      const describedBy = [showHelper && `${id}-help`, message && `${id}-error`].filter(Boolean).join(" ");
      if (describedBy) input.setAttribute("aria-describedby", describedBy);
      else input.removeAttribute("aria-describedby");
    }

    function syncClearButton() {
      if (clearButton) clearButton.hidden = input.value === "";
    }

    function commit(next) {
      dates = next;
      input.value = next.map((d) => formatDate(d, config.format)).join(" – ");
      setError("");
      syncClearButton();
    }

    function commitText() {
      const result = parseValue(input.value, config);
      if (result.error) setError(result.error);
      else commit(result.dates);
    }

    function renderGrid() {
      const year = focused.getFullYear();
      const month = focused.getMonth();
      const offset = (new Date(year, month, 1).getDay() - startIdx + 7) % 7;
      const total = daysInMonth(year, month);
      const selStart = rangeStart || dates[0];
      const selEnd = rangeStart || dates[1] || dates[0];
      const now = today();
      monthHeading.textContent = focused.toLocaleDateString(undefined, { month: "long", year: "numeric" });
      tbody.replaceChildren();
      let row;
      for (let i = 0; i < Math.ceil((offset + total) / 7) * 7; i++) {
        if (i % 7 === 0) row = tbody.insertRow();
        const cell = row.insertCell();
        const day = i - offset + 1;
        if (day < 1 || day > total) continue;
        const date = new Date(year, month, day);
        const isEnd = sameDay(date, selStart) || sameDay(date, selEnd);
        const inRange = !!selStart && !!selEnd && date > selStart && date < selEnd;
        cell.textContent = String(day);
        cell.dataset.day = String(day);
        cell.setAttribute("role", "gridcell");
        cell.tabIndex = sameDay(date, focused) ? 0 : -1;
        cell.setAttribute("aria-selected", String(isEnd || inRange));
        cell.setAttribute(
          "aria-label",
          date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
        );
        if (sameDay(date, now)) cell.setAttribute("aria-current", "date");
        if (isEnd) cell.dataset.end = "";
        else if (inRange) cell.dataset.inRange = "";
      }
      status.textContent = rangeStart ? "Now choose the end date." : "";
    }

    function moveTo(date) {
      focused = date;
      renderGrid();
      tbody.querySelector('[tabindex="0"]').focus();
    }

    function select(date) {
      if (range && !rangeStart) {
        rangeStart = date;
        moveTo(date);
        return;
      }
      commit(rangeStart ? (date < rangeStart ? [date, rangeStart] : [rangeStart, date]) : [date]);
      dialog.close();
    }

    function openPicker() {
      focused = dates[0] || today();
      rangeStart = null;
      renderGrid();
      dialog.showModal();
      const rect = field.getBoundingClientRect();
      const below = rect.bottom + 4;
      const top =
        below + dialog.offsetHeight > window.innerHeight ? Math.max(8, rect.top - dialog.offsetHeight - 4) : below;
      dialog.style.top = `${top}px`;
      dialog.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - dialog.offsetWidth - 8))}px`;
      tbody.querySelector('[tabindex="0"]').focus();
    }

    input.addEventListener("input", syncClearButton);
    input.addEventListener("blur", commitText);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") commitText();
    });
    if (clearButton) {
      clearButton.addEventListener("click", () => {
        commit([]);
        input.focus();
      });
    }
    openButton.addEventListener("click", openPicker);
    find("[data-prev]").addEventListener("click", () => {
      focused = addMonths(focused, -1);
      renderGrid();
    });
    find("[data-next]").addEventListener("click", () => {
      focused = addMonths(focused, 1);
      renderGrid();
    });
    const todayButton = find("[data-today]");
    if (todayButton) todayButton.addEventListener("click", () => moveTo(today()));

    tbody.addEventListener("click", (event) => {
      const cell = event.target.closest("td[data-day]");
      if (cell) select(new Date(focused.getFullYear(), focused.getMonth(), Number(cell.dataset.day)));
    });

    tbody.addEventListener("keydown", (event) => {
      const dayOfWeek = (focused.getDay() - startIdx + 7) % 7;
      const moves = {
        ArrowLeft: () => addDays(focused, -1),
        ArrowRight: () => addDays(focused, 1),
        ArrowUp: () => addDays(focused, -7),
        ArrowDown: () => addDays(focused, 7),
        Home: () => addDays(focused, -dayOfWeek),
        End: () => addDays(focused, 6 - dayOfWeek),
        PageUp: () => addMonths(focused, event.shiftKey ? -12 : -1),
        PageDown: () => addMonths(focused, event.shiftKey ? 12 : 1),
      };
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        select(focused);
      } else if (moves[event.key]) {
        event.preventDefault();
        moveTo(moves[event.key]());
      }
    });

    // Keep Tab inside the open dialog (APG dialog pattern).
    dialog.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;
      const items = [...dialog.querySelectorAll('button, [tabindex="0"]')];
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });

    dialog.addEventListener("close", () => {
      rangeStart = null;
      openButton.focus();
    });

    setError("");
  }

  document.querySelectorAll("[data-date-picker]").forEach((root) => createDatePicker(root, defaultConfig));
})();
