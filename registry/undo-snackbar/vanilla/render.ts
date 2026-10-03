import { escapeHtml, htmlPage, luminance, themedColour } from "@/lib/html";
import type { UndoSnackbarConfig } from "../react/undo-snackbar";

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", panel: "#1b1624", "on-panel": "#f6f5fa", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#141019", sunk: "#221d2e", panel: "#2c2639", "on-panel": "#f6f5fa", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
};

/** Shifts the accent until it clears 4.5:1 against whichever surface it sits on. */
function readableOn(hex: string, base: string) {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const level = luminance(base);
  const lighten = level < 0.18;
  for (let step = 0; step <= 20; step++) {
    const shifted = channels.map((c) => Math.round(lighten ? c + (255 - c) * (step / 20) : c * (1 - step / 20)));
    const value = `#${shifted.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
    const l = luminance(value);
    const contrast = (Math.max(l, level) + 0.05) / (Math.min(l, level) + 0.05);
    if (contrast >= 4.5) return value;
  }
  return lighten ? "#ffffff" : "#000000";
}

export function renderUndoSnackbarMarkup(config: UndoSnackbarConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--usb-accent: ${config.accentColor}`,
    `--usb-accent-on-panel: ${readableOn(config.accentColor, palette.panel)}`,
    `--usb-accent-text: ${readableOn(config.accentColor, palette.surface)}`,
    ...(config.theme === "system" ? [] : Object.entries(palette).map(([key, value]) => `--usb-${key}: ${themedColour(key, value, dark)}`)),
  ].join("; ");

  return `    <div class="usb usb--theme-${config.theme} usb--${config.position === "bottom-centre" ? "centre" : "left"}" style="${vars}" data-undo-snackbar>
      <div class="usb-body">
        <button class="usb-trigger" type="button" data-trigger>${escapeHtml(config.triggerLabel)}</button>

        <!--
          One live region holding nothing but words. The snackbar itself is not a live region: a region
          that contains a button gets read as a lump of text, and re-reads itself on every countdown tick.
        -->
        <p class="usb-said" role="status" data-said></p>
      </div>

      <div class="usb-bar" hidden data-snackbar>
        <p class="usb-message" aria-hidden="true">${escapeHtml(config.message)}</p>
        <button class="usb-undo" type="button" data-undo>${escapeHtml(config.undoLabel)}</button>
        <button class="usb-close" type="button" aria-label="${escapeHtml(config.closeLabel)}" data-close><span aria-hidden="true">×</span></button>
        ${
          config.showCountdown && config.seconds > 0
            ? '<span class="usb-countdown" aria-hidden="true" data-countdown></span>'
            : ""
        }
      </div>
    </div>`;
}

export function renderUndoSnackbarHtml(config: UndoSnackbarConfig) {
  return htmlPage({ title: "Undo snackbar", slug: "undo-snackbar", body: renderUndoSnackbarMarkup(config), script: true });
}
