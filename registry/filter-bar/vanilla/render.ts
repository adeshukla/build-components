import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { FilterBarConfig } from "../react/filter-bar";

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

export function renderFilterBarMarkup(config: FilterBarConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--fb-accent: ${config.accentColor}`,
    `--fb-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--fb-on-accent: ${luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff"}`,
    ...Object.entries(palette).map(([key, value]) => `--fb-${key}: ${value}`),
  ].join("; ");

  const filters = config.filters.filter((filter) => filter.label.trim() !== "");
  const groups = [...new Set(filters.map((filter) => filter.group))];

  const chips = groups
    .map(
      (group) => `      <div class="fb-group" role="group" aria-label="${escapeHtml(group)}">
        <p class="fb-group-name">${escapeHtml(group)}</p>
        <div class="fb-chips">
${filters
  .filter((filter) => filter.group === group)
  .map(
    (filter) =>
      `          <button class="fb-chip" type="button" aria-pressed="false" data-chip data-group="${escapeHtml(filter.group)}" data-label="${escapeHtml(filter.label)}">${escapeHtml(filter.label)}</button>`,
  )
  .join("\n")}
        </div>
      </div>`,
    )
    .join("\n");

  return `    <div class="fb fb--theme-${config.theme}" style="${vars}" data-filter-bar>
      <div class="fb-head">
        <p class="fb-title">${escapeHtml(config.label)}</p>
${config.clearAll ? `        <button class="fb-clear" type="button" hidden data-clear>Clear all</button>` : ""}
      </div>
${chips}
${config.showPills ? `      <ul class="fb-pills" aria-label="Applied filters" hidden data-pills></ul>` : ""}
      <!-- What changed, said once, for people who cannot see the chips light up. -->
      <p class="fb-status" role="status" data-status>No filters applied</p>
    </div>`;
}

export function renderFilterBarHtml(config: FilterBarConfig) {
  return htmlPage({ title: "Filter bar", slug: "filter-bar", body: renderFilterBarMarkup(config), script: true });
}
