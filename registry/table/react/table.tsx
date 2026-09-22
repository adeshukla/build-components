"use client";

import { useState, useSyncExternalStore, type CSSProperties } from "react";

export type TableConfig = {
  caption: string;
  data: string;
  sortable: boolean;
  selectable: boolean;
  stickyHeader: boolean;
  zebra: boolean;
  density: "comfortable" | "compact";
  small: "stack" | "scroll";
  emptyText: string;
  theme: "light" | "dark" | "system";
  accentColor: string;
  radius: number;
};

// @config-start
const defaultConfig: TableConfig = {
  caption: "Orders this week",
  data: `Order,Customer,Placed,Items,Total
AB-1042,Harbour Studio,12 Mar,3,£186.00
AB-1043,Northwind,12 Mar,1,£24.50
AB-1044,Pilot Labs,13 Mar,7,£412.75
AB-1045,Meridian,14 Mar,2,£68.00`,
  sortable: true,
  selectable: true,
  stickyHeader: false,
  zebra: true,
  density: "comfortable",
  small: "stack",
  emptyText: "No orders yet.",
  theme: "light",
  accentColor: "#2563eb",
  radius: 10,
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#f7f7fb", text: "#16121f", muted: "#4d4a57", line: "#d9d5e4", hover: "#f0eff6" },
  dark: { surface: "#141019", sunk: "#1c1726", text: "#f6f5fa", muted: "#b6b3c2", line: "#3a3448", hover: "#221d2e" },
};

const darkMedia = {
  subscribe: (onChange: () => void) => {
    const list = window.matchMedia("(prefers-color-scheme: dark)");
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  },
  get: () => window.matchMedia("(prefers-color-scheme: dark)").matches,
};

// WCAG relative luminance, used to keep the accent readable as text.
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

/**
 * The table is written as comma-separated lines: the first line names the columns.
 * ponytail: no quoted commas — a cell containing a comma needs the real data source, not this box.
 */
export function parseTable(data: string) {
  const lines = data
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");
  if (lines.length === 0) return { columns: [] as string[], rows: [] as string[][] };
  const columns = lines[0].split(",").map((cell) => cell.trim());
  const rows = lines.slice(1).map((line) => {
    const cells = line.split(",").map((cell) => cell.trim());
    return columns.map((_, index) => cells[index] ?? "");
  });
  return { columns, rows };
}

/** Money, counts and dates sort by value; everything else sorts as text. */
const asNumber = (value: string) => Number(value.replace(/[^0-9.-]/g, ""));
const isNumeric = (value: string) => value.trim() !== "" && Number.isFinite(asNumber(value)) && /\d/.test(value);

export function Table({ config = defaultConfig }: { config?: TableConfig }) {
  const { columns, rows } = parseTable(config.data);
  const [sort, setSort] = useState<{ index: number; direction: "ascending" | "descending" } | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;

  const numeric = columns.map((_, index) => rows.length > 0 && rows.every((row) => isNumeric(row[index])));
  const order = rows.map((_, index) => index);
  if (sort) {
    order.sort((a, b) => {
      const left = rows[a][sort.index];
      const right = rows[b][sort.index];
      const result = numeric[sort.index] ? asNumber(left) - asNumber(right) : left.localeCompare(right);
      return sort.direction === "ascending" ? result : -result;
    });
  }

  const style = {
    "--tl-accent": config.accentColor,
    "--tl-accent-text": readableAccent(config.accentColor, dark),
    "--tl-radius": `${config.radius}px`,
    "--tl-surface": palette.surface,
    "--tl-sunk": palette.sunk,
    "--tl-text": palette.text,
    "--tl-muted": palette.muted,
    "--tl-line": palette.line,
    "--tl-hover": palette.hover,
  } as CSSProperties;
  const focus = "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--tl-accent-text)";
  const pad = config.density === "compact" ? "px-3 py-2" : "px-4 py-3";
  const stack = config.small === "stack";

  if (columns.length === 0 || rows.length === 0) {
    return (
      <div style={style} className="rounded-(--tl-radius) border border-(--tl-line) bg-(--tl-surface) p-6 text-(--tl-muted)">
        {config.emptyText}
      </div>
    );
  }

  return (
    <div style={style} className="bg-(--tl-surface) text-(--tl-text)">
      {config.selectable && (
        <p aria-live="polite" className="mb-2 text-sm text-(--tl-muted)">
          {selected.length === 0 ? "No rows selected" : `${selected.length} of ${rows.length} rows selected`}
        </p>
      )}

      <div
        className={`overflow-x-auto rounded-(--tl-radius) border border-(--tl-line) ${
          config.stickyHeader ? "max-h-96 overflow-y-auto" : ""
        }`}
      >
        {/* The roles are spelled out because stacking the rows on a phone changes `display`,
            and that quietly strips a table of its semantics. */}
        <table role="table" className={`w-full border-collapse text-left text-sm ${stack ? "block sm:table" : ""}`}>
          {/* Block on a phone too, or a stacked table squeezes the caption to a word per line. */}
          <caption className={`px-4 py-3 text-left font-semibold ${stack ? "block sm:table-caption" : ""}`}>{config.caption}</caption>
          <thead
            role="rowgroup"
            className={`bg-(--tl-sunk) ${config.stickyHeader ? "sticky top-0 z-10" : ""} ${
              stack ? "hidden sm:table-header-group" : ""
            }`}
          >
            <tr role="row">
              {config.selectable && (
                <th role="columnheader" scope="col" className={`${pad} w-12`}>
                  <input
                    type="checkbox"
                    checked={selected.length === rows.length}
                    // "Some but not all" is its own state, and the browser draws it for us.
                    ref={(node) => {
                      if (node) node.indeterminate = selected.length > 0 && selected.length < rows.length;
                    }}
                    onChange={(event) => setSelected(event.target.checked ? rows.map((_, index) => index) : [])}
                    aria-label="Select all rows"
                    className={`size-6 accent-(--tl-accent) ${focus}`}
                  />
                </th>
              )}
              {columns.map((column, index) => (
                <th
                  key={column}
                  role="columnheader"
                  scope="col"
                  aria-sort={sort?.index === index ? sort.direction : config.sortable ? "none" : undefined}
                  className={`${pad} font-semibold ${numeric[index] ? "text-right" : ""}`}
                >
                  {config.sortable ? (
                    <button
                      type="button"
                      onClick={() =>
                        setSort(
                          sort?.index === index && sort.direction === "ascending"
                            ? { index, direction: "descending" }
                            : { index, direction: "ascending" },
                        )
                      }
                      className={`inline-flex min-h-6 cursor-pointer items-center gap-1 font-semibold ${focus}`}
                    >
                      {column}
                      <span aria-hidden="true" className={sort?.index === index ? "" : "opacity-30"}>
                        {sort?.index === index && sort.direction === "descending" ? "▾" : "▴"}
                      </span>
                    </button>
                  ) : (
                    column
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody role="rowgroup" className={stack ? "block sm:table-row-group" : ""}>
            {order.map((rowIndex, position) => (
              <tr
                key={rowIndex}
                role="row"
                className={`border-t border-(--tl-line) hover:bg-(--tl-hover) ${
                  config.zebra && position % 2 === 1 ? "bg-(--tl-sunk)" : ""
                } ${stack ? "block p-2 sm:table-row sm:p-0" : ""}`}
              >
                {config.selectable && (
                  <td role="cell" className={`${pad} ${stack ? "block sm:table-cell" : ""}`}>
                    <input
                      type="checkbox"
                      checked={selected.includes(rowIndex)}
                      onChange={(event) =>
                        setSelected(
                          event.target.checked
                            ? [...selected, rowIndex]
                            : selected.filter((entry) => entry !== rowIndex),
                        )
                      }
                      // Named by the row's first cell, so it is not just "checkbox" five times.
                      aria-label={`Select ${rows[rowIndex][0]}`}
                      className={`size-6 accent-(--tl-accent) ${focus}`}
                    />
                  </td>
                )}
                {rows[rowIndex].map((cell, index) => {
                  const Cell = index === 0 ? "th" : "td";
                  return (
                    <Cell
                      key={index}
                      {...(index === 0 ? { scope: "row" as const, role: "rowheader" } : { role: "cell" })}
                      // On a phone each cell carries its column name, so a stacked row still reads.
                      data-label={columns[index]}
                      className={`${pad} font-normal ${numeric[index] ? `tabular-nums ${stack ? "sm:text-right" : "text-right"}` : ""} ${
                        stack
                          ? "block max-sm:px-3 max-sm:py-1 before:font-medium before:text-(--tl-muted) before:content-[attr(data-label)_':_'] sm:table-cell sm:before:content-none"
                          : ""
                      }`}
                    >
                      {cell}
                    </Cell>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
