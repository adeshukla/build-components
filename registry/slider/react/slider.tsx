"use client";

import { useState, useSyncExternalStore, type CSSProperties } from "react";

export type SliderConfig = {
  label: string;
  hint: string;
  mode: "single" | "range";
  min: number;
  max: number;
  step: number;
  startValue: number;
  startLower: number;
  startUpper: number;
  prefix: string;
  suffix: string;
  showValue: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: SliderConfig = {
  label: "Budget",
  hint: "Drag either end, or use the arrow keys.",
  mode: "range",
  min: 0,
  max: 200,
  step: 10,
  startValue: 80,
  startLower: 40,
  startUpper: 140,
  prefix: "£",
  suffix: "",
  showValue: true,
  theme: "light",
  accentColor: "#2563eb",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", track: "#d9d5e4", text: "#16121f", muted: "#4d4a57" },
  dark: { surface: "#141019", track: "#3a3448", text: "#f6f5fa", muted: "#b6b3c2" },
};

const darkMedia = {
  subscribe: (onChange: () => void) => {
    const list = window.matchMedia("(prefers-color-scheme: dark)");
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  },
  get: () => window.matchMedia("(prefers-color-scheme: dark)").matches,
};

// WCAG relative luminance, used to keep the accent readable as text.
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

export function Slider({ config = defaultConfig }: { config?: SliderConfig }) {
  const min = config.min;
  const max = Math.max(config.min + config.step, config.max);
  const clamp = (value: number) => Math.min(max, Math.max(min, value));
  const [value, setValue] = useState(clamp(config.startValue));
  const [lower, setLower] = useState(clamp(config.startLower));
  const [upper, setUpper] = useState(clamp(config.startUpper));
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;

  /** Written by hand, not by locale, so the server and the browser always agree. */
  const show = (amount: number) => `${config.prefix}${amount}${config.suffix}`;
  const percent = (amount: number) => ((amount - min) / (max - min)) * 100;

  const style = {
    "--sl-accent": config.accentColor,
    "--sl-accent-text": readableAccent(config.accentColor, dark),
    "--sl-surface": palette.surface,
    "--sl-track": palette.track,
    "--sl-text": palette.text,
    "--sl-muted": palette.muted,
    "--sl-from": `${percent(config.mode === "range" ? lower : min)}%`,
    "--sl-to": `${percent(config.mode === "range" ? upper : value)}%`,
  } as CSSProperties;

  // The native range input brings its own keyboard, its own announcements and its own value.
  const thumb =
    "[&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-(--sl-surface) [&::-webkit-slider-thumb]:bg-(--sl-accent) [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-(--sl-accent)";
  const input = `h-6 w-full appearance-none bg-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--sl-accent-text) ${thumb}`;
  // Two sliders stacked on one track: only the thumbs take the pointer, or the top one would
  // swallow every click meant for the other.
  const stacked = `${input} pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto`;

  return (
    <div style={style} className="bg-(--sl-surface) text-(--sl-text)">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p id="slider-label" className="font-medium">
          {config.label}
        </p>
        {config.showValue && (
          <output aria-live="polite" className="font-medium tabular-nums">
            {config.mode === "range" ? `${show(lower)} – ${show(upper)}` : show(value)}
          </output>
        )}
      </div>
      {config.hint.trim() !== "" && (
        <p id="slider-hint" className="mt-0.5 text-sm text-(--sl-muted)">
          {config.hint}
        </p>
      )}

      {config.mode === "single" ? (
        <div className="relative mt-3">
          <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-(--sl-track)" />
          <span
            aria-hidden="true"
            className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-(--sl-accent)"
            style={{ left: 0, right: `calc(100% - var(--sl-to))` }}
          />
          <input
            type="range"
            min={min}
            max={max}
            step={config.step}
            value={value}
            aria-labelledby="slider-label"
            aria-describedby={config.hint.trim() !== "" ? "slider-hint" : undefined}
            aria-valuetext={show(value)}
            onChange={(event) => setValue(Number(event.target.value))}
            className={`relative ${input}`}
          />
        </div>
      ) : (
        <div className="relative mt-3 h-6">
          <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-(--sl-track)" />
          <span
            aria-hidden="true"
            className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-(--sl-accent)"
            style={{ left: "var(--sl-from)", right: `calc(100% - var(--sl-to))` }}
          />
          {/* Two real inputs, one per end: each keeps its own keyboard and its own announcement. */}
          <input
            type="range"
            min={min}
            max={max}
            step={config.step}
            value={lower}
            aria-label={`${config.label}, lowest`}
            aria-describedby={config.hint.trim() !== "" ? "slider-hint" : undefined}
            aria-valuetext={show(lower)}
            onChange={(event) => setLower(Math.min(Number(event.target.value), upper))}
            className={`absolute inset-0 ${stacked}`}
          />
          <input
            type="range"
            min={min}
            max={max}
            step={config.step}
            value={upper}
            aria-label={`${config.label}, highest`}
            aria-valuetext={show(upper)}
            onChange={(event) => setUpper(Math.max(Number(event.target.value), lower))}
            className={`absolute inset-0 ${stacked}`}
          />
        </div>
      )}

      <div aria-hidden="true" className="mt-1 flex justify-between text-sm text-(--sl-muted)">
        <span>{show(min)}</span>
        <span>{show(max)}</span>
      </div>
    </div>
  );
}
