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

export type TimePickerConfig = {
  label: string;
  hint: string;
  format: "24h" | "12h";
  interval: "5" | "10" | "15" | "30" | "60";
  earliest: string;
  latest: string;
  startValue: string;
  name: string;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: TimePickerConfig = {
  label: "Start time",
  hint: "Type a time, or pick one from the list.",
  format: "24h",
  interval: "30",
  earliest: "08:00",
  latest: "18:00",
  startValue: "",
  name: "start-time",
  theme: "light",
  accentColor: "#2563eb",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", muted: "#4d4a57", border: "#737373", line: "#d9d5e4", hover: "#eeecf5", error: "#b3261e" },
  dark: { surface: "#141019", text: "#f6f5fa", muted: "#b6b3c2", border: "#8e8a99", line: "#3a3448", hover: "#2a2438", error: "#ff6b6b" },
};

const darkMedia = {
  subscribe: (onChange: () => void) => {
    const list = window.matchMedia("(prefers-color-scheme: dark)");
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  },
  get: () => window.matchMedia("(prefers-color-scheme: dark)").matches,
};

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Darkens or lightens the accent until it clears 4.5:1 against the surface it sits on. */
function readableAccent(hex: string, onDark: boolean) {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const surface = onDark ? 0.02 : 1;
  for (let step = 0; step <= 20; step++) {
    const shifted = channels.map((c) => Math.round(onDark ? c + (255 - c) * (step / 20) : c * (1 - step / 20)));
    const value = `#${shifted.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
    const l = luminance(value);
    const contrast = (Math.max(l, surface) + 0.05) / (Math.min(l, surface) + 0.05);
    if (contrast >= 4.5) return value;
  }
  return onDark ? "#ffffff" : "#000000";
}

/** Minutes after midnight from what someone typed: "14:30", "1430", "9", "2:30 pm", "2pm". */
function parseTime(raw: string): number | null {
  const match = raw.trim().toLowerCase().replace(/[\s.]/g, "").match(/^(\d{1,2})(?::?(\d{2}))?(am|pm|a|p)?$/);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2] ?? 0);
  const half = match[3]?.[0];
  if (minutes > 59) return null;
  if (half) {
    if (hours < 1 || hours > 12) return null;
    hours = (hours % 12) + (half === "p" ? 12 : 0);
  } else if (hours > 23) {
    return null;
  }
  return hours * 60 + minutes;
}

/** Written by hand, never by locale, so the server and the browser always agree. */
function formatTime(total: number, format: "24h" | "12h") {
  const hours = Math.floor(total / 60);
  const minutes = String(total % 60).padStart(2, "0");
  if (format === "24h") return `${String(hours).padStart(2, "0")}:${minutes}`;
  return `${hours % 12 || 12}:${minutes} ${hours < 12 ? "am" : "pm"}`;
}

const squash = (value: string) => value.toLowerCase().replace(/[^0-9a-z]/g, "");

export function TimePicker({ config = defaultConfig }: { config?: TimePickerConfig }) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const earliest = parseTime(config.earliest) ?? 0;
  const latest = Math.max(earliest, parseTime(config.latest) ?? 23 * 60 + 59);
  const step = Number(config.interval) || 30;
  const slots: number[] = [];
  for (let time = earliest; time <= latest; time += step) slots.push(time);

  const start = parseTime(config.startValue);
  const startValue = start !== null && start >= earliest && start <= latest ? start : null;
  const [value, setValue] = useState<number | null>(startValue);
  const [text, setText] = useState(startValue === null ? "" : formatTime(startValue, config.format));
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [error, setError] = useState("");

  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const accentLuminance = luminance(config.accentColor);
  const style = {
    "--tp-accent": config.accentColor,
    "--tp-accent-text": readableAccent(config.accentColor, dark),
    "--tp-on-accent": accentLuminance > 0.179 ? "#000000" : "#ffffff",
    "--tp-surface": palette.surface,
    "--tp-text": palette.text,
    "--tp-muted": palette.muted,
    "--tp-border": palette.border,
    "--tp-line": palette.line,
    "--tp-hover": palette.hover,
    "--tp-error": palette.error,
  } as CSSProperties;

  // Typing filters the list: "9" or "93" leads to 9:30, "14" to 14:00. The chosen time's own text
  // shows the whole list again.
  const typed = value !== null && text === formatTime(value, config.format) ? "" : squash(text);
  const matches = typed
    ? slots.filter((slot) => {
        const label = squash(formatTime(slot, config.format));
        return label.startsWith(typed) || label.replace(/^0/, "").startsWith(typed);
      })
    : slots;
  const expanded = open && matches.length > 0;
  const example = config.format === "24h" ? "14:30" : "2:30 pm";
  const hasHint = config.hint.trim() !== "";
  const describedBy = [`${id}-format`, hasHint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ");

  useEffect(() => {
    if (active < 0) return;
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  /** Opening lands on the chosen time, or the first one after it, so the list starts where you are. */
  function openList() {
    setOpen(true);
    if (value === null || typed) return;
    const at = matches.findIndex((slot) => slot >= value);
    setActive(at < 0 ? matches.length - 1 : at);
  }

  function choose(time: number) {
    setValue(time);
    setText(formatTime(time, config.format));
    setError("");
    setOpen(false);
    setActive(-1);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        openList();
        return;
      }
      if (event.altKey || matches.length === 0) return;
      const count = matches.length;
      setActive((current) =>
        event.key === "ArrowDown" ? (current + 1) % count : current <= 0 ? count - 1 : current - 1,
      );
    } else if (event.key === "Enter") {
      if (expanded && active >= 0) {
        event.preventDefault();
        choose(matches[active]);
      }
    } else if (event.key === "Escape") {
      if (expanded) {
        event.preventDefault();
        setOpen(false);
        setActive(-1);
      }
    } else if (event.key === "Tab") {
      setOpen(false);
      setActive(-1);
    }
  }

  /** Anything typed that reads as a time is kept, even between the listed slots. */
  function onBlur() {
    setOpen(false);
    setActive(-1);
    const raw = (inputRef.current?.value ?? text).trim();
    if (raw === "") {
      setValue(null);
      setError("");
      return;
    }
    const time = parseTime(raw);
    if (time === null) {
      setValue(null);
      setError(`Enter a time like ${example}.`);
    } else if (time < earliest || time > latest) {
      setValue(null);
      setError(`Choose a time between ${formatTime(earliest, config.format)} and ${formatTime(latest, config.format)}.`);
    } else {
      choose(time);
    }
  }

  return (
    <div style={style} className="flex flex-col gap-1.5 bg-(--tp-surface) text-(--tp-text)">
      <label id={`${id}-label`} htmlFor={`${id}-input`} className="font-medium">
        {config.label}
      </label>
      {hasHint && (
        <p id={`${id}-hint`} className="-mt-1 text-sm text-(--tp-muted)">
          {config.hint}
        </p>
      )}
      <div className="relative w-full max-w-xs">
        <div
          className={`flex h-10 items-stretch overflow-hidden rounded-lg border bg-(--tp-surface) has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-(--tp-accent-text) ${error ? "border-(--tp-error)" : "border-(--tp-border)"}`}
        >
          <input
            ref={inputRef}
            id={`${id}-input`}
            type="text"
            role="combobox"
            inputMode="text"
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={expanded}
            aria-controls={`${id}-listbox`}
            aria-activedescendant={expanded && active >= 0 ? `${id}-option-${active}` : undefined}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            placeholder={config.format === "24h" ? "hh:mm" : "h:mm am"}
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setOpen(true);
              setActive(0);
              setError("");
            }}
            onClick={openList}
            onKeyDown={onKeyDown}
            onBlur={onBlur}
            className="min-w-0 flex-1 bg-transparent px-3 tabular-nums outline-none placeholder:text-(--tp-muted)"
          />
          <button
            type="button"
            tabIndex={-1}
            aria-label={`Show ${config.label.toLowerCase() || "time"} options`}
            aria-expanded={expanded}
            aria-controls={`${id}-listbox`}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              if (open) setOpen(false);
              else openList();
              inputRef.current?.focus();
            }}
            className="grid w-10 shrink-0 cursor-pointer place-items-center text-(--tp-muted) hover:bg-(--tp-hover)"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-5">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
          </button>
        </div>
        <span id={`${id}-format`} className="sr-only">
          {`Format: ${config.format === "24h" ? "24-hour, for example 14:30" : "12-hour, for example 2:30 pm"}.`}
        </span>

        <ul
          ref={listRef}
          id={`${id}-listbox`}
          role="listbox"
          aria-labelledby={`${id}-label`}
          hidden={!expanded}
          className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-(--tp-line) bg-(--tp-surface) p-1 shadow-lg"
        >
          {expanded &&
            matches.map((slot, index) => (
              <li
                key={slot}
                id={`${id}-option-${index}`}
                data-index={index}
                role="option"
                aria-selected={slot === value}
                onMouseDown={(event) => event.preventDefault()}
                onMouseMove={() => {
                  if (active !== index) setActive(index);
                }}
                onClick={() => choose(slot)}
                className={`flex min-h-9 cursor-pointer items-center justify-between rounded-md px-3 text-sm tabular-nums ${index === active ? "bg-(--tp-accent) text-(--tp-on-accent)" : "hover:bg-(--tp-hover)"}`}
              >
                {formatTime(slot, config.format)}
                {slot === value && (
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="size-4">
                    <path d="m5 12 5 5L20 7" />
                  </svg>
                )}
              </li>
            ))}
        </ul>
      </div>
      <p id={`${id}-error`} role="alert" className="text-sm text-(--tp-error) empty:hidden">
        {error}
      </p>
      <p aria-live="polite" className="sr-only">
        {open && typed ? (matches.length ? `${matches.length} ${matches.length === 1 ? "time" : "times"} listed.` : "No listed time matches; you can still type one.") : ""}
      </p>
      {config.name !== "" && <input type="hidden" name={config.name} value={value === null ? "" : formatTime(value, "24h")} />}
    </div>
  );
}
