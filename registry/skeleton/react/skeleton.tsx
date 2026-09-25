"use client";

import { useSyncExternalStore, type CSSProperties } from "react";

export type SkeletonConfig = {
  variant: "lines" | "card" | "list";
  lines: number;
  rows: number;
  showAvatar: boolean;
  animate: boolean;
  loadingText: string;
  theme: "light" | "dark" | "system";
};

// @config-start
const defaultConfig: SkeletonConfig = {
  variant: "list",
  lines: 2,
  rows: 3,
  showAvatar: true,
  animate: true,
  loadingText: "Loading comments",
  theme: "light",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", block: "#e6e3ee", line: "#d9d5e4" },
  dark: { surface: "#141019", block: "#2a2438", line: "#3a3448" },
};

const darkMedia = {
  subscribe: (onChange: () => void) => {
    const list = window.matchMedia("(prefers-color-scheme: dark)");
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  },
  get: () => window.matchMedia("(prefers-color-scheme: dark)").matches,
};

/** Line widths that look like text instead of a solid block; the last line is always shorter. */
const widths = ["100%", "92%", "96%", "85%"];

export function Skeleton({ config = defaultConfig }: { config?: SkeletonConfig }) {
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--sk-surface": palette.surface,
    "--sk-block": palette.block,
    "--sk-line": palette.line,
  } as CSSProperties;
  const lines = Math.max(1, Math.min(8, Math.round(config.lines)));
  const rows = Math.max(1, Math.min(8, Math.round(config.variant === "lines" ? 1 : config.rows)));
  // The pulse only runs if it was asked for; reduced motion turns it off as well.
  const block = `rounded bg-(--sk-block) ${config.animate ? "animate-pulse motion-reduce:animate-none" : ""}`;

  return (
    // One polite status for the whole block: a screen reader hears "Loading comments" once,
    // instead of reading a wall of empty boxes.
    <div
      role="status"
      aria-live="polite"
      style={style}
      className="max-w-lg bg-(--sk-surface)"
    >
      <span className="sr-only">{config.loadingText}…</span>
      <div aria-hidden="true" className="flex flex-col gap-4">
        {Array.from({ length: rows }, (_, row) => (
          <div
            key={row}
            className={config.variant === "card" ? "rounded-lg border border-(--sk-line) p-4" : ""}
          >
            {config.variant === "card" && <div className={`mb-4 h-28 w-full ${block}`} />}
            <div className="flex items-start gap-3">
              {config.showAvatar && <div className={`size-10 shrink-0 rounded-full bg-(--sk-block) ${config.animate ? "animate-pulse motion-reduce:animate-none" : ""}`} />}
              <div className="min-w-0 flex-1 space-y-2">
                {Array.from({ length: lines }, (_, line) => (
                  <div
                    key={line}
                    style={{ width: line === lines - 1 && lines > 1 ? "60%" : widths[line % widths.length] }}
                    className={`h-3.5 ${block}`}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
