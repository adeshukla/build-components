import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { ConfirmDialogConfig } from "../react/confirm-dialog";

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#1c1826", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
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

export function renderConfirmDialogMarkup(config: ConfirmDialogConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--cd-accent: ${config.accentColor}`,
    `--cd-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--cd-on-accent: ${luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff"}`,
    ...Object.entries(palette).map(([key, value]) => `--cd-${key}: ${value}`),
  ].join("; ");

  const field = config.requirePhrase
    ? `        <div class="cd-group">
          <label class="cd-label" for="cd-field">Type ${escapeHtml(config.phrase)} to confirm</label>
          <input class="cd-field" id="cd-field" type="text" autocomplete="off" spellcheck="false" aria-describedby="cd-hint" data-field>
          <!-- Says why the button is off, rather than leaving a dead button to work out. -->
          <p class="cd-hint" id="cd-hint" data-hint>${escapeHtml(config.confirmText)} stays off until the words match exactly.</p>
        </div>\n`
    : "";

  return `    <div class="cd cd--theme-${config.theme}" style="${vars}" data-confirm-dialog data-phrase="${config.requirePhrase ? escapeHtml(config.phrase) : ""}">
      <button class="cd-trigger" type="button" aria-haspopup="dialog" data-trigger>${escapeHtml(config.triggerText)}</button>

      <dialog class="cd-dialog" aria-labelledby="cd-title" aria-describedby="cd-message" data-dialog>
        <h2 class="cd-title" id="cd-title">${escapeHtml(config.title)}</h2>
        <p class="cd-message" id="cd-message">${escapeHtml(config.message)}</p>
${field}        <div class="cd-actions">
          <button class="cd-cancel" type="button" data-cancel>${escapeHtml(config.cancelText)}</button>
          <button class="cd-confirm" type="button"${config.requirePhrase ? " disabled" : ""} data-confirm>${escapeHtml(config.confirmText)}</button>
        </div>
      </dialog>

      <p class="cd-status" role="status" data-status></p>
    </div>`;
}

export function renderConfirmDialogHtml(config: ConfirmDialogConfig) {
  return htmlPage({ title: "Typed confirmation", slug: "confirm-dialog", body: renderConfirmDialogMarkup(config), script: true });
}
