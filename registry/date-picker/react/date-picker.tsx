"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
} from "react";

export type DatePickerConfig = {
  label: string;
  name: string;
  helperText: boolean;
  helperTextContent: string;
  format: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY/MM/DD" | "YYYY-MM-DD";
  mode: "single" | "range";
  weekStartsOn: "monday" | "sunday";
  minDate: string;
  maxDate: string;
  clearButton: boolean;
  todayButton: boolean;
  theme: "light" | "dark" | "system";
  iosOnPhone: boolean;
  accentColor: string;
  radius: number;
  size: "sm" | "md" | "lg";
};

// @config-start
const defaultConfig: DatePickerConfig = {
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

type View = "days" | "months" | "years";

const sizes = {
  sm: { field: "h-8 text-sm", input: "px-2", button: "w-8", cell: "size-8 text-xs", panel: "w-56" },
  md: { field: "h-10 text-base", input: "px-3", button: "w-10", cell: "size-10 text-sm", panel: "w-70" },
  lg: { field: "h-12 text-lg", input: "px-4", button: "w-12", cell: "size-12 text-base", panel: "w-84" },
};

// iOS uses bigger rows and its own blue; everything else is shared with the web look.
const iosSizes = { field: "h-11 text-[17px]", input: "px-4", button: "w-11", cell: "size-11 text-base", panel: "w-77" };
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

const focusRing =
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--dp-ring)";
const iconButton = `grid shrink-0 cursor-pointer place-items-center text-(--dp-muted) hover:bg-(--dp-hover) ${focusRing}`;
const navButton = `grid size-9 shrink-0 cursor-pointer place-items-center rounded-(--dp-radius) text-(--dp-muted) hover:bg-(--dp-hover) ${focusRing}`;

type Format = DatePickerConfig["format"];

const pad = (n: number) => String(n).padStart(2, "0");
const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const sameDay = (a?: Date | null, b?: Date | null) =>
  !!a &&
  !!b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

function today() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function addMonths(d: Date, n: number) {
  const first = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const day = Math.min(d.getDate(), daysInMonth(first.getFullYear(), first.getMonth()));
  return new Date(first.getFullYear(), first.getMonth(), day);
}

function formatDate(d: Date, format: Format) {
  return format
    .replace("YYYY", String(d.getFullYear()))
    .replace("MM", pad(d.getMonth() + 1))
    .replace("DD", pad(d.getDate()));
}

// "YYYY-MM-DD" (the form value and the min/max config format) → local Date, or null when empty.
function fromIso(iso: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) : null;
}

function isDisabled(date: Date, config: DatePickerConfig) {
  const min = fromIso(config.minDate);
  const max = fromIso(config.maxDate);
  return (!!min && date < min) || (!!max && date > max);
}

function isMonthDisabled(year: number, month: number, config: DatePickerConfig) {
  const min = fromIso(config.minDate);
  const max = fromIso(config.maxDate);
  return (!!min && new Date(year, month + 1, 0) < min) || (!!max && new Date(year, month, 1) > max);
}

function isYearDisabled(year: number, config: DatePickerConfig) {
  const min = fromIso(config.minDate);
  const max = fromIso(config.maxDate);
  return (!!min && year < min.getFullYear()) || (!!max && year > max.getFullYear());
}

function limitError(date: Date, config: DatePickerConfig) {
  const min = fromIso(config.minDate);
  const max = fromIso(config.maxDate);
  if (min && date < min) return `Choose a date on or after ${formatDate(min, config.format)}.`;
  if (max && date > max) return `Choose a date on or before ${formatDate(max, config.format)}.`;
  return "";
}

function parseDate(text: string, format: Format): { date: Date } | { error: string } {
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

function parseValue(text: string, config: DatePickerConfig): { dates: Date[] } | { error: string } {
  const trimmed = text.trim();
  if (!trimmed) return { dates: [] };
  if (config.mode === "single") {
    const result = parseDate(trimmed, config.format);
    if ("error" in result) return result;
    const limit = limitError(result.date, config);
    return limit ? { error: limit } : { dates: [result.date] };
  }
  const parts = trimmed.split(/\s*–\s*|\s+-\s+|\s+to\s+/);
  if (parts.length !== 2) return { error: `Enter the dates as ${config.format} – ${config.format}.` };
  const start = parseDate(parts[0], config.format);
  if ("error" in start) return { error: `Start date: ${start.error}` };
  const startLimit = limitError(start.date, config);
  if (startLimit) return { error: `Start date: ${startLimit}` };
  const end = parseDate(parts[1], config.format);
  if ("error" in end) return { error: `End date: ${end.error}` };
  const endLimit = limitError(end.date, config);
  if (endLimit) return { error: `End date: ${endLimit}` };
  if (end.date < start.date) return { error: "The end date is before the start date." };
  return { dates: [start.date, end.date] };
}

// WCAG relative luminance, used to keep text and focus rings readable on any accent colour.
function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: number, b: number) {
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function shift(hex: string, factor: number) {
  const channels = [1, 3, 5].map((i) =>
    Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * factor))),
  );
  return `#${channels.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

/** The accent used as text: darkened (or lightened on dark) until it clears 4.5:1. */
function readableAccent(hex: string, surface: string, dark: boolean) {
  let color = hex;
  const surfaceLuminance = luminance(surface);
  for (let i = 0; i < 14 && contrast(luminance(color), surfaceLuminance) < 4.5; i++) {
    color = shift(color, dark ? 1.15 : 0.85);
  }
  return color;
}

const media = (query: string) => ({
  subscribe: (onChange: () => void) => {
    const list = window.matchMedia(query);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  },
  get: () => window.matchMedia(query).matches,
});

const darkMedia = media("(prefers-color-scheme: dark)");
const phoneMedia = media("(max-width: 480px)");
const isApplePhone = () =>
  /iP(hone|od)/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) ||
  /iPad/.test(navigator.userAgent);

export function DatePicker({ config = defaultConfig }: { config?: DatePickerConfig }) {
  const id = useId();
  const fieldRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const gridRef = useRef<HTMLTableElement>(null);
  const moveFocus = useRef(false);
  const [text, setText] = useState("");
  const [dates, setDates] = useState<Date[]>([]);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("days");
  const [focused, setFocused] = useState(today);
  const [rangeStart, setRangeStart] = useState<Date | null>(null);

  // Theme and platform are read from the browser, so the exported file works anywhere.
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const onPhone = useSyncExternalStore(phoneMedia.subscribe, phoneMedia.get, () => false);
  const applePhone = useSyncExternalStore(phoneMedia.subscribe, () => onPhone && isApplePhone(), () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const ios = config.iosOnPhone && applePhone;

  const range = config.mode === "range";
  const size = ios ? iosSizes : sizes[config.size];
  const startIdx = config.weekStartsOn === "monday" ? 1 : 0;
  const chooseLabel = range ? "Choose dates" : "Choose date";
  const placeholder = range ? `${config.format} – ${config.format}` : config.format;
  const showHelper = config.helperText && config.helperTextContent !== "";
  const describedBy =
    [showHelper && `${id}-help`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  // Form values follow the typed text, so submitting with Enter never sends a stale value.
  const parsed = parseValue(text, config);
  const formDates = "dates" in parsed ? parsed.dates : [];
  const palette = dark ? palettes.dark : palettes.light;
  const accent = ios && config.accentColor === defaultConfig.accentColor ? IOS_BLUE[dark ? "dark" : "light"] : config.accentColor;
  const accentLuminance = luminance(accent);
  const style = {
    "--dp-accent": accent,
    "--dp-accent-text": readableAccent(accent, palette.surface, dark),
    "--dp-on-accent": accentLuminance > 0.179 ? "#000000" : "#ffffff",
    "--dp-ring": accentLuminance <= 0.35 || dark ? accent : "#000000",
    "--dp-radius": `${ios ? 12 : config.radius}px`,
    "--dp-surface": palette.surface,
    "--dp-sunk": palette.sunk,
    "--dp-text": palette.text,
    "--dp-muted": palette.muted,
    "--dp-border": ios ? palette.sunk : palette.border,
    "--dp-line": palette.line,
    "--dp-disabled": palette.disabled,
    "--dp-error": palette.error,
    "--dp-hover": palette.hover,
    ...(ios ? { fontFamily: IOS_FONT } : null),
  } as CSSProperties;

  useEffect(() => {
    const dialog = dialogRef.current;
    const field = fieldRef.current;
    if (!open || !dialog || !field) return;
    if (!dialog.open) dialog.showModal();
    // The iOS sheet is pinned to the bottom of the screen by CSS; only the popover is positioned.
    if (ios) return;

    function position() {
      if (!dialog || !field) return;
      const rect = field.getBoundingClientRect();
      const below = rect.bottom + 4;
      const top =
        below + dialog.offsetHeight > window.innerHeight
          ? Math.max(8, rect.top - dialog.offsetHeight - 4)
          : below;
      dialog.style.top = `${top}px`;
      dialog.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - dialog.offsetWidth - 8))}px`;
    }

    position();
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    return () => {
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
    };
  }, [open, focused, view, ios]);

  useEffect(() => {
    if (!open || !moveFocus.current) return;
    moveFocus.current = false;
    gridRef.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
  });

  function commit(next: Date[]) {
    setDates(next);
    setError("");
    setText(next.map((d) => formatDate(d, config.format)).join(" – "));
  }

  function commitText() {
    // Read the live input: Enter can arrive before React re-renders with the typed text.
    const result = parseValue(inputRef.current?.value ?? text, config);
    if ("error" in result) setError(result.error);
    else commit(result.dates);
  }

  function openPicker() {
    const min = fromIso(config.minDate);
    const max = fromIso(config.maxDate);
    const now = today();
    setFocused(dates[0] ?? (min && now < min ? min : max && now > max ? max : now));
    setRangeStart(null);
    setView("days");
    moveFocus.current = true;
    setOpen(true);
  }

  function moveTo(date: Date) {
    moveFocus.current = true;
    setFocused(date);
  }

  function changeView(next: View) {
    moveFocus.current = true;
    setView(next);
  }

  function select(date: Date) {
    if (isDisabled(date, config)) return;
    if (range && !rangeStart) {
      setRangeStart(date);
      moveTo(date);
      return;
    }
    commit(rangeStart ? (date < rangeStart ? [date, rangeStart] : [rangeStart, date]) : [date]);
    dialogRef.current?.close();
  }

  // Days view selects a date; years view drills into months; months view returns to days.
  function pick(date: Date) {
    if (view === "days") return select(date);
    if (view === "years") {
      if (isYearDisabled(date.getFullYear(), config)) return;
      setFocused(date);
      changeView("months");
      return;
    }
    if (isMonthDisabled(date.getFullYear(), date.getMonth(), config)) return;
    setFocused(date);
    changeView("days");
  }

  function onDialogClose() {
    setOpen(false);
    setView("days");
    setRangeStart(null);
    buttonRef.current?.focus();
  }

  const year = focused.getFullYear();
  const month = focused.getMonth();
  const yearStart = year - (year % 12);
  const heading =
    view === "days"
      ? focused.toLocaleDateString(undefined, { month: "long", year: "numeric" })
      : view === "months"
        ? String(year)
        : `${yearStart} – ${yearStart + 11}`;
  const stepMonths = view === "days" ? 1 : view === "months" ? 12 : 144;
  const stepName = view === "days" ? "month" : view === "months" ? "year" : "12 years";

  function onGridKeyDown(event: KeyboardEvent) {
    const by = (months: number) => () => addMonths(focused, months);
    const dayOfWeek = (focused.getDay() - startIdx + 7) % 7;
    const moves: Record<string, () => Date> =
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
  }

  function onDialogKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    // In the month or year view, Escape steps back to the days instead of closing.
    if (event.key === "Escape" && view !== "days") {
      event.preventDefault();
      changeView("days");
      return;
    }
    // Keep Tab inside the open dialog (APG dialog pattern).
    if (event.key !== "Tab") return;
    const items = [...event.currentTarget.querySelectorAll<HTMLElement>('button, [tabindex="0"]')];
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  const offset = (new Date(year, month, 1).getDay() - startIdx + 7) % 7;
  const total = daysInMonth(year, month);
  const cells = Array.from({ length: Math.ceil((offset + total) / 7) * 7 }, (_, i) => {
    const day = i - offset + 1;
    return day >= 1 && day <= total ? new Date(year, month, day) : null;
  });
  const weeks = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));
  const selStart = rangeStart ?? dates[0];
  const selEnd = rangeStart ?? dates[1] ?? dates[0];
  const now = today();
  const pickerItems = Array.from({ length: 12 }, (_, i) => {
    if (view === "years") {
      const date = addMonths(focused, (yearStart + i - year) * 12);
      const y = date.getFullYear();
      return {
        date,
        label: String(y),
        name: String(y),
        focus: y === year,
        selected: y === selStart?.getFullYear(),
        current: y === now.getFullYear(),
        disabled: isYearDisabled(y, config),
      };
    }
    const date = addMonths(focused, i - month);
    return {
      date,
      label: date.toLocaleDateString(undefined, { month: "short" }),
      name: date.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
      focus: i === month,
      selected: !!selStart && selStart.getFullYear() === year && selStart.getMonth() === i,
      current: year === now.getFullYear() && i === now.getMonth(),
      disabled: isMonthDisabled(year, i, config),
    };
  });
  const cellShape = ios ? "rounded-full" : "rounded-(--dp-radius)";
  const cellState = (selected: boolean, inRange: boolean, disabled: boolean) =>
    selected
      ? "cursor-pointer bg-(--dp-accent) font-semibold text-(--dp-on-accent)"
      : inRange
        ? "cursor-pointer bg-(--dp-accent)/15"
        : disabled
          ? "cursor-not-allowed text-(--dp-disabled)"
          : "cursor-pointer hover:bg-(--dp-hover)";
  const isoValue = (d?: Date) => (d ? formatDate(d, "YYYY-MM-DD") : "");

  return (
    <div className="flex flex-col gap-1.5 text-(--dp-text)" style={style}>
      <label htmlFor={`${id}-input`} className="font-medium">
        {config.label}
        <span className="sr-only"> ({placeholder})</span>
      </label>
      <div
        ref={fieldRef}
        className={`flex w-full items-stretch overflow-hidden rounded-(--dp-radius) border bg-(--dp-surface) text-(--dp-text) has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-(--dp-ring) ${range ? "max-w-sm" : "max-w-xs"} ${error ? "border-(--dp-error)" : "border-(--dp-border)"} ${ios ? "bg-(--dp-sunk)" : ""} ${size.field}`}
      >
        <input
          ref={inputRef}
          id={`${id}-input`}
          type="text"
          autoComplete="off"
          placeholder={placeholder}
          value={text}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onChange={(event) => setText(event.target.value)}
          onBlur={commitText}
          onKeyDown={(event) => {
            if (event.key === "Enter") commitText();
          }}
          className={`min-w-0 flex-1 bg-transparent outline-none placeholder:text-(--dp-muted) ${size.input}`}
        />
        {config.clearButton && text !== "" && (
          <button
            type="button"
            aria-label={range ? "Clear dates" : "Clear date"}
            onClick={() => {
              commit([]);
              inputRef.current?.focus();
            }}
            className={`${iconButton} ${size.button}`}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        )}
        <button
          ref={buttonRef}
          type="button"
          aria-label={chooseLabel}
          aria-haspopup="dialog"
          onClick={openPicker}
          className={`${iconButton} ${size.button} ${ios ? "text-(--dp-accent-text)" : ""}`}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4">
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 10h18M8 3v4M16 3v4" />
          </svg>
        </button>
      </div>
      {showHelper && (
        <p id={`${id}-help`} className="text-sm text-(--dp-muted)">
          {config.helperTextContent}
        </p>
      )}
      <p id={`${id}-error`} role="alert" className="text-sm text-(--dp-error) empty:hidden">
        {error}
      </p>
      {config.name !== "" &&
        (range ? (
          <>
            <input type="hidden" name={`${config.name}-start`} value={isoValue(formDates[0])} />
            <input type="hidden" name={`${config.name}-end`} value={isoValue(formDates[1])} />
          </>
        ) : (
          <input type="hidden" name={config.name} value={isoValue(formDates[0])} />
        ))}

      <dialog
        ref={dialogRef}
        aria-label={chooseLabel}
        onClose={onDialogClose}
        onKeyDown={onDialogKeyDown}
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
        className={`m-0 border bg-(--dp-surface) p-0 text-(--dp-text) shadow-xl ${
          ios
            ? "fixed inset-x-0 top-auto bottom-0 max-h-[85vh] w-full max-w-none rounded-t-2xl border-(--dp-line) pb-[env(safe-area-inset-bottom)] backdrop:bg-black/40 transition-transform duration-300 ease-out starting:translate-y-full motion-reduce:transition-none"
            : "fixed inset-auto rounded-(--dp-radius) border-(--dp-line) backdrop:bg-black/10"
        }`}
      >
        {open && (
          <div className={`p-3 select-none ${ios ? "mx-auto w-full max-w-[26rem] px-4 pb-6" : `box-content ${size.panel}`}`}>
            {ios && (
              <span aria-hidden="true" className="mx-auto mb-3 block h-1 w-9 rounded-full bg-(--dp-line)" />
            )}
            <div className="mb-2 flex items-center justify-between gap-1">
              <button
                type="button"
                aria-label={`Previous ${stepName}`}
                onClick={() => setFocused(addMonths(focused, -stepMonths))}
                className={`${navButton} ${ios ? "text-(--dp-accent-text)" : ""}`}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => changeView(view === "days" ? "years" : view === "years" ? "days" : "years")}
                className={`inline-flex min-w-0 cursor-pointer items-center gap-1 rounded-(--dp-radius) px-2 py-1 font-semibold hover:bg-(--dp-hover) ${focusRing} ${ios ? "text-(--dp-text)" : ""}`}
              >
                {heading}
                <span className="sr-only">
                  {view === "days" ? ", change month and year" : view === "years" ? ", back to calendar" : ", change year"}
                </span>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className={`size-4 text-(--dp-accent-text) transition-transform motion-reduce:transition-none ${view === "days" ? "" : "rotate-180"}`}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                aria-label={`Next ${stepName}`}
                onClick={() => setFocused(addMonths(focused, stepMonths))}
                className={`${navButton} ${ios ? "text-(--dp-accent-text)" : ""}`}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>
            <p aria-live="polite" className="sr-only">
              {heading}
            </p>

            {view === "days" ? (
              <table
                ref={gridRef}
                role="grid"
                aria-label={heading}
                onKeyDown={onGridKeyDown}
                className="w-full border-collapse"
              >
                <thead>
                  <tr>
                    {Array.from({ length: 7 }, (_, i) => {
                      const day = new Date(2026, 0, 4 + startIdx + i); // 4 Jan 2026 was a Sunday
                      return (
                        <th
                          key={i}
                          scope="col"
                          abbr={day.toLocaleDateString(undefined, { weekday: "long" })}
                          className="h-8 cursor-default text-xs font-medium text-(--dp-muted)"
                        >
                          {day.toLocaleDateString(undefined, { weekday: "short" })}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {weeks.map((week, w) => (
                    <tr key={w}>
                      {week.map((date, d) => {
                        if (!date) return <td key={d} />;
                        const isEnd = sameDay(date, selStart) || sameDay(date, selEnd);
                        const inRange = !!selStart && !!selEnd && date > selStart && date < selEnd;
                        const isToday = sameDay(date, now);
                        const disabled = isDisabled(date, config);
                        return (
                          <td
                            key={d}
                            role="gridcell"
                            tabIndex={sameDay(date, focused) ? 0 : -1}
                            aria-selected={isEnd || inRange}
                            aria-disabled={disabled || undefined}
                            aria-current={isToday ? "date" : undefined}
                            aria-label={date.toLocaleDateString(undefined, {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                            onClick={() => pick(date)}
                            className={`text-center tabular-nums ${cellShape} ${focusRing} ${size.cell} ${cellState(isEnd, inRange, disabled)} ${isToday && !isEnd ? (ios ? "font-semibold text-(--dp-accent-text)" : "font-semibold underline") : ""}`}
                          >
                            {date.getDate()}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table
                ref={gridRef}
                role="grid"
                aria-label={view === "years" ? "Choose year" : "Choose month"}
                onKeyDown={onGridKeyDown}
                className="w-full border-collapse"
              >
                <tbody>
                  {[0, 4, 8].map((start) => (
                    <tr key={start}>
                      {pickerItems.slice(start, start + 4).map((item) => (
                        <td
                          key={item.name}
                          role="gridcell"
                          tabIndex={item.focus ? 0 : -1}
                          aria-selected={item.selected}
                          aria-disabled={item.disabled || undefined}
                          aria-label={item.name}
                          onClick={() => pick(item.date)}
                          className={`h-12 rounded-(--dp-radius) text-center text-sm tabular-nums ${focusRing} ${cellState(item.selected, false, item.disabled)} ${item.current && !item.selected ? (ios ? "font-semibold text-(--dp-accent-text)" : "font-semibold underline") : ""}`}
                        >
                          {item.label}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <p aria-live="polite" className="mt-2 min-h-5 text-sm text-(--dp-muted)">
              {rangeStart ? "Now choose the end date." : ""}
            </p>
            {config.todayButton && (
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setView("days");
                    moveTo(today());
                  }}
                  className={`cursor-pointer rounded-(--dp-radius) px-3 py-1 text-sm hover:bg-(--dp-hover) ${focusRing} ${ios ? "font-semibold text-(--dp-accent-text)" : "border border-(--dp-border)"}`}
                >
                  Today
                </button>
              </div>
            )}
          </div>
        )}
      </dialog>
    </div>
  );
}
