"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export type TimelineConfig = {
  heading: string;
  entries: { datetime: string; when: string; who: string; what: string }[];
  newestFirst: boolean;
  initialCount: number;
  moreText: string;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: TimelineConfig = {
  heading: "Activity",
  entries: [
    { datetime: "2026-03-04T09:12", when: "4 March, 9:12", who: "Priya", what: "moved Anchor plan to In review" },
    { datetime: "2026-03-03T16:40", when: "3 March, 16:40", who: "Sam", what: "left a comment on Ballast notes" },
    { datetime: "2026-03-03T11:02", when: "3 March, 11:02", who: "Ade", what: "signed off the cargo manifest" },
    { datetime: "2026-02-28T14:25", when: "28 February, 14:25", who: "Marta", what: "uploaded the deck survey" },
    { datetime: "2026-02-27T08:05", when: "27 February, 8:05", who: "Priya", what: "invited Sam to the workspace" },
    { datetime: "2026-02-26T17:55", when: "26 February, 17:55", who: "Ade", what: "created the workspace" },
  ],
  newestFirst: true,
  initialCount: 3,
  moreText: "Show older",
  theme: "light",
  accentColor: "#7c3aed",
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

export function Timeline({ config = defaultConfig }: { config?: TimelineConfig }) {
  const [all, setAll] = useState(false);
  const items = useRef<(HTMLLIElement | null)[]>([]);
  const revealed = useRef(-1);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--tl-accent": config.accentColor,
    "--tl-accent-text": readableAccent(config.accentColor, dark),
    "--tl-surface": palette.surface,
    "--tl-sunk": palette.sunk,
    "--tl-text": palette.text,
    "--tl-muted": palette.muted,
    "--tl-line": palette.line,
  } as CSSProperties;

  const entries = config.entries.filter((entry) => entry.what.trim() !== "");
  const ordered = config.newestFirst ? entries : [...entries].reverse();
  const limit = Math.max(1, config.initialCount);
  const shown = all ? ordered : ordered.slice(0, limit);
  const hidden = ordered.length - shown.length;

  // The button that revealed them has gone, so focus goes to the first entry that arrived.
  useEffect(() => {
    if (revealed.current < 0) return;
    const first = items.current[revealed.current];
    revealed.current = -1;
    first?.focus();
  }, [all]);

  return (
    <div style={style} className="bg-(--tl-surface) text-(--tl-text)">
      <h2 className="text-xl font-semibold">{config.heading}</h2>

      {/* An ordered list: the order is the point, and it survives without the line down the side. */}
      <ol className="mt-3 grid list-none gap-0 p-0">
        {shown.map((entry, index) => (
          <li
            key={entry.datetime + entry.what}
            ref={(node) => {
              items.current[index] = node;
            }}
            tabIndex={-1}
            className="grid grid-cols-[auto_1fr] gap-x-3 outline-none"
          >
            <span aria-hidden="true" className="flex flex-col items-center">
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-(--tl-accent)" />
              <span className="w-px flex-1 bg-(--tl-line)" />
            </span>
            <div className="pb-4">
              <p className="text-sm">
                <span className="font-medium">{entry.who}</span> {entry.what}
              </p>
              {/* A real time element: the readable text stays, and the machine-readable stamp goes in the attribute. */}
              <time dateTime={entry.datetime} className="text-sm text-(--tl-muted)">
                {entry.when}
              </time>
            </div>
          </li>
        ))}
      </ol>

      {hidden > 0 && (
        <button
          type="button"
          onClick={() => {
            revealed.current = shown.length;
            setAll(true);
          }}
          className="min-h-11 cursor-pointer rounded-md border border-(--tl-line) px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--tl-accent-text)"
        >
          {`${config.moreText} (${hidden})`}
        </button>
      )}

      {/* The list grew below the button that grew it: say how much arrived. */}
      <p role="status" className="mt-2 text-sm text-(--tl-muted)">
        {all && entries.length > limit ? `Showing all ${ordered.length} entries` : ""}
      </p>
    </div>
  );
}
