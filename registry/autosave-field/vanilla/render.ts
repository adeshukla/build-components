import { escapeHtml, htmlPage, luminance, themedColour } from "@/lib/html";
import type { AutosaveFieldConfig } from "../react/autosave-field";

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

export function renderAutosaveFieldMarkup(config: AutosaveFieldConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--asf-accent: ${config.accentColor}`,
    `--asf-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...(config.theme === "system" ? [] : Object.entries(palette).map(([key, value]) => `--asf-${key}: ${themedColour(key, value, dark)}`)),
  ].join("; ");

  return `    <div class="asf asf--theme-${config.theme}" style="${vars}" data-autosave-field>
      <div class="asf-top">
        <label class="asf-label" for="asf-field">${escapeHtml(config.label)}</label>
        <!-- Polite, never assertive: an alert on every pause would interrupt the typing it reports on. -->
        <p class="asf-status" role="status" data-state="clean" data-status></p>
      </div>
      ${config.hint.trim() === "" ? "" : `<p class="asf-hint" id="asf-hint">${escapeHtml(config.hint)}</p>`}

      <textarea class="asf-field" id="asf-field" name="${escapeHtml(config.name)}" rows="${config.rows}" maxlength="${config.maxLength}"${config.hint.trim() === "" ? "" : ' aria-describedby="asf-hint"'} data-field></textarea>

      <button class="asf-retry" type="button" hidden data-retry>${escapeHtml(config.retryLabel)}</button>
    </div>`;
}

export function renderAutosaveFieldHtml(config: AutosaveFieldConfig) {
  return htmlPage({ title: "Autosaving field", slug: "autosave-field", body: renderAutosaveFieldMarkup(config), script: true });
}
