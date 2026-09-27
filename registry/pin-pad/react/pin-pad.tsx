"use client";

import { useId, useState, useSyncExternalStore, type CSSProperties } from "react";

export type PinPadConfig = {
  legend: string;
  hint: string;
  length: number;
  name: string;
  layout: "phone" | "calculator";
  deleteLabel: string;
  clearLabel: string;
  completeText: string;
  showClear: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: PinPadConfig = {
  legend: "Enter your PIN",
  hint: "Four digits. Use the pad or type them.",
  length: 4,
  name: "pin",
  layout: "phone",
  deleteLabel: "Delete last digit",
  clearLabel: "Clear",
  completeText: "PIN complete.",
  showClear: true,
  theme: "light",
  accentColor: "#0f766e",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
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

/** The pad's own order, fixed rather than random: a shuffled pad is unusable from memory. */
export const keypadRows = (layout: "phone" | "calculator") =>
  layout === "phone"
    ? [
        ["1", "2", "3"],
        ["4", "5", "6"],
        ["7", "8", "9"],
      ]
    : [
        ["7", "8", "9"],
        ["4", "5", "6"],
        ["1", "2", "3"],
      ];

export function PinPad({ config = defaultConfig }: { config?: PinPadConfig }) {
  const id = useId();
  const [value, setValue] = useState("");
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--pp-accent": config.accentColor,
    "--pp-accent-text": readableAccent(config.accentColor, dark),
    "--pp-surface": palette.surface,
    "--pp-sunk": palette.sunk,
    "--pp-text": palette.text,
    "--pp-muted": palette.muted,
    "--pp-line": palette.line,
  } as CSSProperties;

  const push = (digit: string) => setValue((current) => (current.length >= config.length ? current : current + digit));
  const drop = () => setValue((current) => current.slice(0, -1));
  const full = value.length === config.length;

  const key =
    "flex min-h-14 items-center justify-center rounded-md border border-(--pp-line) bg-(--pp-sunk) text-xl font-medium text-(--pp-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--pp-accent-text)";

  return (
    <div
      style={style}
      className="bg-(--pp-surface) text-(--pp-text)"
      // Typing the digits has to work too: a pad that only answers to taps is a pad a keyboard cannot use.
      onKeyDown={(event) => {
        if (/^[0-9]$/.test(event.key)) {
          push(event.key);
          return;
        }
        if (event.key === "Backspace") {
          event.preventDefault();
          drop();
        }
      }}
    >
      <div role="group" aria-labelledby={`${id}-legend`} aria-describedby={config.hint.trim() === "" ? undefined : `${id}-hint`}>
        <p id={`${id}-legend`} className="font-medium">
          {config.legend}
        </p>
        {config.hint.trim() !== "" && (
          <p id={`${id}-hint`} className="mt-1 text-sm text-(--pp-muted)">
            {config.hint}
          </p>
        )}

        {/* The dots are a picture of how many digits are in. What is announced is the count, never the PIN. */}
        <div aria-hidden="true" className="mt-4 flex gap-2">
          {Array.from({ length: config.length }, (_, index) => (
            <span
              key={index}
              data-filled={index < value.length ? "true" : undefined}
              className={`h-4 w-4 rounded-full border border-(--pp-line) ${index < value.length ? "bg-(--pp-accent)" : "bg-(--pp-sunk)"}`}
            />
          ))}
        </div>

        <input type="hidden" name={config.name} value={value} />

        <div className="mt-4 grid max-w-72 grid-cols-3 gap-2">
          {keypadRows(config.layout)
            .flat()
            .map((digit) => (
              <button key={digit} type="button" onClick={() => push(digit)} className={key}>
                {digit}
              </button>
            ))}
          {config.showClear ? (
            <button type="button" onClick={() => setValue("")} className={`${key} text-sm`}>
              {config.clearLabel}
            </button>
          ) : (
            <span />
          )}
          <button type="button" onClick={() => push("0")} className={key}>
            0
          </button>
          <button type="button" onClick={drop} aria-label={config.deleteLabel} className={`${key} text-sm`}>
            <span aria-hidden="true">⌫</span>
          </button>
        </div>

        <p role="status" className="mt-3 text-sm text-(--pp-muted)">
          {full ? config.completeText : `${value.length} of ${config.length} digits entered`}
        </p>
      </div>
    </div>
  );
}
