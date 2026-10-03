import { escapeHtml, htmlPage, luminance, themedColour } from "@/lib/html";
import type { CheckboxGroupConfig } from "../react/checkbox-group";

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

export function renderCheckboxGroupMarkup(config: CheckboxGroupConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--cg-accent: ${config.accentColor}`,
    `--cg-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...(config.theme === "system" ? [] : Object.entries(palette).map(([key, value]) => `--cg-${key}: ${themedColour(key, value, dark)}`)),
  ].join("; ");

  const options = config.options.filter((option) => option.label.trim() !== "");

  const boxes = options
    .map(
      (option) => `          <label class="cg-option">
            <input class="cg-box" type="checkbox" name="${escapeHtml(config.name)}" value="${escapeHtml(option.label)}" data-option>
            <span>
              <span class="cg-label">${escapeHtml(option.label)}</span>
${option.note.trim() === "" ? "" : `              <span class="cg-note">${escapeHtml(option.note)}</span>\n`}            </span>
          </label>`,
    )
    .join("\n");

  const selectAll =
    config.showSelectAll && options.length > 1
      ? `        <label class="cg-all">
          <input class="cg-box" type="checkbox" data-all>
          <span>${escapeHtml(config.selectAllLabel)}</span>
        </label>\n`
      : "";

  return `    <div class="cg cg--theme-${config.theme} cg--${config.columns}" style="${vars}" data-checkbox-group data-min="${Math.max(0, config.minRequired)}" data-error-text="${escapeHtml(config.errorText)}">
      <fieldset class="cg-set" aria-describedby="cg-hint">
        <legend class="cg-legend">${escapeHtml(config.legend)}</legend>
${config.hint.trim() === "" ? "" : `        <p class="cg-hint" id="cg-hint">${escapeHtml(config.hint)}</p>\n`}${selectAll}        <div class="cg-options">
${boxes}
        </div>
        <p class="cg-error" id="cg-error" role="alert" hidden data-error></p>
      </fieldset>
${config.showCount ? `      <!-- Said politely rather than on every tick. -->\n      <p class="cg-count" role="status" data-count>0 of ${options.length} picked</p>\n` : ""}      <button class="cg-save" type="button" data-save>Save choices</button>
    </div>`;
}

export function renderCheckboxGroupHtml(config: CheckboxGroupConfig) {
  return htmlPage({ title: "Checkbox group", slug: "checkbox-group", body: renderCheckboxGroupMarkup(config), script: true });
}
