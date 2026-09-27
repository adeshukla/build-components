"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export type CheckboxGroupConfig = {
  legend: string;
  hint: string;
  options: { label: string; note: string }[];
  name: string;
  showSelectAll: boolean;
  selectAllLabel: string;
  showCount: boolean;
  minRequired: number;
  errorText: string;
  columns: "one" | "two";
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: CheckboxGroupConfig = {
  legend: "What should we email you about?",
  hint: "Pick as many as you like. You can change this later.",
  options: [
    { label: "Product updates", note: "New parts and changes to old ones" },
    { label: "Release notes", note: "What shipped, every fortnight" },
    { label: "Accessibility notes", note: "What we learnt testing with screen readers" },
    { label: "Offers", note: "Rarely, and never more than once a month" },
  ],
  name: "topics",
  showSelectAll: true,
  selectAllLabel: "Everything",
  showCount: true,
  minRequired: 1,
  errorText: "Pick at least one topic.",
  columns: "one",
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

export function CheckboxGroup({ config = defaultConfig }: { config?: CheckboxGroupConfig }) {
  const id = useId();
  const options = config.options.filter((option) => option.label.trim() !== "");
  const [on, setOn] = useState<string[]>([]);
  const [error, setError] = useState("");
  const allRef = useRef<HTMLInputElement>(null);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--cg-accent": config.accentColor,
    "--cg-accent-text": readableAccent(config.accentColor, dark),
    "--cg-surface": palette.surface,
    "--cg-sunk": palette.sunk,
    "--cg-text": palette.text,
    "--cg-muted": palette.muted,
    "--cg-line": palette.line,
    "--cg-error": palette.error,
  } as CSSProperties;

  const all = on.length === options.length && options.length > 0;
  const some = on.length > 0 && !all;

  // "Some of them" is a third state a checkbox can only be put into from script.
  useEffect(() => {
    if (allRef.current) allRef.current.indeterminate = some;
  }, [some]);

  function toggle(label: string) {
    setOn((current) => {
      const next = current.includes(label) ? current.filter((entry) => entry !== label) : [...current, label];
      if (error !== "" && next.length >= config.minRequired) setError("");
      return next;
    });
  }

  return (
    <div style={style} className="bg-(--cg-surface) text-(--cg-text)">
      <fieldset className="border-0 p-0" aria-describedby={`${id}-hint${error === "" ? "" : ` ${id}-error`}`}>
        <legend className="font-medium">{config.legend}</legend>
        {config.hint.trim() !== "" && (
          <p id={`${id}-hint`} className="text-sm text-(--cg-muted)">
            {config.hint}
          </p>
        )}

        {config.showSelectAll && options.length > 1 && (
          <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3 border-b border-(--cg-line) pb-3">
            <input
              ref={allRef}
              type="checkbox"
              checked={all}
              onChange={() => {
                setOn(all ? [] : options.map((option) => option.label));
                setError("");
              }}
              className="size-5 shrink-0 accent-(--cg-accent)"
            />
            <span className="font-medium">{config.selectAllLabel}</span>
          </label>
        )}

        <div className={`mt-3 grid gap-3 ${config.columns === "two" ? "sm:grid-cols-2" : ""}`}>
          {options.map((option) => (
            <label key={option.label} className="flex min-h-11 cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                name={config.name}
                value={option.label}
                checked={on.includes(option.label)}
                onChange={() => toggle(option.label)}
                className="mt-0.5 size-5 shrink-0 accent-(--cg-accent)"
              />
              <span>
                <span className="block">{option.label}</span>
                {option.note.trim() !== "" && <span className="block text-sm text-(--cg-muted)">{option.note}</span>}
              </span>
            </label>
          ))}
        </div>

        {error !== "" && (
          <p id={`${id}-error`} role="alert" className="mt-2 text-sm text-(--cg-error)">
            {error}
          </p>
        )}
      </fieldset>

      {config.showCount && (
        // The count changes as boxes are ticked, so it is said politely rather than on every tick.
        <p role="status" className="mt-3 text-sm text-(--cg-muted)">
          {`${on.length} of ${options.length} picked`}
        </p>
      )}

      <button
        type="button"
        onClick={() => setError(on.length < config.minRequired ? config.errorText : "")}
        className="mt-3 min-h-11 cursor-pointer rounded-md border border-(--cg-line) px-4 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--cg-accent-text)"
      >
        Save choices
      </button>
    </div>
  );
}
