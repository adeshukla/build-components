import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { SignaturePadConfig } from "../react/signature-pad";

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6", ink: "#16121f" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459", ink: "#f6f5fa" },
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

export function renderSignaturePadMarkup(config: SignaturePadConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--sp-accent: ${config.accentColor}`,
    `--sp-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--sp-on-accent: ${luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff"}`,
    ...Object.entries(palette)
      .filter(([key]) => key !== "ink")
      .map(([key, value]) => `--sp-${key}: ${value}`),
  ].join("; ");

  const typed = config.typedAlternative
    ? `      <div class="sp-typed-group">
        <label class="sp-typed-label" for="sp-typed">${escapeHtml(config.typedLabel)}</label>
        <input class="sp-typed" id="sp-typed" type="text" autocomplete="name" data-typed>
      </div>\n`
    : "";

  return `    <div class="sp sp--theme-${config.theme}" style="${vars}" data-signature-pad data-ink="${palette.ink}">
      <p class="sp-label" id="sp-label">${escapeHtml(config.label)}</p>
      <p class="sp-hint" id="sp-hint">${escapeHtml(config.hint)}${config.typedAlternative ? " A drawing needs a pointer, so you can type your name instead." : ""}</p>

      <!-- The drawing is a picture of a name, so it carries a label and its state in words. -->
      <canvas class="sp-canvas" width="600" height="180" role="img" aria-labelledby="sp-label" aria-describedby="sp-hint" data-canvas></canvas>

${typed}      <div class="sp-actions">
        <button class="sp-clear" type="button" data-clear>${escapeHtml(config.clearText)}</button>
        <button class="sp-confirm" type="button" disabled data-confirm>${escapeHtml(config.confirmText)}</button>
      </div>

      <!-- Whether there is a signature at all is invisible to anyone not looking at the box. -->
      <p class="sp-status" role="status" data-status>Nothing signed yet</p>
    </div>`;
}

export function renderSignaturePadHtml(config: SignaturePadConfig) {
  return htmlPage({ title: "Signature pad", slug: "signature-pad", body: renderSignaturePadMarkup(config), script: true });
}
