"use client";

import { useId, useState, useSyncExternalStore, type CSSProperties } from "react";

export type DateRangeConfig = {
  legend: string;
  hint: string;
  fromLabel: string;
  toLabel: string;
  name: string;
  min: string;
  max: string;
  required: boolean;
  showSpan: boolean;
  spanUnit: "nights" | "days";
  orderErrorText: string;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: DateRangeConfig = {
  legend: "When are you staying?",
  hint: "Check-in is from 3pm, check-out by 11am.",
  fromLabel: "Check in",
  toLabel: "Check out",
  name: "stay",
  min: "",
  max: "",
  required: false,
  showSpan: true,
  spanUnit: "nights",
  orderErrorText: "Check-out cannot be before check-in.",
  theme: "light",
  accentColor: "#1d4ed8",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6", error: "#b42318" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459", error: "#ff9d95" },
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

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Formatted by hand: Intl gives the server and the browser different strings. */
export function sayDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

export function daysBetween(from: string, to: string) {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000);
}

export function DateRange({ config = defaultConfig }: { config?: DateRangeConfig }) {
  const id = useId();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--dr-accent": config.accentColor,
    "--dr-accent-text": readableAccent(config.accentColor, dark),
    "--dr-surface": palette.surface,
    "--dr-sunk": palette.sunk,
    "--dr-text": palette.text,
    "--dr-muted": palette.muted,
    "--dr-line": palette.line,
    "--dr-error": palette.error,
  } as CSSProperties;

  // Out of order is the one mistake a pair of date fields makes, so it is checked as you type.
  const outOfOrder = from !== "" && to !== "" && daysBetween(from, to) < 0;
  const span = from !== "" && to !== "" && !outOfOrder ? daysBetween(from, to) : null;
  const nights = config.spanUnit === "nights" ? span : span === null ? null : span + 1;
  const unit = config.spanUnit === "nights" ? "night" : "day";

  const field = `mt-2 min-h-11 w-full rounded-md border bg-(--dr-sunk) px-3 text-(--dr-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--dr-accent-text)`;

  return (
    <div style={style} className="bg-(--dr-surface) text-(--dr-text)">
      <fieldset className="m-0 border-0 p-0">
        <legend className="p-0 font-medium">{config.legend}</legend>
        {config.hint.trim() !== "" && (
          <p id={`${id}-hint`} className="mt-1 text-sm text-(--dr-muted)">
            {config.hint}
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-4">
          <div className="min-w-40 flex-1">
            <label htmlFor={`${id}-from`} className="block text-sm font-medium">
              {config.fromLabel}
            </label>
            <input
              id={`${id}-from`}
              name={`${config.name}From`}
              type="date"
              value={from}
              required={config.required}
              min={config.min === "" ? undefined : config.min}
              max={(to !== "" ? to : config.max) === "" ? undefined : to !== "" ? to : config.max}
              aria-describedby={config.hint.trim() === "" ? undefined : `${id}-hint`}
              onChange={(event) => setFrom(event.target.value)}
              className={`${field} border-(--dr-line)`}
            />
          </div>
          <div className="min-w-40 flex-1">
            <label htmlFor={`${id}-to`} className="block text-sm font-medium">
              {config.toLabel}
            </label>
            <input
              id={`${id}-to`}
              name={`${config.name}To`}
              type="date"
              value={to}
              required={config.required}
              // The earliest end is the start: the browser's own picker then greys out the impossible days.
              min={(from !== "" ? from : config.min) === "" ? undefined : from !== "" ? from : config.min}
              max={config.max === "" ? undefined : config.max}
              aria-invalid={outOfOrder ? true : undefined}
              aria-describedby={outOfOrder ? `${id}-error` : undefined}
              onChange={(event) => setTo(event.target.value)}
              className={`${field} ${outOfOrder ? "border-(--dr-error)" : "border-(--dr-line)"}`}
            />
          </div>
        </div>

        {outOfOrder && (
          <p id={`${id}-error`} role="alert" className="mt-2 text-sm text-(--dr-error)">
            {config.orderErrorText}
          </p>
        )}

        {config.showSpan && (
          <p role="status" className="mt-3 text-sm text-(--dr-muted)">
            {nights === null
              ? ""
              : `${nights} ${nights === 1 ? unit : `${unit}s`}, ${sayDate(from)} to ${sayDate(to)}`}
          </p>
        )}
      </fieldset>
    </div>
  );
}
