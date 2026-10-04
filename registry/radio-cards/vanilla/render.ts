import { escapeHtml, htmlPage, luminance, themedColour } from "@/lib/html";
import type { RadioCardsConfig } from "../react/radio-cards";

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

export function renderRadioCardsMarkup(config: RadioCardsConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--rc-accent: ${config.accentColor}`,
    `--rc-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...(config.theme === "system" ? [] : Object.entries(palette).map(([key, value]) => `--rc-${key}: ${themedColour(key, value, dark)}`)),
  ].join("; ");

  const options = config.options.filter((option) => option.label.trim() !== "");

  const cards = options
    .map((option) => {
      const off = option.state === "off";
      return `          <label class="rc-card">
            <input class="rc-sr" type="radio" name="${escapeHtml(config.name)}" value="${escapeHtml(option.label)}"${off ? " disabled" : ""} data-option>
            <span class="rc-top">
              <span class="rc-label">${config.showTick ? `<span class="rc-tick" aria-hidden="true" hidden data-tick="${escapeHtml(option.label)}">✓</span>` : ""}<span>${escapeHtml(option.label)}</span></span>
${option.meta.trim() === "" ? "" : `              <span class="rc-meta">${escapeHtml(option.meta)}</span>\n`}            </span>
${option.note.trim() === "" ? "" : `            <span class="rc-note">${escapeHtml(option.note)}</span>\n`}${off ? `            <!-- Unavailable is said, not only drawn as a dashed border. -->\n            <span class="rc-off">${escapeHtml(config.unavailableText)}</span>\n` : ""}          </label>`;
    })
    .join("\n");

  return `    <div class="rc rc--theme-${config.theme} rc--${config.columns}" style="${vars}" data-radio-cards data-none="${escapeHtml(config.noneText)}" data-picked="${escapeHtml(config.pickedText)}">
      <fieldset class="rc-set"${config.hint.trim() === "" ? "" : ' aria-describedby="rc-hint"'}>
        <legend class="rc-legend">${escapeHtml(config.legend)}</legend>
${config.hint.trim() === "" ? "" : `        <p class="rc-hint" id="rc-hint">${escapeHtml(config.hint)}</p>\n`}        <div class="rc-grid">
${cards}
        </div>
      </fieldset>
      <p class="rc-status" role="status" data-status>${escapeHtml(config.noneText)}</p>
    </div>`;
}

export function renderRadioCardsHtml(config: RadioCardsConfig) {
  return htmlPage({ title: "Radio cards", slug: "radio-cards", body: renderRadioCardsMarkup(config), script: true });
}
