import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { SliderConfig } from "../react/slider";

const palettes = {
  light: { surface: "#ffffff", track: "#d9d5e4", text: "#16121f", muted: "#4d4a57" },
  dark: { surface: "#141019", track: "#3a3448", text: "#f6f5fa", muted: "#b6b3c2" },
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

/**
 * Real range inputs ship in the HTML, so the slider works and submits before the script runs.
 * The script only keeps the two ends from crossing and paints the filled part of the track.
 */
export function renderSliderMarkup(config: SliderConfig) {
  const min = config.min;
  const max = Math.max(config.min + config.step, config.max);
  const clamp = (value: number) => Math.min(max, Math.max(min, value));
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const value = clamp(config.startValue);
  const lower = clamp(config.startLower);
  const upper = clamp(config.startUpper);
  const percent = (amount: number) => ((amount - min) / (max - min)) * 100;
  const show = (amount: number) => `${config.prefix}${amount}${config.suffix}`;

  const vars = [
    `--sl-accent: ${config.accentColor}`,
    `--sl-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--sl-surface: ${palette.surface}`,
    `--sl-track: ${palette.track}`,
    `--sl-text: ${palette.text}`,
    `--sl-muted: ${palette.muted}`,
    `--sl-from: ${percent(config.mode === "range" ? lower : min)}%`,
    `--sl-to: ${percent(config.mode === "range" ? upper : value)}%`,
  ].join("; ");

  const describedBy = config.hint.trim() ? ' aria-describedby="slider-hint"' : "";
  const common = `type="range" min="${min}" max="${max}" step="${config.step}"`;

  const track =
    config.mode === "single"
      ? `        <input class="sl-input" ${common} value="${value}" aria-labelledby="slider-label"${describedBy} aria-valuetext="${escapeHtml(show(value))}" data-single>`
      : `        <input class="sl-input sl-input--stacked" ${common} value="${lower}" aria-label="${escapeHtml(config.label)}, lowest"${describedBy} aria-valuetext="${escapeHtml(show(lower))}" data-lower>
        <input class="sl-input sl-input--stacked" ${common} value="${upper}" aria-label="${escapeHtml(config.label)}, highest" aria-valuetext="${escapeHtml(show(upper))}" data-upper>`;

  const output = config.showValue
    ? `        <output class="sl-value" aria-live="polite" data-output>${escapeHtml(
        config.mode === "range" ? `${show(lower)} – ${show(upper)}` : show(value),
      )}</output>\n`
    : "";

  return `    <div class="sl sl--${config.mode} sl--theme-${config.theme}" style="${vars}" data-slider data-prefix="${escapeHtml(config.prefix)}" data-suffix="${escapeHtml(config.suffix)}" data-min="${min}" data-max="${max}">
      <div class="sl-head">
        <p class="sl-label" id="slider-label">${escapeHtml(config.label)}</p>
${output}      </div>
${config.hint.trim() ? `      <p class="sl-hint" id="slider-hint">${escapeHtml(config.hint)}</p>\n` : ""}      <div class="sl-track">
        <span class="sl-rail" aria-hidden="true"></span>
        <span class="sl-fill" aria-hidden="true"></span>
${track}
      </div>
      <div class="sl-ends" aria-hidden="true">
        <span>${escapeHtml(show(min))}</span>
        <span>${escapeHtml(show(max))}</span>
      </div>
    </div>`;
}

export function renderSliderHtml(config: SliderConfig) {
  return htmlPage({ title: "Range slider", slug: "slider", body: renderSliderMarkup(config), script: true });
}
