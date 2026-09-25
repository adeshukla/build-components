import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { SegmentedConfig } from "../react/segmented";

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#d9d5e4" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#3a3448" },
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

/** Real radios: one Tab stop, arrow keys between the choices, and the form submits the picked one. */
export function renderSegmentedMarkup(config: SegmentedConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--sg-accent: ${config.accentColor}`,
    `--sg-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--sg-on-accent: ${luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff"}`,
    ...Object.entries(palette).map(([key, value]) => `--sg-${key}: ${value}`),
  ].join("; ");
  const options = config.options.map((option) => option.label).filter((label) => label.trim() !== "");
  const picked = Math.min(Math.max(0, Math.round(config.startIndex)), Math.max(0, options.length - 1));

  const items = options
    .map(
      (label, index) => `          <label class="sg-option">
            <input class="sg-input" type="radio" name="${escapeHtml(config.name || "segmented")}" value="${escapeHtml(label)}"${index === picked ? " checked" : ""}>
            <span class="sg-label">${escapeHtml(label)}</span>
          </label>`,
    )
    .join("\n");

  return `    <fieldset class="sg sg--${config.size}${config.fullWidth ? " sg--full" : ""} sg--theme-${config.theme}" style="${vars}" data-segmented>
      <legend class="sg-legend${config.hideLegend ? " sg-sr" : ""}">${escapeHtml(config.legend)}</legend>
      <div class="sg-group">
${items}
      </div>
    </fieldset>`;
}

export function renderSegmentedHtml(config: SegmentedConfig) {
  return htmlPage({ title: "Segmented control", slug: "segmented", body: renderSegmentedMarkup(config), script: false });
}
