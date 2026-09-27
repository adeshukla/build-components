import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { ToggleGroupConfig } from "../react/toggle-group";

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

export function renderToggleGroupMarkup(config: ToggleGroupConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--tg-accent: ${config.accentColor}`,
    `--tg-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--tg-on-accent: ${luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff"}`,
    ...Object.entries(palette).map(([key, value]) => `--tg-${key}: ${value}`),
  ].join("; ");

  const options = config.options
    .filter((option) => option.label.trim() !== "")
    .map(
      (option) => `          <label class="tg-option">
            <input class="tg-sr" type="checkbox" name="${escapeHtml(config.name)}" value="${escapeHtml(option.value || option.label)}" data-option>
            ${escapeHtml(option.label)}
          </label>`,
    )
    .join("\n");

  return `    <div class="tg tg--theme-${config.theme} tg--${config.size}" style="${vars}" data-toggle-group data-min-one="${config.minOne}">
      <!-- Checkboxes, not buttons: several answers to one question, and the form sends them itself. -->
      <fieldset class="tg-set"${config.hint.trim() === "" ? "" : ' aria-describedby="tg-hint"'}>
        <legend class="tg-legend">${escapeHtml(config.legend)}</legend>
${config.hint.trim() === "" ? "" : `        <p class="tg-hint" id="tg-hint">${escapeHtml(config.hint)}</p>\n`}        <div class="tg-options">
${options}
        </div>
      </fieldset>
${config.showCount ? `      <p class="tg-status" role="status" data-status>Nothing picked</p>\n` : ""}    </div>`;
}

export function renderToggleGroupHtml(config: ToggleGroupConfig) {
  return htmlPage({ title: "Toggle group", slug: "toggle-group", body: renderToggleGroupMarkup(config), script: true });
}
