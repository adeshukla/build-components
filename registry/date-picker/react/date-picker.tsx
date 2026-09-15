"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
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
  accentColor: "#2563eb",
  radius: 6,
  size: "md",
};
// @config-end

const sizes = {
  sm: { field: "h-8 text-sm", input: "px-2", button: "w-8", cell: "size-8 text-xs" },
  md: { field: "h-10 text-base", input: "px-3", button: "w-10", cell: "size-10 text-sm" },
  lg: { field: "h-12 text-lg", input: "px-4", button: "w-12", cell: "size-12 text-base" },
};

const focusRing =
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--dp-ring)";
const iconButton = `grid shrink-0 cursor-pointer place-items-center text-neutral-700 hover:bg-neutral-100 ${focusRing}`;
const navButton = `grid size-9 cursor-pointer place-items-center rounded-(--dp-radius) text-neutral-700 hover:bg-neutral-100 ${focusRing}`;

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
  const [focused, setFocused] = useState(today);
  const [rangeStart, setRangeStart] = useState<Date | null>(null);

  const range = config.mode === "range";
  const size = sizes[config.size];
  const startIdx = config.weekStartsOn === "monday" ? 1 : 0;
  const chooseLabel = range ? "Choose dates" : "Choose date";
  const placeholder = range ? `${config.format} – ${config.format}` : config.format;
  const showHelper = config.helperText && config.helperTextContent !== "";
  const describedBy =
    [showHelper && `${id}-help`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  // Form values follow the typed text, so submitting with Enter never sends a stale value.
  const parsed = parseValue(text, config);
  const formDates = "dates" in parsed ? parsed.dates : [];
  const accentLuminance = luminance(config.accentColor);
  const style = {
    "--dp-accent": config.accentColor,
    "--dp-on-accent": accentLuminance > 0.179 ? "#000000" : "#ffffff",
    "--dp-ring": accentLuminance <= 0.3 ? config.accentColor : "#000000",
    "--dp-radius": `${config.radius}px`,
  } as CSSProperties;

  useEffect(() => {
    const dialog = dialogRef.current;
    const field = fieldRef.current;
    if (!open || !dialog || !field) return;
    if (!dialog.open) dialog.showModal();

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
  }, [open, focused]);

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
    if ("error" in parsed) setError(parsed.error);
    else commit(parsed.dates);
  }

  function openPicker() {
    const min = fromIso(config.minDate);
    const max = fromIso(config.maxDate);
    const now = today();
    setFocused(dates[0] ?? (min && now < min ? min : max && now > max ? max : now));
    setRangeStart(null);
    moveFocus.current = true;
    setOpen(true);
  }

  function moveTo(date: Date) {
    moveFocus.current = true;
    setFocused(date);
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

  function onDialogClose() {
    setOpen(false);
    setRangeStart(null);
    buttonRef.current?.focus();
  }

  function onGridKeyDown(event: KeyboardEvent) {
    const dayOfWeek = (focused.getDay() - startIdx + 7) % 7;
    const moves: Record<string, () => Date> = {
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
  }

  // Keep Tab inside the open dialog (APG dialog pattern).
  function onDialogKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
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

  const year = focused.getFullYear();
  const month = focused.getMonth();
  const offset = (new Date(year, month, 1).getDay() - startIdx + 7) % 7;
  const total = daysInMonth(year, month);
  const cells = Array.from({ length: Math.ceil((offset + total) / 7) * 7 }, (_, i) => {
    const day = i - offset + 1;
    return day >= 1 && day <= total ? new Date(year, month, day) : null;
  });
  const weeks = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));
  const selStart = rangeStart ?? dates[0];
  const selEnd = rangeStart ?? dates[1] ?? dates[0];
  const isoValue = (d?: Date) => (d ? formatDate(d, "YYYY-MM-DD") : "");

  return (
    <div className="flex flex-col gap-1.5" style={style}>
      <label htmlFor={`${id}-input`} className="font-medium">
        {config.label}
        <span className="sr-only"> ({placeholder})</span>
      </label>
      <div
        ref={fieldRef}
        className={`flex w-full items-stretch overflow-hidden rounded-(--dp-radius) border bg-white text-neutral-900 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-(--dp-ring) ${range ? "max-w-sm" : "max-w-xs"} ${error ? "border-red-700" : "border-neutral-500"} ${size.field}`}
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
          className={`min-w-0 flex-1 bg-transparent outline-none placeholder:text-neutral-500 ${size.input}`}
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
          className={`${iconButton} ${size.button}`}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4">
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 10h18M8 3v4M16 3v4" />
          </svg>
        </button>
      </div>
      {showHelper && (
        <p id={`${id}-help`} className="text-sm text-neutral-600">
          {config.helperTextContent}
        </p>
      )}
      <p id={`${id}-error`} role="alert" className="text-sm text-red-700 empty:hidden">
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
        className="fixed inset-auto m-0 rounded-(--dp-radius) border border-neutral-300 bg-white p-0 text-neutral-900 shadow-lg backdrop:bg-black/10"
      >
        {open && (
          <div className="p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => setFocused(addMonths(focused, -1))}
                className={navButton}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <h2 id={`${id}-month`} aria-live="polite" className="font-semibold">
                {focused.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </h2>
              <button
                type="button"
                aria-label="Next month"
                onClick={() => setFocused(addMonths(focused, 1))}
                className={navButton}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>
            <table
              ref={gridRef}
              role="grid"
              aria-labelledby={`${id}-month`}
              onKeyDown={onGridKeyDown}
              className="border-collapse"
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
                        className="h-8 text-xs font-medium text-neutral-600"
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
                      const isToday = sameDay(date, today());
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
                          onClick={() => select(date)}
                          className={`rounded-(--dp-radius) text-center tabular-nums ${focusRing} ${size.cell} ${
                            isEnd
                              ? "cursor-pointer bg-(--dp-accent) font-semibold text-(--dp-on-accent)"
                              : inRange
                                ? "cursor-pointer bg-(--dp-accent)/15"
                                : disabled
                                  ? "cursor-not-allowed text-neutral-400"
                                  : "cursor-pointer hover:bg-neutral-100"
                          } ${isToday ? "font-semibold underline" : ""}`}
                        >
                          {date.getDate()}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <p aria-live="polite" className="mt-2 min-h-5 text-sm text-neutral-700">
              {rangeStart ? "Now choose the end date." : ""}
            </p>
            {config.todayButton && (
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => moveTo(today())}
                  className={`cursor-pointer rounded-(--dp-radius) border border-neutral-500 px-3 py-1 text-sm hover:bg-neutral-100 ${focusRing}`}
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
