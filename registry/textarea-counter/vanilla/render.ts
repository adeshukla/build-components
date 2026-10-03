import { escapeHtml, htmlPage, luminance, themedColour } from "@/lib/html";
import type { TextareaCounterConfig } from "../react/textarea-counter";

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

export function renderTextareaCounterMarkup(config: TextareaCounterConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--tc-accent: ${config.accentColor}`,
    `--tc-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...(config.theme === "system" ? [] : Object.entries(palette).map(([key, value]) => `--tc-${key}: ${themedColour(key, value, dark)}`)),
  ].join("; ");

  const describedBy = [config.hint.trim() === "" ? "" : "tc-hint", "tc-counter"].filter(Boolean).join(" ");

  return `    <div class="tc tc--theme-${config.theme}" style="${vars}" data-textarea-counter data-max="${config.maxLength}" data-warn="${config.warnAt}">
      <label class="tc-label" for="tc-field">${escapeHtml(config.label)}</label>
${config.hint.trim() === "" ? "" : `      <p class="tc-hint" id="tc-hint">${escapeHtml(config.hint)}</p>\n`}      <!-- With the hard limit the browser stops the typing; without it people can paste and then trim. -->
      <textarea class="tc-field" id="tc-field" name="${escapeHtml(config.name)}" rows="${Math.max(2, config.rows)}"${config.placeholder.trim() === "" ? "" : ` placeholder="${escapeHtml(config.placeholder)}"`}${config.allowOver ? "" : ` maxlength="${config.maxLength}"`} aria-describedby="${describedBy}" data-field></textarea>

      <div class="tc-foot">
        <p class="tc-counter" id="tc-counter" data-counter>${config.maxLength} characters left</p>
        <p class="tc-raw" data-raw>0 / ${config.maxLength}</p>
      </div>

      <p class="tc-error" id="tc-error" role="alert" hidden data-error>${escapeHtml(config.overText)}</p>
      <p class="tc-sr" role="status" data-said></p>
    </div>`;
}

export function renderTextareaCounterHtml(config: TextareaCounterConfig) {
  return htmlPage({ title: "Textarea with counter", slug: "textarea-counter", body: renderTextareaCounterMarkup(config), script: true });
}
