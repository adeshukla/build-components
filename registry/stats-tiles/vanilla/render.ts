import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { StatsTilesConfig } from "../react/stats-tiles";

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

/** Anything that is not up or down is drawn flat, so a typo cannot invent a direction. */
const arrows: Record<string, string> = { up: "↑", down: "↓", flat: "→" };
const direction = (value: string) => (value === "up" || value === "down" ? value : "flat");

export function renderStatsTilesMarkup(config: StatsTilesConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--sx-accent: ${config.accentColor}`,
    `--sx-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...Object.entries(palette).map(([key, value]) => `--sx-${key}: ${value}`),
  ].join("; ");

  const tiles = config.tiles
    .filter((tile) => tile.label.trim() !== "")
    .map((tile) => {
      const way = direction(tile.direction);
      const change =
        config.showChange && tile.change.trim() !== ""
          ? `\n          <span class="sx-change"><span class="sx-arrow sx-arrow--${way}" aria-hidden="true">${arrows[way]}</span>${escapeHtml(tile.change)}</span>`
          : "";
      return `      <div class="sx-tile">
        <dt class="sx-label">${escapeHtml(tile.label)}</dt>
        <dd class="sx-body">
          <span class="sx-value">${escapeHtml(tile.value)}</span>${change}
        </dd>
      </div>`;
    })
    .join("\n");

  return `    <div class="sx sx--theme-${config.theme} sx--${config.columns}" style="${vars}" data-stats-tiles>
      <h2 class="sx-heading">${escapeHtml(config.heading)}</h2>
      <!-- A description list: the label is the term, the number is the description. -->
      <dl class="sx-list">
${tiles}
      </dl>
    </div>`;
}

export function renderStatsTilesHtml(config: StatsTilesConfig) {
  return htmlPage({ title: "Stats tiles", slug: "stats-tiles", body: renderStatsTilesMarkup(config), script: false });
}
