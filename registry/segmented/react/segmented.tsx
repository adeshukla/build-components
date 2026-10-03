"use client";

import { useId, useState, useSyncExternalStore, type CSSProperties } from "react";

export type SegmentedConfig = {
  legend: string;
  hideLegend: boolean;
  options: { label: string }[];
  startIndex: number;
  size: "sm" | "md";
  fullWidth: boolean;
  name: string;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: SegmentedConfig = {
  legend: "View",
  hideLegend: false,
  options: [{ label: "List" }, { label: "Board" }, { label: "Calendar" }],
  startIndex: 0,
  size: "md",
  fullWidth: false,
  name: "view",
  theme: "light",
  accentColor: "#25154d",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#d9d5e4" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#3a3448" },
};
const sizes = { sm: "min-h-8 px-3 text-sm", md: "min-h-10 px-4" };

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

export function Segmented({ config = defaultConfig }: { config?: SegmentedConfig }) {
  const id = useId();
  const options = config.options.map((option) => option.label).filter((label) => label.trim() !== "");
  const [picked, setPicked] = useState(Math.min(Math.max(0, Math.round(config.startIndex)), Math.max(0, options.length - 1)));
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const accentLuminance = luminance(config.accentColor);
  const style = {
    "--sg-accent": config.accentColor,
    "--sg-accent-text": readableAccent(config.accentColor, dark),
    "--sg-on-accent": accentLuminance > 0.179 ? "#000000" : "#ffffff",
    "--sg-surface": `var(--bc-${dark ? "dark" : "light"}-surface, ${palette.surface})`,
    "--sg-sunk": `var(--bc-${dark ? "dark" : "light"}-sunk, ${palette.sunk})`,
    "--sg-text": `var(--bc-${dark ? "dark" : "light"}-text, ${palette.text})`,
    "--sg-muted": `var(--bc-${dark ? "dark" : "light"}-muted, ${palette.muted})`,
    "--sg-line": `var(--bc-${dark ? "dark" : "light"}-line, ${palette.line})`,
  } as CSSProperties;

  return (
    // Real radios: one Tab stop for the group, arrow keys between the choices, and the browser
    // submits the picked one with the form.
    <fieldset style={style} className="min-w-0 bg-(--sg-surface) text-(--sg-text)">
      <legend className={config.hideLegend ? "sr-only" : "font-medium"}>{config.legend}</legend>
      <div
        className={`mt-2 inline-flex gap-0.5 rounded-[var(--bc-radius-md,0.5rem)] border border-(--sg-line) bg-(--sg-sunk) p-0.5 ${config.fullWidth ? "flex w-full" : ""}`}
      >
        {options.map((label, index) => (
          <label key={`${label}-${index}`} className={`relative min-w-0 cursor-pointer ${config.fullWidth ? "flex-1" : ""}`}>
            <input
              type="radio"
              name={config.name || `${id}-segmented`}
              value={label}
              checked={picked === index}
              onChange={() => setPicked(index)}
              className="peer sr-only"
            />
            <span
              className={`flex items-center justify-center truncate rounded-[var(--bc-radius-button,0.375rem)] font-medium text-(--sg-muted) transition-colors peer-checked:bg-(--sg-accent) peer-checked:text-(--sg-on-accent) peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-(--sg-accent-text) hover:text-(--sg-text) motion-reduce:transition-none ${sizes[config.size]}`}
            >
              {label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
