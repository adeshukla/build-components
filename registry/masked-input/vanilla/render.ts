import { escapeHtml, htmlPage, luminance, themedColour } from "@/lib/html";
import type { MaskedInputConfig } from "../react/masked-input";

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

export function renderMaskedInputMarkup(config: MaskedInputConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--mi-accent: ${config.accentColor}`,
    `--mi-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...(config.theme === "system" ? [] : Object.entries(palette).map(([key, value]) => `--mi-${key}: ${themedColour(key, value, dark)}`)),
  ].join("; ");

  const example = config.mask.replace(/#/g, "0").replace(/[A*]/g, "X");
  const hint = config.hint.trim() !== "" ? config.hint : config.showExample ? fill(config.exampleText, { example }) : "";
  const numeric = /^[#\s\-/]+$/.test(config.mask);

  return `    <div class="mi mi--theme-${config.theme}" style="${vars}" data-masked-input data-mask="${escapeHtml(config.mask)}" data-label="${escapeHtml(config.label)}">
      <label class="mi-label" for="mi-field">${escapeHtml(config.label)}</label>
      <!-- The shape is said in the hint, not left to be discovered by typing into a field that fights back. -->
      <p class="mi-hint" id="mi-hint">${escapeHtml(hint)}</p>

      <input class="mi-field" id="mi-field" name="${escapeHtml(config.name)}" type="text" inputmode="${numeric ? "numeric" : "text"}" autocomplete="off" aria-describedby="mi-hint" data-field>

      <p class="mi-error" id="mi-error" role="alert" hidden data-error>${escapeHtml(config.errorText)}</p>
      <p class="mi-status" role="status" data-status></p>
    </div>`;
}

export function renderMaskedInputHtml(config: MaskedInputConfig) {
  return htmlPage({ title: "Masked input", slug: "masked-input", body: renderMaskedInputMarkup(config), script: true });
}
