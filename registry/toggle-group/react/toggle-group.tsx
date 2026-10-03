"use client";

import { useId, useState, useSyncExternalStore, type CSSProperties } from "react";

export type ToggleGroupConfig = {
  legend: string;
  hint: string;
  options: { label: string; value: string }[];
  name: string;
  minOne: boolean;
  showCount: boolean;
  size: "sm" | "md";
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: ToggleGroupConfig = {
  legend: "Which days do you work?",
  hint: "Pick every day that applies.",
  options: [
    { label: "Mon", value: "monday" },
    { label: "Tue", value: "tuesday" },
    { label: "Wed", value: "wednesday" },
    { label: "Thu", value: "thursday" },
    { label: "Fri", value: "friday" },
    { label: "Sat", value: "saturday" },
    { label: "Sun", value: "sunday" },
  ],
  name: "days",
  minOne: true,
  showCount: true,
  size: "md",
  theme: "light",
  accentColor: "#0f766e",
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

export function ToggleGroup({ config = defaultConfig }: { config?: ToggleGroupConfig }) {
  const id = useId();
  const options = config.options.filter((option) => option.label.trim() !== "");
  const [on, setOn] = useState<string[]>([]);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--tg-accent": config.accentColor,
    "--tg-accent-text": readableAccent(config.accentColor, dark),
    "--tg-on-accent": luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff",
    "--tg-surface": `var(--bc-${dark ? "dark" : "light"}-surface, ${palette.surface})`,
    "--tg-sunk": `var(--bc-${dark ? "dark" : "light"}-sunk, ${palette.sunk})`,
    "--tg-text": `var(--bc-${dark ? "dark" : "light"}-text, ${palette.text})`,
    "--tg-muted": `var(--bc-${dark ? "dark" : "light"}-muted, ${palette.muted})`,
    "--tg-line": `var(--bc-${dark ? "dark" : "light"}-line, ${palette.line})`,
  } as CSSProperties;

  return (
    <div style={style} className="bg-(--tg-surface) text-(--tg-text)">
      {/* Checkboxes, not buttons: several answers to one question, and the form sends them itself. */}
      <fieldset className="border-0 p-0" aria-describedby={config.hint.trim() === "" ? undefined : `${id}-hint`}>
        <legend className="font-medium">{config.legend}</legend>
        {config.hint.trim() !== "" && (
          <p id={`${id}-hint`} className="text-sm text-(--tg-muted)">
            {config.hint}
          </p>
        )}

        <div className="mt-2 flex flex-wrap gap-2">
          {options.map((option) => {
            const picked = on.includes(option.value || option.label);
            const value = option.value || option.label;
            const only = config.minOne && picked && on.length === 1;
            return (
              <label
                key={value}
                className={`inline-flex min-h-11 cursor-pointer items-center rounded-[var(--bc-radius-sm,0.375rem)] border has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-(--tg-accent-text) ${
                  config.size === "sm" ? "px-3 text-sm" : "px-4"
                } ${picked ? "border-(--tg-accent) bg-(--tg-accent) font-medium text-(--tg-on-accent)" : "border-(--tg-line) bg-(--tg-sunk)"}`}
              >
                <input
                  type="checkbox"
                  name={config.name}
                  value={value}
                  checked={picked}
                  onChange={() => {
                    // With "keep at least one" on, the last one left will not turn itself off.
                    if (only) return;
                    setOn((current) => (picked ? current.filter((entry) => entry !== value) : [...current, value]));
                  }}
                  aria-disabled={only || undefined}
                  className="sr-only"
                />
                {option.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      {config.showCount && (
        <p role="status" className="mt-3 text-sm text-(--tg-muted)">
          {on.length === 0
            ? "Nothing picked"
            : `${on.length} picked: ${options
                .filter((option) => on.includes(option.value || option.label))
                .map((option) => option.label)
                .join(", ")}`}
        </p>
      )}
    </div>
  );
}
