import { escapeHtml, htmlPage, luminance, themedColour } from "@/lib/html";
import type { RowActionsConfig } from "../react/row-actions";

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6", danger: "#b42318" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459", danger: "#ff9d95" },
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

export function renderRowActionsMarkup(config: RowActionsConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--rwa-accent: ${config.accentColor}`,
    `--rwa-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...(config.theme === "system" ? [] : Object.entries(palette).map(([key, value]) => `--rwa-${key}: ${themedColour(key, value, dark)}`)),
  ].join("; ");

  const rows = config.records
    .map((record) => {
      const buttons = config.actions
        .map(
          (action) =>
            `<button class="rwa-action${action.kind === "danger" ? " rwa-action--danger" : ""}" type="button" aria-label="${escapeHtml(`${action.label} ${record.name}`)}" data-action="${escapeHtml(action.label)}" data-record="${escapeHtml(record.name)}">${escapeHtml(action.label)}</button>`,
        )
        .join("");
      return `          <tr class="rwa-row">
            <!-- The name is the row's header, which is what lets a screen reader say it with each cell. -->
            <th class="rwa-name" scope="row" data-row-name>${escapeHtml(record.name)}</th>
            <td class="rwa-meta">${escapeHtml(record.meta)}</td>
            <td class="rwa-actions-cell"><div class="rwa-actions">${buttons}</div></td>
          </tr>`;
    })
    .join("\n");

  return `    <div class="rwa rwa--theme-${config.theme}" style="${vars}" data-row-actions>
      <table class="rwa-table">
        <caption class="rwa-caption">${escapeHtml(config.caption)}</caption>
        <thead class="rwa-head">
          <tr>
            <th scope="col">${escapeHtml(config.nameHeader)}</th>
            <th scope="col">${escapeHtml(config.metaHeader)}</th>
            <!-- The column has a real name. An empty header cell leaves the column unexplained. -->
            <th scope="col">${escapeHtml(config.actionsHeader)}</th>
          </tr>
        </thead>
        <tbody>
${rows}
        </tbody>
      </table>

      <p class="rwa-status" role="status" data-status></p>
    </div>`;
}

export function renderRowActionsHtml(config: RowActionsConfig) {
  return htmlPage({ title: "Row actions", slug: "row-actions", body: renderRowActionsMarkup(config), script: true });
}
