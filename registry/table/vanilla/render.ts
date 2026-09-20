import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import { parseTable, type TableConfig } from "../react/table";

const palettes = {
  light: { surface: "#ffffff", sunk: "#f7f7fb", text: "#16121f", muted: "#4d4a57", line: "#d9d5e4", hover: "#f0eff6" },
  dark: { surface: "#141019", sunk: "#1c1726", text: "#f6f5fa", muted: "#b6b3c2", line: "#3a3448", hover: "#221d2e" },
};

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

const asNumber = (value: string) => Number(value.replace(/[^0-9.-]/g, ""));
const isNumeric = (value: string) => value.trim() !== "" && Number.isFinite(asNumber(value)) && /\d/.test(value);

/**
 * The table ships as a real HTML table with every row in place, so it reads and prints before
 * the script runs. The script adds sorting and selection.
 */
export function renderTableMarkup(config: TableConfig) {
  const { columns, rows } = parseTable(config.data);
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--tl-accent: ${config.accentColor}`,
    `--tl-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--tl-radius: ${config.radius}px`,
    `--tl-surface: ${palette.surface}`,
    `--tl-sunk: ${palette.sunk}`,
    `--tl-text: ${palette.text}`,
    `--tl-muted: ${palette.muted}`,
    `--tl-line: ${palette.line}`,
    `--tl-hover: ${palette.hover}`,
  ].join("; ");
  const classes = [
    "tl",
    `tl--${config.density}`,
    `tl--${config.small}`,
    `tl--theme-${config.theme}`,
    config.zebra ? "tl--zebra" : "",
    config.stickyHeader ? "tl--sticky" : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (columns.length === 0 || rows.length === 0) {
    return `    <div class="${classes}" style="${vars}">
      <p class="tl-empty">${escapeHtml(config.emptyText)}</p>
    </div>`;
  }

  const numeric = columns.map((_, index) => rows.every((row) => isNumeric(row[index])));

  const heads = columns
    .map((column, index) => {
      const align = numeric[index] ? ' class="tl-number"' : "";
      const inner = config.sortable
        ? `<button class="tl-sort" type="button" data-sort="${index}">${escapeHtml(column)}<span class="tl-arrow" aria-hidden="true">▴</span></button>`
        : escapeHtml(column);
      return `            <th role="columnheader" scope="col"${align}${config.sortable ? ' aria-sort="none"' : ""}>${inner}</th>`;
    })
    .join("\n");

  const body = rows
    .map(
      (row, rowIndex) => `          <tr role="row" data-row="${rowIndex}">
${
  config.selectable
    ? `            <td role="cell" class="tl-pick"><input type="checkbox" aria-label="Select ${escapeHtml(row[0])}" data-select="${rowIndex}"></td>\n`
    : ""
}${row
        .map((cell, index) =>
          index === 0
            ? `            <th role="rowheader" scope="row" data-label="${escapeHtml(columns[index])}"${numeric[index] ? ' class="tl-number"' : ""}>${escapeHtml(cell)}</th>`
            : `            <td role="cell" data-label="${escapeHtml(columns[index])}"${numeric[index] ? ' class="tl-number"' : ""}>${escapeHtml(cell)}</td>`,
        )
        .join("\n")}
          </tr>`,
    )
    .join("\n");

  const selectAll = config.selectable
    ? `            <th role="columnheader" scope="col" class="tl-pick"><input type="checkbox" aria-label="Select all rows" data-select-all></th>\n`
    : "";
  const count = config.selectable
    ? `      <p class="tl-count" aria-live="polite" data-count>No rows selected</p>\n`
    : "";

  return `    <div class="${classes}" style="${vars}" data-table data-rows="${rows.length}">
${count}      <div class="tl-frame">
        <!-- The roles are spelled out because stacking the rows on a phone changes display,
             and that quietly strips a table of its semantics. -->
        <table class="tl-table" role="table">
          <caption class="tl-caption">${escapeHtml(config.caption)}</caption>
          <thead role="rowgroup">
            <tr role="row">
${selectAll}${heads}
            </tr>
          </thead>
          <tbody role="rowgroup" data-body>
${body}
          </tbody>
        </table>
      </div>
    </div>`;
}

export function renderTableHtml(config: TableConfig) {
  return htmlPage({ title: "Data table", slug: "table", body: renderTableMarkup(config), script: true });
}
