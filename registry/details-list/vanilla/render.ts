import { escapeHtml, htmlPage, luminance, safeHref } from "@/lib/html";
import type { DetailsListConfig } from "../react/details-list";

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
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

export function renderDetailsListMarkup(config: DetailsListConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--dl-accent: ${config.accentColor}`,
    `--dl-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...Object.entries(palette).map(([key, value]) => `--dl-${key}: ${value}`),
  ].join("; ");

  const rows = config.rows
    .filter((row) => row.term.trim() !== "")
    .map((row) => {
      const empty = row.detail.trim() === "";
      const link =
        row.href.trim() === ""
          ? ""
          : `\n          <a class="dl-edit" href="${escapeHtml(safeHref(row.href))}">${escapeHtml(config.editText)}<span class="dl-sr"> ${escapeHtml(row.term.toLowerCase())}</span></a>`;
      return `      <div class="dl-row">
        <dt class="dl-term">${escapeHtml(row.term)}</dt>
        <dd class="dl-detail">
          <span class="dl-value${empty ? " dl-value--empty" : ""}">${escapeHtml(empty ? config.emptyText : row.detail)}</span>${link}
        </dd>
      </div>`;
    })
    .join("\n");

  return `    <div class="dl dl--theme-${config.theme} dl--${config.columns}${config.dividers ? " dl--dividers" : ""}" style="${vars}" data-details-list>
${config.heading.trim() === "" ? "" : `      <h2 class="dl-heading">${escapeHtml(config.heading)}</h2>\n`}      <dl class="dl-list">
${rows}
      </dl>
    </div>`;
}

export function renderDetailsListHtml(config: DetailsListConfig) {
  return htmlPage({ title: "Details list", slug: "details-list", body: renderDetailsListMarkup(config), script: false });
}
