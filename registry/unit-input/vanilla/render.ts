import { escapeHtml, htmlPage, luminance, themedColour } from "@/lib/html";
import type { UnitInputConfig } from "../react/unit-input";

/** Words with something put in them: "{count} left" (D94). */
const fill = (words: string, values: Record<string, string | number>) => words.replace(/\{(\w+)\}/g, (match, name) => String(values[name] ?? match));

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

export function renderUnitInputMarkup(config: UnitInputConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--ui-accent: ${config.accentColor}`,
    `--ui-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...(config.theme === "system" ? [] : Object.entries(palette).map(([key, value]) => `--ui-${key}: ${themedColour(key, value, dark)}`)),
  ].join("; ");

  const units = config.units
    .filter((unit) => unit.label.trim() !== "")
    .map((unit) => `          <option value="${escapeHtml(unit.value)}">${escapeHtml(unit.label)}</option>`)
    .join("\n");

  return `    <div class="ui ui--theme-${config.theme}" style="${vars}" data-unit-input data-min="${config.min}" data-max="${config.max}">
      <label class="ui-label" for="ui-amount">${escapeHtml(config.label)}</label>
${config.hint.trim() === "" ? "" : `      <p class="ui-hint" id="ui-hint">${escapeHtml(config.hint)}</p>\n`}
      <!-- Two fields, one answer: the number and the unit are separately labelled. -->
      <div class="ui-row">
        <input class="ui-amount" id="ui-amount" name="${escapeHtml(config.name)}" type="text" inputmode="decimal" autocomplete="off" min="${config.min}" max="${config.max}" step="${config.step}"${config.hint.trim() === "" ? "" : ' aria-describedby="ui-hint"'} data-amount>
        <label class="ui-sr" for="ui-unit">${escapeHtml(fill(config.unitLabel, { label: config.label.toLowerCase() }))}</label>
        <select class="ui-unit" id="ui-unit" name="${escapeHtml(config.unitName)}" data-unit>
${units}
        </select>
      </div>

      <p class="ui-error" id="ui-error" role="alert" hidden data-error>${escapeHtml(config.errorText)}</p>
      <!-- The pair read back as one answer, which is how it will be used. -->
      <p class="ui-status" role="status" data-status></p>
    </div>`;
}

export function renderUnitInputHtml(config: UnitInputConfig) {
  return htmlPage({ title: "Value with unit", slug: "unit-input", body: renderUnitInputMarkup(config), script: true });
}
