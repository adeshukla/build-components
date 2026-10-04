"use client";

import { useId, useState, useSyncExternalStore, type CSSProperties } from "react";

export type TimeRangeConfig = {
  legend: string;
  hint: string;
  fromLabel: string;
  toLabel: string;
  name: string;
  earliest: string;
  latest: string;
  stepMinutes: number;
  required: boolean;
  allowOvernight: boolean;
  showLength: boolean;
  orderErrorText: string;
  theme: "light" | "dark" | "system";
  accentColor: string;
  hourOneText: string;
  hoursText: string;
  minuteOneText: string;
  minutesText: string;
  noTimeText: string;
  nextDayText: string;
};

// @config-start
const defaultConfig: TimeRangeConfig = {
  legend: "When are you open?",
  hint: "Use the 24-hour clock or your device's own time picker.",
  fromLabel: "Opens",
  toLabel: "Closes",
  name: "hours",
  earliest: "06:00",
  latest: "23:30",
  stepMinutes: 30,
  required: false,
  allowOvernight: false,
  showLength: true,
  orderErrorText: "Closing time must be after opening time.",
  theme: "light",
  accentColor: "#1d4ed8",
  hourOneText: "{count} hour",
  hoursText: "{count} hours",
  minuteOneText: "{count} minute",
  minutesText: "{count} minutes",
  noTimeText: "no time at all",
  nextDayText: "{length}, finishing the next day",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6", error: "#b42318" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459", error: "#ff9d95" },
};

// Follows the system, unless the page has a light/dark choice of its own: <html data-bc-scheme> (D87).
const darkMedia = {
  subscribe: (onChange: () => void) => {
    const list = window.matchMedia("(prefers-color-scheme: dark)");
    const chosen = new MutationObserver(onChange);
    list.addEventListener("change", onChange);
    chosen.observe(document.documentElement, { attributes: true, attributeFilter: ["data-bc-scheme"] });
    return () => {
      list.removeEventListener("change", onChange);
      chosen.disconnect();
    };
  },
  get: () => {
    const chosen = document.documentElement.dataset.bcScheme;
    return chosen ? chosen === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  },
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

const toMinutes = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

/** "3 hours 30 minutes", spelled out rather than shown as 3:30, which reads as a time of day. */
export function sayLength(minutes: number, words: TimeRangeConfig) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const parts = [];
  if (hours > 0) parts.push(fill(hours === 1 ? words.hourOneText : words.hoursText, { count: hours }));
  if (rest > 0) parts.push(fill(rest === 1 ? words.minuteOneText : words.minutesText, { count: rest }));
  return parts.length === 0 ? words.noTimeText : parts.join(" ");
}

/** Words with something put in them: "{count} left" (D94). */
const fill = (words: string, values: Record<string, string | number>) => words.replace(/\{(\w+)\}/g, (match, name) => String(values[name] ?? match));

export function TimeRange({ config = defaultConfig }: { config?: TimeRangeConfig }) {
  const id = useId();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--tmr-accent": config.accentColor,
    "--tmr-accent-text": readableAccent(config.accentColor, dark),
    "--tmr-surface": `var(--bc-${dark ? "dark" : "light"}-surface, ${palette.surface})`,
    "--tmr-sunk": `var(--bc-${dark ? "dark" : "light"}-sunk, ${palette.sunk})`,
    "--tmr-text": `var(--bc-${dark ? "dark" : "light"}-text, ${palette.text})`,
    "--tmr-muted": `var(--bc-${dark ? "dark" : "light"}-muted, ${palette.muted})`,
    "--tmr-line": `var(--bc-${dark ? "dark" : "light"}-line, ${palette.line})`,
    "--tmr-error": palette.error,
  } as CSSProperties;

  const both = from !== "" && to !== "";
  const gap = both ? toMinutes(to) - toMinutes(from) : 0;
  // An overnight shift is a real answer, not a mistake — but only when the component is told so.
  const outOfOrder = both && gap <= 0 && !config.allowOvernight;
  const length = both && !outOfOrder ? (gap <= 0 ? gap + 24 * 60 : gap) : null;

  const field =
    "mt-2 min-h-11 w-full rounded-[var(--bc-radius-sm,0.375rem)] border bg-(--tmr-sunk) px-3 text-(--tmr-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--tmr-accent-text)";

  return (
    <div style={style} className="bg-(--tmr-surface) text-(--tmr-text)">
      <fieldset className="m-0 border-0 p-0">
        <legend className="p-0 font-medium">{config.legend}</legend>
        {config.hint.trim() !== "" && (
          <p id={`${id}-hint`} className="mt-1 text-sm text-(--tmr-muted)">
            {config.hint}
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-4">
          <div className="min-w-36 flex-1">
            <label htmlFor={`${id}-from`} className="block text-sm font-medium">
              {config.fromLabel}
            </label>
            <input
              id={`${id}-from`}
              name={`${config.name}From`}
              type="time"
              value={from}
              required={config.required}
              min={config.earliest === "" ? undefined : config.earliest}
              max={config.latest === "" ? undefined : config.latest}
              step={config.stepMinutes * 60}
              aria-describedby={config.hint.trim() === "" ? undefined : `${id}-hint`}
              onChange={(event) => setFrom(event.target.value)}
              className={`${field} border-(--tmr-line)`}
            />
          </div>
          <div className="min-w-36 flex-1">
            <label htmlFor={`${id}-to`} className="block text-sm font-medium">
              {config.toLabel}
            </label>
            <input
              id={`${id}-to`}
              name={`${config.name}To`}
              type="time"
              value={to}
              required={config.required}
              min={config.earliest === "" ? undefined : config.earliest}
              max={config.latest === "" ? undefined : config.latest}
              step={config.stepMinutes * 60}
              aria-invalid={outOfOrder ? true : undefined}
              aria-describedby={outOfOrder ? `${id}-error` : undefined}
              onChange={(event) => setTo(event.target.value)}
              className={`${field} ${outOfOrder ? "border-(--tmr-error)" : "border-(--tmr-line)"}`}
            />
          </div>
        </div>

        {outOfOrder && (
          <p id={`${id}-error`} role="alert" className="mt-2 text-sm text-(--tmr-error)">
            {config.orderErrorText}
          </p>
        )}

        {config.showLength && (
          <p role="status" className="mt-3 text-sm text-(--tmr-muted)">
            {length === null ? "" : gap <= 0 ? fill(config.nextDayText, { length: sayLength(length, config) }) : sayLength(length, config)}
          </p>
        )}
      </fieldset>
    </div>
  );
}
