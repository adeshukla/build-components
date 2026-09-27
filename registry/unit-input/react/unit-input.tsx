"use client";

import { useId, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export type UnitInputConfig = {
  label: string;
  hint: string;
  name: string;
  unitName: string;
  units: { label: string; value: string }[];
  min: number;
  max: number;
  step: number;
  errorText: string;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: UnitInputConfig = {
  label: "How long is the boat?",
  hint: "Overall length, to the nearest tenth.",
  name: "length",
  unitName: "lengthUnit",
  units: [
    { label: "metres", value: "m" },
    { label: "feet", value: "ft" },
  ],
  min: 1,
  max: 200,
  step: 0.1,
  errorText: "Give a length between 1 and 200.",
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

export function UnitInput({ config = defaultConfig }: { config?: UnitInputConfig }) {
  const id = useId();
  const units = config.units.filter((unit) => unit.label.trim() !== "");
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState(units[0]?.value ?? "");
  const [error, setError] = useState("");
  const fieldRef = useRef<HTMLInputElement>(null);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--ui-accent": config.accentColor,
    "--ui-accent-text": readableAccent(config.accentColor, dark),
    "--ui-surface": palette.surface,
    "--ui-sunk": palette.sunk,
    "--ui-text": palette.text,
    "--ui-muted": palette.muted,
    "--ui-line": palette.line,
    "--ui-error": palette.error,
  } as CSSProperties;

  const unitLabel = units.find((entry) => entry.value === unit)?.label ?? "";
  const said = amount.trim() === "" ? "" : `${amount} ${unitLabel}`;

  function check(next: string) {
    if (next.trim() === "") return "";
    const value = Number(next);
    return Number.isFinite(value) && value >= config.min && value <= config.max ? "" : config.errorText;
  }

  return (
    <div style={style} className="bg-(--ui-surface) text-(--ui-text)">
      <label htmlFor={`${id}-amount`} className="block font-medium">
        {config.label}
      </label>
      {config.hint.trim() !== "" && (
        <p id={`${id}-hint`} className="text-sm text-(--ui-muted)">
          {config.hint}
        </p>
      )}

      {/* Two fields, one answer: the number and the unit are separately labelled, never one guessed string. */}
      <div className="mt-2 flex flex-wrap gap-2">
        <input
          ref={fieldRef}
          id={`${id}-amount`}
          name={config.name}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={amount}
          min={config.min}
          max={config.max}
          step={config.step}
          aria-invalid={error === "" ? undefined : true}
          aria-describedby={`${config.hint.trim() === "" ? "" : `${id}-hint`}${error === "" ? "" : ` ${id}-error`}`.trim() || undefined}
          onChange={(event) => {
            const next = event.target.value;
            setAmount(next);
            // Once an error is showing, check as they type rather than waiting for them to leave.
            if (error !== "") setError(check(next));
          }}
          onBlur={(event) => setError(check(event.target.value))}
          className={`min-h-11 w-32 rounded-md border bg-(--ui-sunk) px-3 text-(--ui-text) tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ui-accent-text) ${
            error === "" ? "border-(--ui-line)" : "border-(--ui-error)"
          }`}
        />
        <label htmlFor={`${id}-unit`} className="sr-only">
          {`Unit for ${config.label.toLowerCase()}`}
        </label>
        <select
          id={`${id}-unit`}
          name={config.unitName}
          value={unit}
          onChange={(event) => setUnit(event.target.value)}
          className="min-h-11 rounded-md border border-(--ui-line) bg-(--ui-sunk) px-3 text-(--ui-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ui-accent-text)"
        >
          {units.map((entry) => (
            <option key={entry.value} value={entry.value}>
              {entry.label}
            </option>
          ))}
        </select>
      </div>

      {error !== "" && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-sm text-(--ui-error)">
          {error}
        </p>
      )}

      {/* The pair read back as one answer, which is how it will be used. */}
      <p role="status" className="mt-2 text-sm text-(--ui-muted)">
        {said}
      </p>
    </div>
  );
}
