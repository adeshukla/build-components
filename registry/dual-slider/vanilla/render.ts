import { escapeHtml, htmlPage, luminance, themedColour } from "@/lib/html";
import type { DualSliderConfig } from "../react/dual-slider";

const palettes = {
  light: { surface: "#ffffff", sunk: "#eae7f2", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
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

/** Grouped by hand, the same way the React output does it. */
function group(value: number) {
  const [whole, fraction] = Math.abs(value).toString().split(".");
  const spaced = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${value < 0 ? "-" : ""}${spaced}${fraction ? `.${fraction}` : ""}`;
}

export function renderDualSliderMarkup(config: DualSliderConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--dsl-accent: ${config.accentColor}`,
    `--dsl-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...(config.theme === "system" ? [] : Object.entries(palette).map(([key, value]) => `--dsl-${key}: ${themedColour(key, value, dark)}`)),
  ].join("; ");

  const say = (value: number) => `${config.valuePrefix}${group(value)}${config.valueSuffix}`;
  const span = config.max - config.min || 1;
  const left = ((config.startLow - config.min) / span) * 100;
  const right = ((config.startHigh - config.min) / span) * 100;
  const limits = ` min="${config.min}" max="${config.max}" step="${config.step}"`;

  return `    <div class="dsl dsl--theme-${config.theme}" style="${vars}" data-dual-slider>
      <fieldset class="dsl-set">
        <legend class="dsl-legend">${escapeHtml(config.legend)}</legend>
        ${config.hint.trim() === "" ? "" : `<p class="dsl-hint" id="dsl-hint">${escapeHtml(config.hint)}</p>`}

        ${
          config.showBar
            ? `<div class="dsl-bar" aria-hidden="true"><div class="dsl-fill" style="margin-left: ${left}%; width: ${Math.max(right - left, 1)}%" data-fill></div></div>`
            : ""
        }

        <div class="dsl-row">
          <label class="dsl-label" for="dsl-low"><span>${escapeHtml(config.lowLabel)}</span><span class="dsl-value" data-low-value>${escapeHtml(say(config.startLow))}</span></label>
          <input class="dsl-input" id="dsl-low" name="${escapeHtml(config.name)}Min" type="range"${limits} value="${config.startLow}" aria-valuetext="${escapeHtml(say(config.startLow))}"${config.hint.trim() === "" ? "" : ' aria-describedby="dsl-hint"'} data-low>
        </div>

        <div class="dsl-row">
          <label class="dsl-label" for="dsl-high"><span>${escapeHtml(config.highLabel)}</span><span class="dsl-value" data-high-value>${escapeHtml(say(config.startHigh))}</span></label>
          <input class="dsl-input" id="dsl-high" name="${escapeHtml(config.name)}Max" type="range"${limits} value="${config.startHigh}" aria-valuetext="${escapeHtml(say(config.startHigh))}" data-high>
        </div>

        <p class="dsl-status" role="status" data-status>${escapeHtml(`${say(config.startLow)} to ${say(config.startHigh)}`)}</p>
      </fieldset>
    </div>`;
}

export function renderDualSliderHtml(config: DualSliderConfig) {
  return htmlPage({ title: "Dual range slider", slug: "dual-slider", body: renderDualSliderMarkup(config), script: true });
}
