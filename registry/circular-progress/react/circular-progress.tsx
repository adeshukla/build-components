"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export type CircularProgressConfig = {
  label: string;
  mode: "determinate" | "indeterminate";
  value: number;
  unitText: string;
  busyText: string;
  doneText: string;
  runLabel: string;
  demoMs: number;
  size: number;
  thickness: number;
  showValue: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: CircularProgressConfig = {
  label: "Uploading photos",
  mode: "determinate",
  value: 0,
  unitText: "uploaded",
  busyText: "Working. This can take a minute.",
  doneText: "All photos uploaded.",
  runLabel: "Start the upload",
  demoMs: 2400,
  size: 96,
  thickness: 10,
  showValue: true,
  theme: "light",
  accentColor: "#0f766e",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#e6e3ef", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#141019", sunk: "#2c2639", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
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

export function CircularProgress({ config = defaultConfig }: { config?: CircularProgressConfig }) {
  const id = useId();
  const [value, setValue] = useState(Math.min(Math.max(config.value, 0), 100));
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const tick = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--cpr-accent": config.accentColor,
    "--cpr-accent-text": readableAccent(config.accentColor, dark),
    "--cpr-surface": palette.surface,
    "--cpr-sunk": palette.sunk,
    "--cpr-text": palette.text,
    "--cpr-muted": palette.muted,
    "--cpr-line": palette.line,
  } as CSSProperties;

  useEffect(() => () => clearInterval(tick.current), []);

  const run = () => {
    clearInterval(tick.current);
    setDone(false);
    setValue(0);
    setRunning(true);
    const steps = 20;
    tick.current = setInterval(() => {
      setValue((current) => {
        const next = current + 100 / steps;
        if (next >= 100) {
          clearInterval(tick.current);
          setRunning(false);
          setDone(true);
          return 100;
        }
        return next;
      });
    }, Math.max(config.demoMs / steps, 30));
  };

  const shown = Math.round(value);
  const radius = (config.size - config.thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const indeterminate = config.mode === "indeterminate";
  // An indeterminate progressbar is one with no aria-valuenow. Inventing a number would be a lie.
  const ringStyle = indeterminate
    ? { strokeDasharray: `${circumference * 0.28} ${circumference}`, strokeDashoffset: 0 }
    : { strokeDasharray: `${circumference}`, strokeDashoffset: circumference * (1 - shown / 100) };

  return (
    <div style={style} className="bg-(--cpr-surface) text-(--cpr-text)">
      {/* React 19 hoists this into the head and keeps one copy, however many rings are on the page. */}
      <style href="cpr-turn" precedence="default">{`
        @keyframes cpr-turn { to { transform: rotate(1turn); } }
        .cpr-turn { animation: cpr-turn 1.1s linear infinite; transform-origin: 50% 50%; }
        /* The turning says nothing that the words do not, so it stops. */
        @media (prefers-reduced-motion: reduce) { .cpr-turn { animation: none; } }
      `}</style>

      <div className="flex flex-wrap items-center gap-5">
        <div
          role="progressbar"
          data-progress
          aria-labelledby={`${id}-label`}
          aria-valuemin={indeterminate ? undefined : 0}
          aria-valuemax={indeterminate ? undefined : 100}
          aria-valuenow={indeterminate ? undefined : shown}
          aria-valuetext={indeterminate ? undefined : `${shown}% ${config.unitText}`}
          aria-busy={indeterminate || running || undefined}
          className="relative shrink-0"
          style={{ width: config.size, height: config.size }}
        >
          <svg viewBox={`0 0 ${config.size} ${config.size}`} className="size-full -rotate-90">
            <circle
              cx={config.size / 2}
              cy={config.size / 2}
              r={radius}
              fill="none"
              strokeWidth={config.thickness}
              className="stroke-(--cpr-sunk)"
            />
            <circle
              cx={config.size / 2}
              cy={config.size / 2}
              r={radius}
              fill="none"
              strokeWidth={config.thickness}
              strokeLinecap="round"
              style={ringStyle}
              className={`stroke-(--cpr-accent) ${indeterminate ? "cpr-turn" : ""}`}
            />
          </svg>
          {config.showValue && !indeterminate && (
            // The number is on the face as well as in the value: a filled arc alone is not information.
            <span aria-hidden="true" data-face className="absolute inset-0 flex items-center justify-center font-mono text-sm font-semibold">
              {shown}%
            </span>
          )}
        </div>

        <div>
          <p id={`${id}-label`} className="font-medium">
            {config.label}
          </p>
          <p className="mt-1 text-sm text-(--cpr-muted)">
            {indeterminate ? config.busyText : `${shown}% ${config.unitText}`}
          </p>
          {config.mode === "determinate" && (
            <button
              type="button"
              onClick={run}
              aria-disabled={running || undefined}
              className="mt-3 inline-flex min-h-11 items-center rounded-md border border-(--cpr-line) bg-(--cpr-sunk) px-4 text-sm font-medium text-(--cpr-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--cpr-accent-text)"
            >
              {config.runLabel}
            </button>
          )}
        </div>
      </div>

      {/*
        Only the end is announced. A progressbar whose value is read out on every tick talks over
        everything else on the page.
      */}
      <p role="status" className="mt-3 text-sm text-(--cpr-muted)">
        {done ? config.doneText : ""}
      </p>
    </div>
  );
}
