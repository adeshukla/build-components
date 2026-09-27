import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { TimeRangeConfig } from "../react/time-range";

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

export function renderTimeRangeMarkup(config: TimeRangeConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--tmr-accent: ${config.accentColor}`,
    `--tmr-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...Object.entries(palette).map(([key, value]) => `--tmr-${key}: ${value}`),
  ].join("; ");

  const limits =
    `${config.earliest === "" ? "" : ` min="${escapeHtml(config.earliest)}"`}` +
    `${config.latest === "" ? "" : ` max="${escapeHtml(config.latest)}"`}` +
    ` step="${config.stepMinutes * 60}"`;
  const required = config.required ? " required" : "";

  return `    <div class="tmr tmr--theme-${config.theme}" style="${vars}" data-time-range>
      <fieldset class="tmr-set">
        <legend class="tmr-legend">${escapeHtml(config.legend)}</legend>
        ${config.hint.trim() === "" ? "" : `<p class="tmr-hint" id="tmr-hint">${escapeHtml(config.hint)}</p>`}

        <div class="tmr-pair">
          <div class="tmr-field">
            <label class="tmr-label" for="tmr-from">${escapeHtml(config.fromLabel)}</label>
            <input class="tmr-input" id="tmr-from" name="${escapeHtml(config.name)}From" type="time"${limits}${required}${config.hint.trim() === "" ? "" : ' aria-describedby="tmr-hint"'} data-from>
          </div>
          <div class="tmr-field">
            <label class="tmr-label" for="tmr-to">${escapeHtml(config.toLabel)}</label>
            <input class="tmr-input" id="tmr-to" name="${escapeHtml(config.name)}To" type="time"${limits}${required} data-to>
          </div>
        </div>

        <p class="tmr-error" id="tmr-error" role="alert" hidden data-error></p>
        ${config.showLength ? '<p class="tmr-status" role="status" data-status></p>' : ""}
      </fieldset>
    </div>`;
}

export function renderTimeRangeHtml(config: TimeRangeConfig) {
  return htmlPage({ title: "Time range", slug: "time-range", body: renderTimeRangeMarkup(config), script: true });
}
