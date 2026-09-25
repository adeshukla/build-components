import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { UnsavedChangesConfig } from "../react/unsaved-changes";

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

export function renderUnsavedChangesMarkup(config: UnsavedChangesConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--uc-accent: ${config.accentColor}`,
    `--uc-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--uc-on-accent: ${luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff"}`,
    ...Object.entries(palette).map(([key, value]) => `--uc-${key}: ${value}`),
  ].join("; ");

  return `    <div class="uc uc--theme-${config.theme}" style="${vars}" data-unsaved-changes data-warn-on-reload="${config.warnOnReload}">
      <label class="uc-label" for="uc-field">${escapeHtml(config.label)}</label>
      <textarea class="uc-field" id="uc-field" rows="3" placeholder="${escapeHtml(config.placeholder)}" aria-describedby="uc-dirty" data-field></textarea>

      <!-- Said once, when it changes, so nobody is told on every keystroke. -->
      <p class="uc-dirty" id="uc-dirty" role="status" data-dirty>Nothing to save</p>

      <div class="uc-actions">
        <button class="uc-save" type="button" data-save>${escapeHtml(config.saveText)}</button>
        <button class="uc-leave" type="button" data-leave>${escapeHtml(config.leaveText)}</button>
      </div>

      <dialog class="uc-dialog" aria-labelledby="uc-title" aria-describedby="uc-message" data-dialog>
        <h2 class="uc-title" id="uc-title">${escapeHtml(config.title)}</h2>
        <p class="uc-message" id="uc-message">${escapeHtml(config.message)}</p>
        <div class="uc-dialog-actions">
          <button class="uc-discard" type="button" data-discard>${escapeHtml(config.discardText)}</button>
          <button class="uc-stay" type="button" data-stay>${escapeHtml(config.stayText)}</button>
        </div>
      </dialog>

      <p class="uc-status" role="status" data-status></p>
    </div>`;
}

export function renderUnsavedChangesHtml(config: UnsavedChangesConfig) {
  return htmlPage({ title: "Unsaved changes guard", slug: "unsaved-changes", body: renderUnsavedChangesMarkup(config), script: true });
}
