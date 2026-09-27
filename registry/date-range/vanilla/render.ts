import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { DateRangeConfig } from "../react/date-range";

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6", error: "#b42318" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459", error: "#ff9d95" },
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

export function renderDateRangeMarkup(config: DateRangeConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--dr-accent: ${config.accentColor}`,
    `--dr-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...Object.entries(palette).map(([key, value]) => `--dr-${key}: ${value}`),
  ].join("; ");

  const limits = (extra: string) =>
    `${config.min === "" ? "" : ` min="${escapeHtml(config.min)}"`}${config.max === "" ? "" : ` max="${escapeHtml(config.max)}"`}${extra}`;
  const required = config.required ? " required" : "";

  return `    <div class="dr dr--theme-${config.theme}" style="${vars}" data-date-range data-range-min="${escapeHtml(config.min)}" data-range-max="${escapeHtml(config.max)}">
      <fieldset class="dr-set">
        <legend class="dr-legend">${escapeHtml(config.legend)}</legend>
        ${config.hint.trim() === "" ? "" : `<p class="dr-hint" id="dr-hint">${escapeHtml(config.hint)}</p>`}

        <div class="dr-pair">
          <div class="dr-field">
            <label class="dr-label" for="dr-from">${escapeHtml(config.fromLabel)}</label>
            <input class="dr-input" id="dr-from" name="${escapeHtml(config.name)}From" type="date"${limits("")}${required}${config.hint.trim() === "" ? "" : ' aria-describedby="dr-hint"'} data-from>
          </div>
          <div class="dr-field">
            <label class="dr-label" for="dr-to">${escapeHtml(config.toLabel)}</label>
            <input class="dr-input" id="dr-to" name="${escapeHtml(config.name)}To" type="date"${limits("")}${required} data-to>
          </div>
        </div>

        <p class="dr-error" id="dr-error" role="alert" hidden data-error></p>
        ${config.showSpan ? '<p class="dr-status" role="status" data-status></p>' : ""}
      </fieldset>
    </div>`;
}

export function renderDateRangeHtml(config: DateRangeConfig) {
  return htmlPage({ title: "Date range", slug: "date-range", body: renderDateRangeMarkup(config), script: true });
}
