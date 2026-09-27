import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { CircularProgressConfig } from "../react/circular-progress";

const palettes = {
  light: { surface: "#ffffff", sunk: "#e6e3ef", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#141019", sunk: "#2c2639", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
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

export function renderCircularProgressMarkup(config: CircularProgressConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--cpr-accent: ${config.accentColor}`,
    `--cpr-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...Object.entries(palette).map(([key, value]) => `--cpr-${key}: ${value}`),
  ].join("; ");

  const radius = (config.size - config.thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const shown = Math.round(Math.min(Math.max(config.value, 0), 100));
  const indeterminate = config.mode === "indeterminate";
  // An indeterminate progressbar is one with no aria-valuenow. Inventing a number would be a lie.
  const values = indeterminate
    ? ' aria-busy="true"'
    : ` aria-valuemin="0" aria-valuemax="100" aria-valuenow="${shown}" aria-valuetext="${shown}% ${escapeHtml(config.unitText)}"`;
  const dash = indeterminate
    ? `stroke-dasharray: ${(circumference * 0.28).toFixed(2)} ${circumference.toFixed(2)}`
    : `stroke-dasharray: ${circumference.toFixed(2)}; stroke-dashoffset: ${(circumference * (1 - shown / 100)).toFixed(2)}`;

  return `    <div class="cpr cpr--theme-${config.theme} cpr--${config.mode}" style="${vars}" data-circular-progress>
      <div class="cpr-row">
        <div class="cpr-dial" style="width: ${config.size}px; height: ${config.size}px" role="progressbar" aria-labelledby="cpr-label"${values} data-progress>
          <svg class="cpr-svg" viewBox="0 0 ${config.size} ${config.size}">
            <circle class="cpr-track" cx="${config.size / 2}" cy="${config.size / 2}" r="${radius}" stroke-width="${config.thickness}"></circle>
            <circle class="cpr-arc" cx="${config.size / 2}" cy="${config.size / 2}" r="${radius}" stroke-width="${config.thickness}" style="${dash}" data-circumference="${circumference}" data-arc></circle>
          </svg>
          ${
            config.showValue && !indeterminate
              ? `<span class="cpr-face" aria-hidden="true" data-face>${shown}%</span>`
              : ""
          }
        </div>

        <div>
          <p class="cpr-label" id="cpr-label">${escapeHtml(config.label)}</p>
          <p class="cpr-detail" data-detail>${indeterminate ? escapeHtml(config.busyText) : `${shown}% ${escapeHtml(config.unitText)}`}</p>
          ${indeterminate ? "" : `<button class="cpr-run" type="button" data-run>${escapeHtml(config.runLabel)}</button>`}
        </div>
      </div>

      <p class="cpr-status" role="status" data-status></p>
    </div>`;
}

export function renderCircularProgressHtml(config: CircularProgressConfig) {
  return htmlPage({
    title: "Circular progress",
    slug: "circular-progress",
    body: renderCircularProgressMarkup(config),
    script: true,
  });
}
