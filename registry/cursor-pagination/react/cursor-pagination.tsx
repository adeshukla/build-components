"use client";

import { useId, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export type CursorPaginationConfig = {
  label: string;
  heading: string;
  itemNoun: string;
  pageSize: number;
  totalItems: number;
  knowsTotal: boolean;
  previousLabel: string;
  nextLabel: string;
  atStartText: string;
  atEndText: string;
  showRange: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: CursorPaginationConfig = {
  label: "Results",
  heading: "Build log",
  itemNoun: "entry",
  pageSize: 5,
  totalItems: 23,
  knowsTotal: false,
  previousLabel: "Newer",
  nextLabel: "Older",
  atStartText: "You are on the newest page.",
  atEndText: "You have reached the end.",
  showRange: true,
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

export function CursorPagination({ config = defaultConfig }: { config?: CursorPaginationConfig }) {
  const id = useId();
  const [start, setStart] = useState(0);
  const heading = useRef<HTMLHeadingElement | null>(null);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--cp-accent": config.accentColor,
    "--cp-accent-text": readableAccent(config.accentColor, dark),
    "--cp-surface": palette.surface,
    "--cp-sunk": palette.sunk,
    "--cp-text": palette.text,
    "--cp-muted": palette.muted,
    "--cp-line": palette.line,
  } as CSSProperties;

  const rows = Array.from({ length: Math.min(config.pageSize, Math.max(config.totalItems - start, 0) ) }, (_, index) => start + index + 1);
  const atStart = start === 0;
  // A cursor page knows it is the last one because it came back short, not because it counted the rest.
  const atEnd = rows.length < config.pageSize || start + rows.length >= config.totalItems;

  const go = (to: number) => {
    setStart(Math.max(to, 0));
    // Focus goes to the heading: the buttons are at the bottom, so without this the new rows are
    // above where the keyboard is and nothing says they arrived.
    requestAnimationFrame(() => heading.current?.focus());
  };

  const range = `${start + 1} to ${start + rows.length}`;
  const said = config.knowsTotal
    ? `Showing ${config.itemNoun} ${range} of ${config.totalItems}`
    : `Showing ${config.itemNoun} ${range}`;

  const button =
    "inline-flex min-h-11 items-center gap-2 rounded-md border border-(--cp-line) bg-(--cp-sunk) px-4 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--cp-accent-text)";

  return (
    <div style={style} className="bg-(--cp-surface) text-(--cp-text)">
      <h2
        ref={heading}
        id={`${id}-heading`}
        tabIndex={-1}
        className="text-lg font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--cp-accent-text)"
      >
        {config.heading}
      </h2>

      {config.showRange && (
        <p role="status" className="mt-1 text-sm text-(--cp-muted)">
          {said}
        </p>
      )}

      <ul aria-labelledby={`${id}-heading`} className="mt-3 list-none border-t border-(--cp-line) p-0">
        {rows.map((row) => (
          <li key={row} className="border-b border-(--cp-line) py-3">
            <span className="font-mono text-xs text-(--cp-muted)">#{row}</span>{" "}
            <span>
              {config.itemNoun.charAt(0).toUpperCase()}
              {config.itemNoun.slice(1)} {row}
            </span>
          </li>
        ))}
      </ul>

      <nav aria-label={config.label} className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => !atStart && go(start - config.pageSize)}
          // aria-disabled, not disabled: a disabled button cannot be focused, so nobody on a keyboard
          // ever finds out why it will not work.
          aria-disabled={atStart || undefined}
          aria-describedby={atStart ? `${id}-start` : undefined}
          className={`${button} ${atStart ? "text-(--cp-muted)" : "text-(--cp-text)"}`}
        >
          <span aria-hidden="true">←</span>
          {config.previousLabel}
        </button>
        <button
          type="button"
          onClick={() => !atEnd && go(start + config.pageSize)}
          aria-disabled={atEnd || undefined}
          aria-describedby={atEnd ? `${id}-end` : undefined}
          className={`${button} ${atEnd ? "text-(--cp-muted)" : "text-(--cp-text)"}`}
        >
          {config.nextLabel}
          <span aria-hidden="true">→</span>
        </button>
      </nav>

      {/* The reason is on the page, described by whichever button it belongs to. */}
      <p id={`${id}-start`} hidden={!atStart} className="mt-2 text-sm text-(--cp-muted)">
        {config.atStartText}
      </p>
      <p id={`${id}-end`} hidden={!atEnd} className="mt-2 text-sm text-(--cp-muted)">
        {config.atEndText}
      </p>
    </div>
  );
}
