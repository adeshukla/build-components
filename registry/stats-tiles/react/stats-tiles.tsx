"use client";

import { useSyncExternalStore, type CSSProperties } from "react";

export type StatsTilesConfig = {
  heading: string;
  tiles: { label: string; value: string; change: string; direction: string }[];
  showChange: boolean;
  columns: "two" | "three" | "four";
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: StatsTilesConfig = {
  heading: "This week",
  tiles: [
    { label: "Signed up", value: "128", change: "12 more than last week", direction: "up" },
    { label: "Invoices sent", value: "64", change: "3 fewer than last week", direction: "down" },
    { label: "Open tickets", value: "9", change: "the same as last week", direction: "flat" },
    { label: "Average reply", value: "2h 14m", change: "21 minutes quicker", direction: "up" },
  ],
  showChange: true,
  columns: "four",
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

/** Anything that is not up or down is drawn flat, so a typo cannot invent a direction. */
const arrows = { up: "↑", down: "↓", flat: "→" };
const direction = (value: string) => (value === "up" || value === "down" ? value : "flat");

export function StatsTiles({ config = defaultConfig }: { config?: StatsTilesConfig }) {
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--sx-accent": config.accentColor,
    "--sx-accent-text": readableAccent(config.accentColor, dark),
    "--sx-surface": palette.surface,
    "--sx-sunk": palette.sunk,
    "--sx-text": palette.text,
    "--sx-muted": palette.muted,
    "--sx-line": palette.line,
  } as CSSProperties;

  const tiles = config.tiles.filter((tile) => tile.label.trim() !== "");
  const columns = config.columns === "two" ? "sm:grid-cols-2" : config.columns === "three" ? "sm:grid-cols-3" : "sm:grid-cols-4";

  return (
    <div style={style} className="bg-(--sx-surface) text-(--sx-text)">
      <h2 className="text-xl font-semibold">{config.heading}</h2>

      {/* A description list: the label is the term, the number is the description. */}
      <dl className={`mt-3 grid gap-3 ${columns}`}>
        {tiles.map((tile) => {
          const way = direction(tile.direction);
          return (
            <div key={tile.label} className="rounded-xl border border-(--sx-line) bg-(--sx-sunk) p-4">
              <dt className="text-sm text-(--sx-muted)">{tile.label}</dt>
              <dd className="m-0">
                <span className="block text-2xl font-semibold tabular-nums">{tile.value}</span>
                {config.showChange && tile.change.trim() !== "" && (
                  <span className="mt-1 flex items-baseline gap-1 text-sm text-(--sx-muted)">
                    {/* The arrow is decoration: the change is already in words, so colour is never the only clue. */}
                    <span aria-hidden="true" className={way === "flat" ? "" : "text-(--sx-accent-text)"}>
                      {arrows[way]}
                    </span>
                    {tile.change}
                  </span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
