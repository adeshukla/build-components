import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { ToolbarConfig } from "../react/toolbar";

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

export function renderToolbarMarkup(config: ToolbarConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--tb-accent: ${config.accentColor}`,
    `--tb-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--tb-on-accent: ${luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff"}`,
    ...Object.entries(palette).map(([key, value]) => `--tb-${key}: ${value}`),
  ].join("; ");

  const items = config.items.filter((item) => item.label.trim() !== "");

  const buttons = items
    .map(
      (item, index) =>
        `        <button class="tb-item" type="button" tabindex="${index === 0 ? 0 : -1}"${item.kind === "toggle" ? ' aria-pressed="false"' : ""} data-item data-kind="${escapeHtml(item.kind)}">${escapeHtml(item.label)}</button>`,
    )
    .join("\n");

  return `    <div class="tb tb--theme-${config.theme}" style="${vars}" data-toolbar>
      <!-- One stop for the whole toolbar: Tab goes past it, the arrow keys move inside it. -->
      <div class="tb-bar" role="toolbar" aria-label="${escapeHtml(config.label)}" aria-orientation="${config.orientation}" data-bar>
${buttons}
      </div>
      <!-- Pressing a button in a toolbar changes something elsewhere: say what happened. -->
      <p class="tb-status" role="status" data-status></p>
    </div>`;
}

export function renderToolbarHtml(config: ToolbarConfig) {
  return htmlPage({ title: "Toolbar", slug: "toolbar", body: renderToolbarMarkup(config), script: true });
}
