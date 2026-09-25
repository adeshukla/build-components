"use client";

import { useId, useState, useSyncExternalStore, type CSSProperties } from "react";

export type RatingConfig = {
  label: string;
  mode: "pick" | "show";
  max: number;
  value: number;
  showValue: boolean;
  countText: string;
  name: string;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: RatingConfig = {
  label: "Rate this part",
  mode: "pick",
  max: 5,
  value: 4,
  showValue: true,
  countText: "",
  name: "rating",
  theme: "light",
  accentColor: "#e6a700",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", muted: "#4d4a57", empty: "#c9c5d4" },
  dark: { surface: "#141019", text: "#f6f5fa", muted: "#b6b3c2", empty: "#4a4458" },
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

/** Written by hand, never by locale, so the server and the browser always agree. */
function show(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function Star({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className={`size-7 ${className}`}>
      <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z" />
    </svg>
  );
}

export function Rating({ config = defaultConfig }: { config?: RatingConfig }) {
  const id = useId();
  const max = Math.max(2, Math.min(10, Math.round(config.max)));
  const [picked, setPicked] = useState(Math.min(max, Math.max(0, Math.round(config.value))));
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--ra-accent": config.accentColor,
    "--ra-accent-text": readableAccent(config.accentColor, dark),
    "--ra-surface": palette.surface,
    "--ra-text": palette.text,
    "--ra-muted": palette.muted,
    "--ra-empty": palette.empty,
  } as CSSProperties;
  const stars = Array.from({ length: max }, (_, index) => index + 1);
  const count = config.countText.trim();

  // Showing an average: one image with the whole thing in its name. Part stars are drawn by
  // clipping the filled row, so 4.2 looks like 4.2 instead of rounding to 4.
  if (config.mode === "show") {
    const value = Math.min(max, Math.max(0, config.value));
    return (
      <div style={style} className="bg-(--ra-surface) text-(--ra-text)">
        <div className="flex flex-wrap items-center gap-2">
          <span role="img" aria-label={`${show(value)} out of ${max}`} className="relative inline-flex">
            <span aria-hidden="true" className="flex text-(--ra-empty)">
              {stars.map((star) => (
                <Star key={star} />
              ))}
            </span>
            <span
              aria-hidden="true"
              style={{ width: `${(value / max) * 100}%` }}
              className="absolute inset-y-0 left-0 flex overflow-hidden text-(--ra-accent)"
            >
              {stars.map((star) => (
                <Star key={star} className="shrink-0" />
              ))}
            </span>
          </span>
          {config.showValue && (
            <span className="font-medium tabular-nums">
              {show(value)} <span className="text-(--ra-muted)">out of {max}</span>
            </span>
          )}
          {count !== "" && <span className="text-sm text-(--ra-muted)">{count}</span>}
        </div>
      </div>
    );
  }

  // Picking a rating: real radios, so arrow keys, the label and form submission come from the
  // browser, and each star says what it means.
  return (
    <div style={style} className="bg-(--ra-surface) text-(--ra-text)">
      <fieldset>
        <legend className="font-medium">{config.label}</legend>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <div className="flex">
            {stars.map((star) => (
              <label key={star} className="cursor-pointer p-0.5">
                <input
                  type="radio"
                  name={config.name || `${id}-rating`}
                  value={star}
                  checked={picked === star}
                  onChange={() => setPicked(star)}
                  className="peer sr-only"
                />
                <span className="sr-only">{star === 1 ? "1 star" : `${star} stars`}</span>
                <Star
                  className={`transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-(--ra-accent-text) motion-reduce:transition-none ${star <= picked ? "text-(--ra-accent)" : "text-(--ra-empty)"}`}
                />
              </label>
            ))}
          </div>
          {config.showValue && (
            <output className="text-sm font-medium tabular-nums">
              {picked === 0 ? "Not rated yet" : `${picked} out of ${max}`}
            </output>
          )}
          {count !== "" && <span className="text-sm text-(--ra-muted)">{count}</span>}
        </div>
      </fieldset>
    </div>
  );
}
