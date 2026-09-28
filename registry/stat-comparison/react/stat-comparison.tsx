"use client";

import { useSyncExternalStore, type CSSProperties } from "react";

export type StatComparisonConfig = {
  caption: string;
  metricHeader: string;
  leftHeader: string;
  rightHeader: string;
  rows: { metric: string; left: string; right: string; better: string }[];
  betterWord: string;
  showBetter: boolean;
  note: string;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: StatComparisonConfig = {
  caption: "The two outputs, side by side",
  metricHeader: "",
  leftHeader: "React + Tailwind",
  rightHeader: "HTML, CSS and JS",
  rows: [
    { metric: "Files to copy", left: "1", right: "2 or 3", better: "left" },
    { metric: "Runtime dependencies", left: "0", right: "0", better: "neither" },
    { metric: "Needs a build step", left: "Yes", right: "No", better: "right" },
    { metric: "Tailwind version required", left: "v4", right: "None", better: "right" },
    { metric: "Tests run against it", left: "Every one", right: "Every one", better: "neither" },
  ],
  betterWord: "Better here",
  showBetter: true,
  note: "Better depends on the project. This is what differs, not which one you should pick.",
  theme: "light",
  accentColor: "#0f766e",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#f1f5f4", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#141019", sunk: "#1c2422", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
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

export function StatComparison({ config = defaultConfig }: { config?: StatComparisonConfig }) {
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--stc-accent": config.accentColor,
    "--stc-accent-text": readableAccent(config.accentColor, dark),
    "--stc-surface": palette.surface,
    "--stc-sunk": palette.sunk,
    "--stc-text": palette.text,
    "--stc-muted": palette.muted,
    "--stc-line": palette.line,
  } as CSSProperties;

  const cell = "px-3 py-3 align-top";

  return (
    <div style={style} className="bg-(--stc-surface) p-1 text-(--stc-text)">
      <table className="w-full border-collapse text-left">
        <caption className="pb-3 text-left text-xl font-semibold">{config.caption}</caption>
        <thead>
          <tr className="border-b-2 border-(--stc-line)">
            {/*
              The first header can be empty to the eye but never to the markup: it is the corner of the
              table, and a blank th with no scope leaves the column headers unanchored.
            */}
            <th scope="col" className={`${cell} font-medium`}>
              {config.metricHeader.trim() === "" ? <span className="sr-only">Measure</span> : config.metricHeader}
            </th>
            <th scope="col" className={`${cell} font-semibold`}>
              {config.leftHeader}
            </th>
            <th scope="col" className={`${cell} font-semibold`}>
              {config.rightHeader}
            </th>
          </tr>
        </thead>
        <tbody>
          {config.rows.map((row) => (
            <tr key={row.metric} className="border-b border-(--stc-line)">
              {/* The measure is the row's header, so a reader says it alongside both values. */}
              <th scope="row" className={`${cell} font-normal text-(--stc-muted)`}>
                {row.metric}
              </th>
              {(["left", "right"] as const).map((side) => {
                const winner = config.showBetter && row.better === side;
                return (
                  <td
                    key={side}
                    data-side={side}
                    data-better={winner ? "true" : undefined}
                    className={`${cell} font-medium tabular-nums ${winner ? "bg-(--stc-sunk)" : ""}`}
                  >
                    {side === "left" ? row.left : row.right}
                    {/*
                      Which one is better is said in words, not by a tint. A shaded cell is invisible to a
                      screen reader and to anyone who cannot tell the two shades apart.
                    */}
                    {winner && (
                      <span className="mt-0.5 block text-xs font-semibold tracking-wide text-(--stc-accent-text) uppercase">
                        {config.betterWord}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {config.note.trim() !== "" && <p className="mt-4 max-w-prose text-sm text-(--stc-muted)">{config.note}</p>}
    </div>
  );
}
