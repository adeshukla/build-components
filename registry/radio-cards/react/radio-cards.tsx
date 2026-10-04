"use client";

import { useId, useState, useSyncExternalStore, type CSSProperties } from "react";

export type RadioCardsConfig = {
  legend: string;
  hint: string;
  options: { label: string; note: string; meta: string; state: string }[];
  name: string;
  columns: "one" | "two" | "three";
  showTick: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
  unavailableText: string;
  noneText: string;
  pickedText: string;
};

// @config-start
const defaultConfig: RadioCardsConfig = {
  legend: "How should we deliver it?",
  hint: "Every option is tracked and signed for.",
  options: [
    { label: "Standard", note: "Three to five working days", meta: "Free", state: "on" },
    { label: "Express", note: "Next working day if ordered before 2pm", meta: "£6.50", state: "on" },
    { label: "Saturday", note: "Between 8am and 1pm", meta: "£9.00", state: "on" },
    { label: "Collect in person", note: "From the yard, once we call you", meta: "Free", state: "off" },
  ],
  name: "delivery",
  columns: "two",
  showTick: true,
  theme: "light",
  accentColor: "#0f766e",
  unavailableText: "Not available",
  noneText: "Nothing picked yet",
  pickedText: "{choice} picked",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
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

/** Words with something put in them: "{count} left" (D94). */
const fill = (words: string, values: Record<string, string | number>) => words.replace(/\{(\w+)\}/g, (match, name) => String(values[name] ?? match));

export function RadioCards({ config = defaultConfig }: { config?: RadioCardsConfig }) {
  const id = useId();
  const options = config.options.filter((option) => option.label.trim() !== "");
  const [picked, setPicked] = useState("");
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--rc-accent": config.accentColor,
    "--rc-accent-text": readableAccent(config.accentColor, dark),
    "--rc-surface": `var(--bc-${dark ? "dark" : "light"}-surface, ${palette.surface})`,
    "--rc-sunk": `var(--bc-${dark ? "dark" : "light"}-sunk, ${palette.sunk})`,
    "--rc-text": `var(--bc-${dark ? "dark" : "light"}-text, ${palette.text})`,
    "--rc-muted": `var(--bc-${dark ? "dark" : "light"}-muted, ${palette.muted})`,
    "--rc-line": `var(--bc-${dark ? "dark" : "light"}-line, ${palette.line})`,
  } as CSSProperties;

  const columns = config.columns === "three" ? "sm:grid-cols-3" : config.columns === "two" ? "sm:grid-cols-2" : "";

  return (
    <div style={style} className="bg-(--rc-surface) text-(--rc-text)">
      {/* A card is only paint: the radio inside it is what makes this one choice with one tab stop. */}
      <fieldset className="border-0 p-0" aria-describedby={config.hint.trim() === "" ? undefined : `${id}-hint`}>
        <legend className="font-medium">{config.legend}</legend>
        {config.hint.trim() !== "" && (
          <p id={`${id}-hint`} className="text-sm text-(--rc-muted)">
            {config.hint}
          </p>
        )}

        <div className={`mt-3 grid gap-3 ${columns}`}>
          {options.map((option) => {
            const off = option.state === "off";
            const on = picked === option.label;
            return (
              <label
                key={option.label}
                className={`relative flex min-h-11 flex-col rounded-[var(--bc-radius-md,0.5rem)] border p-3 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-(--rc-accent-text) ${
                  off
                    ? "cursor-not-allowed border-dashed border-(--rc-line) text-(--rc-muted)"
                    : on
                      ? "cursor-pointer border-(--rc-accent) bg-(--rc-sunk) shadow-sm"
                      : "cursor-pointer border-(--rc-line)"
                }`}
              >
                <input
                  type="radio"
                  name={`${id}-${config.name}`}
                  value={option.label}
                  disabled={off}
                  checked={on}
                  onChange={() => setPicked(option.label)}
                  className="sr-only"
                />
                <span className="flex items-baseline justify-between gap-2">
                  <span className="font-medium">
                    {/* The tick keeps its place whether it shows or not, so the label's text is only
                        ever the option's own name. */}
                    {config.showTick && (
                      <span aria-hidden="true" hidden={!on} className="mr-1 text-(--rc-accent-text)">
                        ✓
                      </span>
                    )}
                    <span>{option.label}</span>
                  </span>
                  {option.meta.trim() !== "" && <span className="shrink-0 font-medium tabular-nums">{option.meta}</span>}
                </span>
                {option.note.trim() !== "" && <span className="mt-1 text-sm text-(--rc-muted)">{option.note}</span>}
                {/* Unavailable is said, not only drawn as a dashed border. */}
                {off && <span className="mt-1 text-xs">{config.unavailableText}</span>}
              </label>
            );
          })}
        </div>
      </fieldset>

      <p role="status" className="mt-3 text-sm text-(--rc-muted)">
        {picked === "" ? config.noneText : fill(config.pickedText, { choice: picked })}
      </p>
    </div>
  );
}
