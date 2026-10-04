"use client";

import { useId, useState, useSyncExternalStore, type CSSProperties } from "react";

export type SlotPickerConfig = {
  heading: string;
  slots: { day: string; time: string; state: string }[];
  timezoneNote: string;
  confirmText: string;
  theme: "light" | "dark" | "system";
  accentColor: string;
  slotText: string;
  freeText: string;
  takenText: string;
  noneText: string;
  selectedText: string;
  bookedText: string;
};

// @config-start
const defaultConfig: SlotPickerConfig = {
  heading: "Pick a time",
  slots: [
    { day: "Thursday 5 March", time: "09:00", state: "free" },
    { day: "Thursday 5 March", time: "09:30", state: "taken" },
    { day: "Thursday 5 March", time: "10:00", state: "free" },
    { day: "Thursday 5 March", time: "10:30", state: "free" },
    { day: "Friday 6 March", time: "11:00", state: "free" },
    { day: "Friday 6 March", time: "11:30", state: "taken" },
    { day: "Friday 6 March", time: "14:00", state: "free" },
    { day: "Monday 9 March", time: "09:00", state: "free" },
    { day: "Monday 9 March", time: "15:30", state: "free" },
  ],
  timezoneNote: "Times are shown in your device's own time zone.",
  confirmText: "Confirm this time",
  theme: "light",
  accentColor: "#0f766e",
  slotText: "{day} at {time}",
  freeText: "{free} of {total} times are free.",
  takenText: "(taken)",
  noneText: "No time picked yet",
  selectedText: "{slot} selected",
  bookedText: "Booked for {slot}",
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

export function SlotPicker({ config = defaultConfig }: { config?: SlotPickerConfig }) {
  const id = useId();
  const [picked, setPicked] = useState("");
  const [result, setResult] = useState("");
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--sl-accent": config.accentColor,
    "--sl-accent-text": readableAccent(config.accentColor, dark),
    "--sl-on-accent": luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff",
    "--sl-surface": `var(--bc-${dark ? "dark" : "light"}-surface, ${palette.surface})`,
    "--sl-sunk": `var(--bc-${dark ? "dark" : "light"}-sunk, ${palette.sunk})`,
    "--sl-text": `var(--bc-${dark ? "dark" : "light"}-text, ${palette.text})`,
    "--sl-muted": `var(--bc-${dark ? "dark" : "light"}-muted, ${palette.muted})`,
    "--sl-line": `var(--bc-${dark ? "dark" : "light"}-line, ${palette.line})`,
  } as CSSProperties;

  const slots = config.slots.filter((slot) => slot.time.trim() !== "");
  const days = [...new Set(slots.map((slot) => slot.day))];
  const free = slots.filter((slot) => slot.state !== "taken");

  return (
    <div style={style} className="bg-(--sl-surface) text-(--sl-text)">
      {/* One radio group for the whole picker: it is one choice, however many days it spans. */}
      <fieldset className="border-0 p-0" aria-describedby={`${id}-note`}>
        <legend className="text-lg font-semibold">{config.heading}</legend>
        <p id={`${id}-note`} className="text-sm text-(--sl-muted)">
          {config.timezoneNote} {fill(config.freeText, { free: free.length, total: slots.length })}
        </p>

        {days.map((day) => (
          <div key={day} role="group" aria-label={day} className="mt-3">
            <p className="text-sm font-medium">{day}</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {slots
                .filter((slot) => slot.day === day)
                .map((slot) => {
                  const taken = slot.state === "taken";
                  const value = fill(config.slotText, { day, time: slot.time });
                  const on = picked === value;
                  return (
                    <label
                      key={value}
                      className={`inline-flex min-h-11 items-center gap-1 rounded-[var(--bc-radius-sm,0.375rem)] border px-3 text-sm tabular-nums has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-(--sl-accent-text) ${
                        taken
                          ? "cursor-not-allowed border-dashed border-(--sl-line) text-(--sl-muted)"
                          : on
                            ? "cursor-pointer border-(--sl-accent) bg-(--sl-accent) text-(--sl-on-accent)"
                            : "cursor-pointer border-(--sl-line)"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`${id}-slot`}
                        value={value}
                        disabled={taken}
                        checked={on}
                        onChange={() => {
                          setPicked(value);
                          setResult("");
                        }}
                        className="sr-only"
                      />
                      {slot.time}
                      {/* Taken is said, not only drawn as a dashed outline. */}
                      {taken && <span className="text-xs">{config.takenText}</span>}
                    </label>
                  );
                })}
            </div>
          </div>
        ))}
      </fieldset>

      <button
        type="button"
        disabled={picked === ""}
        onClick={() => setResult(fill(config.bookedText, { slot: picked }))}
        className="mt-4 min-h-11 cursor-pointer rounded-[var(--bc-radius-button,0.375rem)] bg-(--sl-accent) px-4 font-medium text-(--sl-on-accent) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--sl-accent-text) disabled:cursor-not-allowed disabled:opacity-50"
      >
        {config.confirmText}
      </button>

      {/* The time on its own ("10:30") means little: the announcement carries the day as well. */}
      <p role="status" className="mt-2 text-sm text-(--sl-muted)">
        {result || (picked === "" ? config.noneText : fill(config.selectedText, { slot: picked }))}
      </p>
    </div>
  );
}
