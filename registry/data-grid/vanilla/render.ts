import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { DataGridConfig } from "../react/data-grid";

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
};

const columns = [
  { key: "name", label: "Name", width: 220 },
  { key: "owner", label: "Owner", width: 140 },
  { key: "status", label: "Status", width: 150 },
  { key: "updated", label: "Updated", width: 150 },
] as const;

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

export function renderDataGridMarkup(config: DataGridConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--dg-accent: ${config.accentColor}`,
    `--dg-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...Object.entries(palette).map(([key, value]) => `--dg-${key}: ${value}`),
  ].join("; ");

  const rows = config.rows.filter((row) => row.name.trim() !== "");

  const headers = columns
    .map((column, index) => {
      const handle =
        config.resizable && index < columns.length - 1
          ? `\n          <span class="dg-handle" role="separator" aria-orientation="vertical" aria-label="${escapeHtml(column.label)} column width" aria-valuenow="${column.width}" aria-valuemin="96" aria-valuemax="480" aria-valuetext="${column.width} pixels" tabindex="0" data-handle data-index="${index}"></span>`
          : "";
      const inner = config.sortable
        ? `<button class="dg-sort" type="button" data-sort="${column.key}">${escapeHtml(column.label)}<span class="dg-arrow" aria-hidden="true">↕</span></button>`
        : `<span class="dg-plain">${escapeHtml(column.label)}</span>`;
      return `        <th class="dg-th" scope="col"${config.sortable ? ' aria-sort="none"' : ""} data-column="${column.key}">${inner}${handle}
        </th>`;
    })
    .join("\n");

  const body = rows
    .map(
      (row) => `        <tr class="dg-row">
          <th class="dg-cell dg-cell--head" scope="row">${escapeHtml(row.name)}</th>
          <td class="dg-cell">${escapeHtml(row.owner)}</td>
          <td class="dg-cell">${escapeHtml(row.status)}</td>
          <td class="dg-cell">${escapeHtml(row.updated)}</td>
        </tr>`,
    )
    .join("\n");

  return `    <div class="dg dg--theme-${config.theme}" style="${vars}" data-data-grid>
      <!-- A region that scrolls has to be reachable by keyboard, so it takes focus and carries the caption's name. -->
      <div class="dg-scroll${config.stickyHeader ? " dg--sticky" : ""}" role="region" aria-labelledby="dg-caption" tabindex="0"${config.maxHeight > 0 ? ` style="max-height: ${config.maxHeight}px"` : ""}>
        <table class="dg-table">
          <caption class="dg-caption" id="dg-caption">${escapeHtml(config.caption)}</caption>
          <colgroup>
${columns.map((column) => `            <col style="width: ${column.width}px" data-col="${column.key}">`).join("\n")}
          </colgroup>
          <thead>
      <tr>
${headers}
      </tr>
          </thead>
          <tbody data-body>
${body}
          </tbody>
        </table>
      </div>
      <!-- Sorting rearranges rows out of view of a screen reader: say what happened. -->
      <p class="dg-status" role="status" data-status>Not sorted</p>
    </div>`;
}

export function renderDataGridHtml(config: DataGridConfig) {
  return htmlPage({ title: "Data grid", slug: "data-grid", body: renderDataGridMarkup(config), script: true });
}
