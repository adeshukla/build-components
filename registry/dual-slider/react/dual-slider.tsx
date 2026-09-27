"use client";

import { useId, useState, useSyncExternalStore, type CSSProperties } from "react";

export type DualSliderConfig = {
  legend: string;
  hint: string;
  lowLabel: string;
  highLabel: string;
  name: string;
  min: number;
  max: number;
  step: number;
  minGap: number;
  startLow: number;
  startHigh: number;
  valuePrefix: string;
  valueSuffix: string;
  showBar: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: DualSliderConfig = {
  legend: "Price range",
  hint: "Two sliders, one for each end. They cannot cross.",
  lowLabel: "Lowest price",
  highLabel: "Highest price",
  name: "price",
  min: 0,
  max: 500,
  step: 10,
  minGap: 20,
  startLow: 80,
  startHigh: 320,
  valuePrefix: "£",
  valueSuffix: "",
  showBar: true,
  theme: "light",
  accentColor: "#7c3aed",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#eae7f2", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#141019", sunk: "#2c2639", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
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

/** Grouped by hand: Intl.NumberFormat gives the server and the browser different strings. */
export function group(value: number) {
  const [whole, fraction] = Math.abs(value).toString().split(".");
  const spaced = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${value < 0 ? "-" : ""}${spaced}${fraction ? `.${fraction}` : ""}`;
}

export function DualSlider({ config = defaultConfig }: { config?: DualSliderConfig }) {
  const id = useId();
  const [low, setLow] = useState(config.startLow);
  const [high, setHigh] = useState(config.startHigh);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--dsl-accent": config.accentColor,
    "--dsl-accent-text": readableAccent(config.accentColor, dark),
    "--dsl-surface": palette.surface,
    "--dsl-sunk": palette.sunk,
    "--dsl-text": palette.text,
    "--dsl-muted": palette.muted,
    "--dsl-line": palette.line,
  } as CSSProperties;

  const say = (value: number) => `${config.valuePrefix}${group(value)}${config.valueSuffix}`;
  const span = config.max - config.min || 1;
  const leftPercent = ((low - config.min) / span) * 100;
  const rightPercent = ((high - config.min) / span) * 100;

  // The two ends clamp each other rather than swapping, so the thumb under the pointer keeps its meaning.
  const setLowClamped = (value: number) => setLow(Math.min(value, high - config.minGap));
  const setHighClamped = (value: number) => setHigh(Math.max(value, low + config.minGap));

  const track =
    "mt-2 h-11 w-full accent-(--dsl-accent) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--dsl-accent-text)";

  return (
    <div style={style} className="bg-(--dsl-surface) text-(--dsl-text)">
      <fieldset className="m-0 border-0 p-0">
        <legend className="p-0 font-medium">{config.legend}</legend>
        {config.hint.trim() !== "" && (
          <p id={`${id}-hint`} className="mt-1 text-sm text-(--dsl-muted)">
            {config.hint}
          </p>
        )}

        {config.showBar && (
          // A picture of the numbers the sliders already carry, so it is hidden from screen readers.
          <div aria-hidden="true" className="mt-4 h-2 w-full rounded-full bg-(--dsl-sunk)">
            <div
              className="h-2 rounded-full bg-(--dsl-accent)"
              style={{ marginLeft: `${leftPercent}%`, width: `${Math.max(rightPercent - leftPercent, 1)}%` }}
            />
          </div>
        )}

        <div className="mt-3">
          <label htmlFor={`${id}-low`} className="flex justify-between text-sm font-medium">
            <span>{config.lowLabel}</span>
            <span className="font-mono">{say(low)}</span>
          </label>
          <input
            id={`${id}-low`}
            name={`${config.name}Min`}
            type="range"
            min={config.min}
            max={config.max}
            step={config.step}
            value={low}
            aria-describedby={config.hint.trim() === "" ? undefined : `${id}-hint`}
            aria-valuetext={say(low)}
            onChange={(event) => setLowClamped(Number(event.target.value))}
            className={track}
          />
        </div>

        <div>
          <label htmlFor={`${id}-high`} className="flex justify-between text-sm font-medium">
            <span>{config.highLabel}</span>
            <span className="font-mono">{say(high)}</span>
          </label>
          <input
            id={`${id}-high`}
            name={`${config.name}Max`}
            type="range"
            min={config.min}
            max={config.max}
            step={config.step}
            value={high}
            aria-valuetext={say(high)}
            onChange={(event) => setHighClamped(Number(event.target.value))}
            className={track}
          />
        </div>

        <p role="status" className="mt-2 text-sm text-(--dsl-muted)">
          {say(low)} to {say(high)}
        </p>
      </fieldset>
    </div>
  );
}
