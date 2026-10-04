import { escapeHtml, htmlPage, luminance, themedColour } from "@/lib/html";
import type { ErrorSummaryConfig } from "../react/error-summary";

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

const nameFor = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export function renderErrorSummaryMarkup(config: ErrorSummaryConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--esm-accent: ${config.accentColor}`,
    `--esm-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--esm-on-accent: ${luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff"}`,
    ...(config.theme === "system" ? [] : Object.entries(palette).map(([key, value]) => `--esm-${key}: ${themedColour(key, value, dark)}`)),
  ].join("; ");

  const rows = config.fields
    .map((field, index) => {
      const id = `esm-field-${index}`;
      const type = field.kind === "email" ? "email" : field.kind === "tel" ? "tel" : "text";
      return `          <div class="esm-row">
            <label class="esm-label" for="${id}">${escapeHtml(field.label)}${field.required === "yes" ? "" : ` <span class="esm-optional">${escapeHtml(config.optionalText)}</span>`}</label>
            <p class="esm-message" id="${id}-message" data-message-for="${id}" hidden></p>
            <input class="esm-input" id="${id}" name="${escapeHtml(nameFor(field.label))}" type="${type}" data-field data-field-label="${escapeHtml(field.label)}" data-field-required="${field.required}">
          </div>`;
    })
    .join("\n");

  return `    <div class="esm esm--theme-${config.theme}" style="${vars}" data-error-summary>
      <form novalidate>
        <!-- A focusable region, announced once by the move rather than twice by a live region. -->
        <div class="esm-summary" tabindex="-1" role="group" aria-labelledby="esm-summary-heading" hidden data-summary>
          <${config.headingLevel} class="esm-summary-heading" id="esm-summary-heading" data-summary-heading>${escapeHtml(config.heading)}</${config.headingLevel}>
          <ul class="esm-list" data-list></ul>
        </div>

        <fieldset class="esm-set">
          <legend class="esm-legend">${escapeHtml(config.legend)}</legend>
${rows}
        </fieldset>

        <button class="esm-submit" type="submit">${escapeHtml(config.submitLabel)}</button>
        <p class="esm-status" role="status" data-status></p>
      </form>
    </div>`;
}

export function renderErrorSummaryHtml(config: ErrorSummaryConfig) {
  return htmlPage({ title: "Error summary", slug: "error-summary", body: renderErrorSummaryMarkup(config), script: true });
}
