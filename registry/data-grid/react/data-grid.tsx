"use client";

import { useId, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export type DataGridConfig = {
  caption: string;
  rows: { name: string; owner: string; status: string; updated: string }[];
  stickyHeader: boolean;
  sortable: boolean;
  resizable: boolean;
  maxHeight: number;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: DataGridConfig = {
  caption: "Documents",
  rows: [
    { name: "Anchor plan", owner: "Priya", status: "In review", updated: "4 Mar 2026" },
    { name: "Ballast notes", owner: "Sam", status: "Draft", updated: "2 Mar 2026" },
    { name: "Cargo manifest", owner: "Ade", status: "Signed off", updated: "28 Feb 2026" },
    { name: "Deck survey", owner: "Marta", status: "In review", updated: "26 Feb 2026" },
    { name: "Engine log", owner: "Sam", status: "Draft", updated: "21 Feb 2026" },
    { name: "Fuel report", owner: "Priya", status: "Signed off", updated: "19 Feb 2026" },
    { name: "Galley order", owner: "Ade", status: "Draft", updated: "14 Feb 2026" },
    { name: "Hull check", owner: "Marta", status: "Signed off", updated: "11 Feb 2026" },
  ],
  stickyHeader: true,
  sortable: true,
  resizable: true,
  maxHeight: 320,
  theme: "light",
  accentColor: "#1d4ed8",
};
// @config-end

const columns = [
  { key: "name", label: "Name", width: 220 },
  { key: "owner", label: "Owner", width: 140 },
  { key: "status", label: "Status", width: 150 },
  { key: "updated", label: "Updated", width: 150 },
] as const;

type ColumnKey = (typeof columns)[number]["key"];

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

const MIN_WIDTH = 96;
const MAX_WIDTH = 480;
const clamp = (value: number) => Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(value)));

export function DataGrid({ config = defaultConfig }: { config?: DataGridConfig }) {
  const id = useId();
  const rows = config.rows.filter((row) => row.name.trim() !== "");
  const [sort, setSort] = useState<{ key: ColumnKey; direction: "ascending" | "descending" } | null>(null);
  const [widths, setWidths] = useState<number[]>(columns.map((column) => column.width));
  const drag = useRef<{ index: number; from: number; width: number } | null>(null);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--dg-accent": config.accentColor,
    "--dg-accent-text": readableAccent(config.accentColor, dark),
    "--dg-surface": palette.surface,
    "--dg-sunk": palette.sunk,
    "--dg-text": palette.text,
    "--dg-muted": palette.muted,
    "--dg-line": palette.line,
  } as CSSProperties;

  const sorted = sort
    ? [...rows].sort((a, b) => a[sort.key].localeCompare(b[sort.key]) * (sort.direction === "ascending" ? 1 : -1))
    : rows;

  function toggleSort(key: ColumnKey) {
    setSort((current) =>
      current?.key === key
        ? { key, direction: current.direction === "ascending" ? "descending" : "ascending" }
        : { key, direction: "ascending" },
    );
  }

  function setWidth(index: number, next: number) {
    setWidths((current) => current.map((width, i) => (i === index ? clamp(next) : width)));
  }

  // Dragging is the quick way; the arrow keys are the way that works without a pointer (WCAG 2.5.7).
  function onHandleKeyDown(event: React.KeyboardEvent, index: number) {
    const step = event.shiftKey ? 48 : 16;
    if (event.key === "ArrowRight") setWidth(index, widths[index] + step);
    else if (event.key === "ArrowLeft") setWidth(index, widths[index] - step);
    else if (event.key === "Home") setWidth(index, columns[index].width);
    else return;
    event.preventDefault();
  }

  const sortLabel = sort ? `Sorted by ${columns.find((column) => column.key === sort.key)?.label}, ${sort.direction}` : "Not sorted";

  return (
    <div style={style} className="bg-(--dg-surface) text-(--dg-text)">
      <div
        // The header stays put because the scrolling happens in here, not on the page. A region that
        // scrolls has to be reachable by keyboard, so it takes focus and carries the caption's name.
        role="region"
        aria-labelledby={`${id}-caption`}
        tabIndex={0}
        className="overflow-auto rounded-lg border border-(--dg-line) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--dg-accent-text)"
        style={config.maxHeight > 0 ? { maxHeight: `${config.maxHeight}px` } : undefined}
      >
        <table className="w-full table-fixed border-collapse text-sm">
          <caption id={`${id}-caption`} className="p-3 text-left font-medium">
            {config.caption}
          </caption>
          <colgroup>
            {widths.map((width, index) => (
              <col key={columns[index].key} style={{ width: `${width}px` }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={config.sortable ? (sort?.key === column.key ? sort.direction : "none") : undefined}
                  className={`relative border-b border-(--dg-line) bg-(--dg-sunk) p-0 text-left align-bottom ${
                    config.stickyHeader ? "sticky top-0 z-10" : ""
                  }`}
                >
                  {config.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(column.key)}
                      className="flex min-h-11 w-full cursor-pointer items-center gap-1 px-3 text-left font-semibold focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--dg-accent-text)"
                    >
                      {column.label}
                      <span aria-hidden="true" className="text-(--dg-muted)">
                        {sort?.key === column.key ? (sort.direction === "ascending" ? "↑" : "↓") : "↕"}
                      </span>
                    </button>
                  ) : (
                    <span className="flex min-h-11 items-center px-3 font-semibold">{column.label}</span>
                  )}

                  {config.resizable && index < columns.length - 1 && (
                    <span
                      role="separator"
                      aria-orientation="vertical"
                      aria-label={`${column.label} column width`}
                      aria-valuenow={widths[index]}
                      aria-valuemin={MIN_WIDTH}
                      aria-valuemax={MAX_WIDTH}
                      aria-valuetext={`${widths[index]} pixels`}
                      tabIndex={0}
                      onKeyDown={(event) => onHandleKeyDown(event, index)}
                      onPointerDown={(event) => {
                        drag.current = { index, from: event.clientX, width: widths[index] };
                        (event.target as HTMLElement).setPointerCapture(event.pointerId);
                      }}
                      onPointerMove={(event) => {
                        if (!drag.current) return;
                        setWidth(drag.current.index, drag.current.width + (event.clientX - drag.current.from));
                      }}
                      onPointerUp={() => {
                        drag.current = null;
                      }}
                      className="absolute top-0 right-0 h-full w-2 cursor-col-resize touch-none bg-(--dg-line) opacity-0 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-(--dg-accent-text)"
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.name} className="border-b border-(--dg-line) last:border-0">
                <th scope="row" className="truncate p-3 text-left font-medium">
                  {row.name}
                </th>
                <td className="truncate p-3">{row.owner}</td>
                <td className="truncate p-3">{row.status}</td>
                <td className="truncate p-3">{row.updated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sorting rearranges rows out of view of a screen reader: say what happened. */}
      <p role="status" className="mt-2 text-sm text-(--dg-muted)">
        {sortLabel}
      </p>
    </div>
  );
}
