/**
 * Date picker — plain JavaScript, no dependencies.
 * Markup: <div data-date-picker></div>  Styles: date-picker.css
 * Keyboard and ARIA follow the WAI-ARIA APG "Date Picker Dialog" pattern.
 */
(function () {
  // @config-start
  const defaultConfig = {
    label: "Date",
    name: "date",
    helperText: false,
    helperTextContent: "Select or type a date.",
    format: "DD/MM/YYYY",
    mode: "single",
    weekStartsOn: "monday",
    minDate: "",
    maxDate: "",
    clearButton: false,
    todayButton: false,
    theme: "light",
    iosOnPhone: true,
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

  // "YYYY-MM-DD" (the form value and the min/max config format) → local Date, or null when empty.
  function fromIso(iso) {
    return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) : null;
  }

  function isDisabled(date, config) {
    const min = fromIso(config.minDate);
    const max = fromIso(config.maxDate);
    return (!!min && date < min) || (!!max && date > max);
  }

  function isMonthDisabled(year, month, config) {
    const min = fromIso(config.minDate);
    const max = fromIso(config.maxDate);
    return (!!min && new Date(year, month + 1, 0) < min) || (!!max && new Date(year, month, 1) > max);
  }

  function isYearDisabled(year, config) {
    const min = fromIso(config.minDate);
    const max = fromIso(config.maxDate);
    return (!!min && year < min.getFullYear()) || (!!max && year > max.getFullYear());
  }

  function limitError(date, config) {
    const min = fromIso(config.minDate);
    const max = fromIso(config.maxDate);
    if (min && date < min) return `Choose a date on or after ${formatDate(min, config.format)}.`;
    if (max && date > max) return `Choose a date on or before ${formatDate(max, config.format)}.`;
    return "";
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
      if (result.error) return result;
      const limit = limitError(result.date, config);
      return limit ? { error: limit } : { dates: [result.date] };
    }
    const parts = trimmed.split(/\s*–\s*|\s+-\s+|\s+to\s+/);
    if (parts.length !== 2) return { error: `Enter the dates as ${config.format} – ${config.format}.` };
    const start = parseDate(parts[0], config.format);
    if (start.error) return { error: `Start date: ${start.error}` };
    const startLimit = limitError(start.date, config);
    if (startLimit) return { error: `Start date: ${startLimit}` };
    const end = parseDate(parts[1], config.format);
    if (end.error) return { error: `End date: ${end.error}` };
    const endLimit = limitError(end.date, config);
    if (endLimit) return { error: `End date: ${endLimit}` };
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

  function contrast(a, b) {
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  }

  function shift(hex, factor) {
    const channels = [1, 3, 5].map((i) =>
      Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * factor))),
    );
    return `#${channels.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
  }

  /** The accent used as text: darkened (or lightened on dark) until it clears 4.5:1. */
  function readableAccent(hex, surface, dark) {
    let color = hex;
    const surfaceLuminance = luminance(surface);
    for (let i = 0; i < 14 && contrast(luminance(color), surfaceLuminance) < 4.5; i++) {
      color = shift(color, dark ? 1.15 : 0.85);
    }
    return color;
  }

  const IOS_FONT = '-apple-system, "SF Pro Text", "SF Pro Display", system-ui, sans-serif';
  const IOS_BLUE = { light: "#007aff", dark: "#0a84ff" };
  const palettes = {
    light: {
      surface: "#ffffff",
      sunk: "#f2f2f7",
      text: "#171717",
      muted: "#535358",
      border: "#737373",
      line: "#d4d4d4",
      disabled: "#a3a3a3",
      error: "#b3261e",
      hover: "#f2f2f7",
    },
    dark: {
      surface: "#1c1c1e",
      sunk: "#2c2c2e",
      text: "#f5f5f7",
      muted: "#b0b0b8",
      border: "#8e8e93",
      line: "#48484a",
      disabled: "#6b6b70",
      error: "#ff6b6b",
      hover: "#2c2c2e",
    },
  };

  const isApplePhone = () =>
    /iP(hone|od|ad)/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  const svg = (body) =>
    `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${body}</svg>`;
  const icons = {
    clear: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
    calendar: svg('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
    prev: svg('<path d="m15 18-6-6 6-6"/>'),
    next: svg('<path d="m9 18 6-6-6-6"/>'),
    chevron: svg('<path d="m6 9 6 6 6-6"/>'),
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
    let view = "days"; // "days" | "months" | "years"

    root.classList.add("dp", `dp--${config.size}`);
    if (range) root.classList.add("dp--range");

    // Theme and platform come from the browser, so this file works anywhere it is dropped in.
    const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const phoneQuery = window.matchMedia("(max-width: 480px)");
    let ios = false;

    function applyAppearance() {
      const dark = config.theme === "dark" || (config.theme === "system" && darkQuery.matches);
      ios = config.iosOnPhone && phoneQuery.matches && isApplePhone();
      const palette = dark ? palettes.dark : palettes.light;
      const accent = ios && config.accentColor === "#2563eb" ? IOS_BLUE[dark ? "dark" : "light"] : config.accentColor;
      const accentLuminance = luminance(accent);
      root.classList.toggle("dp--dark", dark);
      root.classList.toggle("dp--ios", ios);
      Object.keys(palette).forEach((key) => root.style.setProperty(`--dp-${key}`, palette[key]));
      root.style.setProperty("--dp-accent", accent);
      root.style.setProperty("--dp-accent-text", readableAccent(accent, palette.surface, dark));
      root.style.setProperty("--dp-on-accent", accentLuminance > 0.179 ? "#000000" : "#ffffff");
      root.style.setProperty("--dp-ring", accentLuminance <= 0.35 || dark ? accent : "#000000");
      root.style.setProperty("--dp-radius", `${ios ? 12 : config.radius}px`);
      root.style.setProperty("--dp-font", ios ? IOS_FONT : "inherit");
    }

    applyAppearance();
    darkQuery.addEventListener("change", applyAppearance);
    phoneQuery.addEventListener("change", applyAppearance);

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
      ${config.name ? (range ? '<input type="hidden" data-value><input type="hidden" data-value>' : '<input type="hidden" data-value>') : ""}
      <dialog class="dp-dialog">
        <div class="dp-dialog-inner">
          <span class="dp-grabber" aria-hidden="true"></span>
          <div class="dp-header">
            <button type="button" class="dp-nav" data-prev>${icons.prev}</button>
            <button type="button" class="dp-heading" data-heading><span data-heading-text></span><span class="dp-sr-only" data-heading-hint></span>${icons.chevron}</button>
            <button type="button" class="dp-nav" data-next>${icons.next}</button>
          </div>
          <p class="dp-sr-only" aria-live="polite" data-live></p>
          <table class="dp-grid" role="grid">
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
    const valueInputs = root.querySelectorAll("[data-value]");
    const dialog = find("dialog");
    const prevButton = find("[data-prev]");
    const nextButton = find("[data-next]");
    const headingButton = find("[data-heading]");
    const live = find("[data-live]");
    const grid = find(".dp-grid");
    const thead = find("thead");
    const tbody = find("tbody");
    const status = find(".dp-status");

    find("[data-label]").textContent = config.label;
    find("[data-format]").textContent = ` (${placeholder})`;
    input.placeholder = placeholder;
    openButton.setAttribute("aria-label", chooseLabel);
    dialog.setAttribute("aria-label", chooseLabel);
    if (showHelper) find(".dp-helper").textContent = config.helperTextContent;
    if (clearButton) clearButton.setAttribute("aria-label", range ? "Clear dates" : "Clear date");
    if (valueInputs.length === 1) valueInputs[0].name = config.name;
    if (valueInputs.length === 2) {
      valueInputs[0].name = `${config.name}-start`;
      valueInputs[1].name = `${config.name}-end`;
    }

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

    // Form values follow the typed text, so submitting with Enter never sends a stale value.
    function syncInputs() {
      if (clearButton) clearButton.hidden = input.value === "";
      const parsed = parseValue(input.value, config);
      const formDates = parsed.error ? [] : parsed.dates;
      valueInputs.forEach((valueInput, i) => {
        valueInput.value = formDates[i] ? formatDate(formDates[i], "YYYY-MM-DD") : "";
      });
    }

    function commit(next) {
      dates = next;
      input.value = next.map((d) => formatDate(d, config.format)).join(" – ");
      setError("");
      syncInputs();
    }

    function commitText() {
      const result = parseValue(input.value, config);
      if (result.error) setError(result.error);
      else commit(result.dates);
    }

    function addCell(row, { label, name, focus, selected, inRange, disabled, current }) {
      const cell = row.insertCell();
      cell.textContent = label;
      cell.setAttribute("role", "gridcell");
      cell.setAttribute("aria-label", name);
      cell.setAttribute("aria-selected", String(selected || inRange));
      cell.tabIndex = focus ? 0 : -1;
      if (disabled) cell.setAttribute("aria-disabled", "true");
      if (selected) cell.dataset.end = "";
      else if (inRange) cell.dataset.inRange = "";
      if (current) cell.dataset.current = "";
      return cell;
    }

    function render() {
      const year = focused.getFullYear();
      const month = focused.getMonth();
      const yearStart = year - (year % 12);
      const selStart = rangeStart || dates[0];
      const selEnd = rangeStart || dates[1] || dates[0];
      const now = today();
      const heading =
        view === "days"
          ? focused.toLocaleDateString(undefined, { month: "long", year: "numeric" })
          : view === "months"
            ? String(year)
            : `${yearStart} – ${yearStart + 11}`;
      const stepName = view === "days" ? "month" : view === "months" ? "year" : "12 years";

      find("[data-heading-text]").textContent = heading;
      find("[data-heading-hint]").textContent =
        view === "days" ? ", change month and year" : view === "years" ? ", back to calendar" : ", change year";
      headingButton.toggleAttribute("data-open-view", view !== "days");
      prevButton.setAttribute("aria-label", `Previous ${stepName}`);
      nextButton.setAttribute("aria-label", `Next ${stepName}`);
      live.textContent = heading;
      grid.classList.toggle("dp-grid--picker", view !== "days");
      grid.setAttribute("aria-label", view === "days" ? heading : view === "years" ? "Choose year" : "Choose month");
      thead.hidden = view !== "days";
      tbody.replaceChildren();

      if (view === "days") {
        const offset = (new Date(year, month, 1).getDay() - startIdx + 7) % 7;
        const total = daysInMonth(year, month);
        let row;
        for (let i = 0; i < Math.ceil((offset + total) / 7) * 7; i++) {
          if (i % 7 === 0) row = tbody.insertRow();
          const day = i - offset + 1;
          if (day < 1 || day > total) {
            row.insertCell();
            continue;
          }
          const date = new Date(year, month, day);
          const cell = addCell(row, {
            label: String(day),
            name: date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
            focus: sameDay(date, focused),
            selected: sameDay(date, selStart) || sameDay(date, selEnd),
            inRange: !!selStart && !!selEnd && date > selStart && date < selEnd,
            disabled: isDisabled(date, config),
            current: false,
          });
          cell.dataset.day = String(day);
          if (sameDay(date, now)) cell.setAttribute("aria-current", "date");
        }
      } else {
        let row;
        for (let i = 0; i < 12; i++) {
          if (i % 4 === 0) row = tbody.insertRow();
          const date =
            view === "years" ? addMonths(focused, (yearStart + i - year) * 12) : addMonths(focused, i - month);
          const cell = addCell(
            row,
            view === "years"
              ? {
                  label: String(date.getFullYear()),
                  name: String(date.getFullYear()),
                  focus: date.getFullYear() === year,
                  selected: !!selStart && date.getFullYear() === selStart.getFullYear(),
                  inRange: false,
                  disabled: isYearDisabled(date.getFullYear(), config),
                  current: date.getFullYear() === now.getFullYear(),
                }
              : {
                  label: date.toLocaleDateString(undefined, { month: "short" }),
                  name: date.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
                  focus: i === month,
                  selected: !!selStart && selStart.getFullYear() === year && selStart.getMonth() === i,
                  inRange: false,
                  disabled: isMonthDisabled(year, i, config),
                  current: year === now.getFullYear() && i === now.getMonth(),
                },
          );
          cell.dataset.offset = String(view === "years" ? (yearStart + i - year) * 12 : i - month);
        }
      }
      status.textContent = rangeStart ? "Now choose the end date." : "";
      position();
    }

    function position() {
      if (!dialog.open || ios) return;
      const rect = field.getBoundingClientRect();
      const below = rect.bottom + 4;
      const top =
        below + dialog.offsetHeight > window.innerHeight ? Math.max(8, rect.top - dialog.offsetHeight - 4) : below;
      dialog.style.top = `${top}px`;
      dialog.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - dialog.offsetWidth - 8))}px`;
    }

    function focusCell() {
      tbody.querySelector('[tabindex="0"]').focus();
    }

    function moveTo(date) {
      focused = date;
      render();
      focusCell();
    }

    function changeView(next) {
      view = next;
      render();
      focusCell();
    }

    function select(date) {
      if (isDisabled(date, config)) return;
      if (range && !rangeStart) {
        rangeStart = date;
        moveTo(date);
        return;
      }
      commit(rangeStart ? (date < rangeStart ? [date, rangeStart] : [rangeStart, date]) : [date]);
      dialog.close();
    }

    // Days view selects a date; years view drills into months; months view returns to days.
    function pick(date) {
      if (view === "days") return select(date);
      if (view === "years") {
        if (isYearDisabled(date.getFullYear(), config)) return;
        focused = date;
        return changeView("months");
      }
      if (isMonthDisabled(date.getFullYear(), date.getMonth(), config)) return;
      focused = date;
      changeView("days");
    }

    function openPicker() {
      const min = fromIso(config.minDate);
      const max = fromIso(config.maxDate);
      const now = today();
      focused = dates[0] || (min && now < min ? min : max && now > max ? max : now);
      rangeStart = null;
      view = "days";
      dialog.showModal();
      render();
      window.addEventListener("resize", position);
      window.addEventListener("scroll", position, true);
      focusCell();
    }

    const stepMonths = () => (view === "days" ? 1 : view === "months" ? 12 : 144);

    input.addEventListener("input", syncInputs);
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
    prevButton.addEventListener("click", () => {
      focused = addMonths(focused, -stepMonths());
      render();
    });
    nextButton.addEventListener("click", () => {
      focused = addMonths(focused, stepMonths());
      render();
    });
    headingButton.addEventListener("click", () =>
      changeView(view === "days" ? "years" : view === "years" ? "days" : "years"),
    );
    const todayButton = find("[data-today]");
    if (todayButton) {
      todayButton.addEventListener("click", () => {
        view = "days";
        moveTo(today());
      });
    }

    tbody.addEventListener("click", (event) => {
      const cell = event.target.closest('td[role="gridcell"]');
      if (!cell) return;
      if (view === "days") select(new Date(focused.getFullYear(), focused.getMonth(), Number(cell.dataset.day)));
      else pick(addMonths(focused, Number(cell.dataset.offset)));
    });

    tbody.addEventListener("keydown", (event) => {
      const by = (months) => () => addMonths(focused, months);
      const month = focused.getMonth();
      const dayOfWeek = (focused.getDay() - startIdx + 7) % 7;
      const moves =
        view === "days"
          ? {
              ArrowLeft: () => addDays(focused, -1),
              ArrowRight: () => addDays(focused, 1),
              ArrowUp: () => addDays(focused, -7),
              ArrowDown: () => addDays(focused, 7),
              Home: () => addDays(focused, -dayOfWeek),
              End: () => addDays(focused, 6 - dayOfWeek),
              PageUp: by(event.shiftKey ? -12 : -1),
              PageDown: by(event.shiftKey ? 12 : 1),
            }
          : view === "months"
            ? {
                ArrowLeft: by(-1),
                ArrowRight: by(1),
                ArrowUp: by(-4),
                ArrowDown: by(4),
                Home: by(-(month % 4)),
                End: by(3 - (month % 4)),
                PageUp: by(-12),
                PageDown: by(12),
              }
            : {
                ArrowLeft: by(-12),
                ArrowRight: by(12),
                ArrowUp: by(-48),
                ArrowDown: by(48),
                PageUp: by(-144),
                PageDown: by(144),
              };
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        pick(focused);
      } else if (moves[event.key]) {
        event.preventDefault();
        moveTo(moves[event.key]());
      }
    });

    dialog.addEventListener("keydown", (event) => {
      // In the month or year view, Escape steps back to the days instead of closing.
      if (event.key === "Escape" && view !== "days") {
        event.preventDefault();
        changeView("days");
        return;
      }
      // Keep Tab inside the open dialog (APG dialog pattern).
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
      view = "days";
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
      openButton.focus();
    });

    setError("");
    syncInputs();
  }

  document.querySelectorAll("[data-date-picker]").forEach((root) => createDatePicker(root, defaultConfig));
})();
