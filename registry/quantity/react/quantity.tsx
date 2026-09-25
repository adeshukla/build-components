"use client";

import { useId, useState, useSyncExternalStore, type CSSProperties } from "react";

export type QuantityConfig = {
  label: string;
  hint: string;
  start: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  name: string;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: QuantityConfig = {
  label: "Quantity",
  hint: "",
  start: 1,
  min: 1,
  max: 10,
  step: 1,
  unit: "",
  name: "quantity",
  theme: "light",
  accentColor: "#2563eb",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", muted: "#4d4a57", border: "#737373", hover: "#eeecf5" },
  dark: { surface: "#141019", text: "#f6f5fa", muted: "#b6b3c2", border: "#8e8a99", hover: "#2a2438" },
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

export function Quantity({ config = defaultConfig }: { config?: QuantityConfig }) {
  const id = useId();
  const min = config.min;
  const max = Math.max(min, config.max);
  const step = Math.max(1, config.step);
  const clamp = (value: number) => Math.min(max, Math.max(min, value));
  const [value, setValue] = useState(clamp(config.start));
  const [message, setMessage] = useState("");
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--qt-accent": config.accentColor,
    "--qt-accent-text": readableAccent(config.accentColor, dark),
    "--qt-surface": palette.surface,
    "--qt-text": palette.text,
    "--qt-muted": palette.muted,
    "--qt-border": palette.border,
    "--qt-hover": palette.hover,
  } as CSSProperties;
  const unit = config.unit.trim();
  const say = (amount: number) => `${amount}${unit ? ` ${unit}` : ""}`;

  function nudge(by: number) {
    const next = clamp(value + by);
    if (next === value) {
      setMessage(`${say(value)}. That is the ${by > 0 ? "most" : "fewest"} you can have.`);
      return;
    }
    setValue(next);
    setMessage(say(next));
  }

  const button =
    "grid size-11 shrink-0 cursor-pointer place-items-center text-(--qt-text) hover:bg-(--qt-hover) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--qt-accent-text) aria-disabled:cursor-default aria-disabled:text-(--qt-muted) aria-disabled:hover:bg-transparent";

  return (
    <div style={style} className="bg-(--qt-surface) text-(--qt-text)">
      <label htmlFor={`${id}-input`} className="block font-medium">
        {config.label}
        {unit !== "" && <span className="text-(--qt-muted)"> ({unit})</span>}
      </label>
      {config.hint.trim() !== "" && (
        <p id={`${id}-hint`} className="text-sm text-(--qt-muted)">
          {config.hint}
        </p>
      )}
      <div className="mt-2 inline-flex items-stretch overflow-hidden rounded-lg border border-(--qt-border)">
        <button
          type="button"
          aria-label={`Fewer ${config.label.toLowerCase()}`}
          aria-disabled={value <= min || undefined}
          onClick={() => nudge(-step)}
          className={button}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4">
            <path d="M5 12h14" />
          </svg>
        </button>
        {/* A real number input: people can type a quantity instead of pressing minus eleven times. */}
        <input
          id={`${id}-input`}
          type="number"
          inputMode="numeric"
          name={config.name || undefined}
          value={value}
          min={min}
          max={max}
          step={step}
          aria-describedby={config.hint.trim() !== "" ? `${id}-hint` : undefined}
          onChange={(event) => setValue(Number(event.target.value))}
          onBlur={(event) => {
            const typed = Number(event.target.value);
            const next = clamp(Number.isFinite(typed) ? typed : min);
            setValue(next);
            if (next !== typed) setMessage(`${say(next)}. Between ${min} and ${max} is allowed.`);
          }}
          className="w-16 border-x border-(--qt-border) bg-(--qt-surface) text-center tabular-nums outline-none [appearance:textfield] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--qt-accent-text) [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="button"
          aria-label={`More ${config.label.toLowerCase()}`}
          aria-disabled={value >= max || undefined}
          onClick={() => nudge(step)}
          className={button}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
      <p role="status" className="sr-only">
        {message}
      </p>
    </div>
  );
}
