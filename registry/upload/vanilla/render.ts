import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { UploadConfig } from "../react/upload";

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#8d8a99", error: "#b4232b" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#8d8a99", error: "#ff8f8f" },
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

/**
 * The input, the label and the hint ship as real HTML, so files can be chosen before the script
 * runs. The script adds the drop area, the list and the checks.
 */
export function renderUploadMarkup(config: UploadConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const accentLuminance = luminance(config.accentColor);
  const vars = [
    `--up-accent: ${config.accentColor}`,
    `--up-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--up-on-accent: ${accentLuminance > 0.179 ? "#000000" : "#ffffff"}`,
    `--up-radius: ${config.radius}px`,
    `--up-surface: ${palette.surface}`,
    `--up-sunk: ${palette.sunk}`,
    `--up-text: ${palette.text}`,
    `--up-muted: ${palette.muted}`,
    `--up-line: ${palette.line}`,
    `--up-error: ${palette.error}`,
  ].join("; ");

  const hint = config.hint.trim()
    ? `      <p class="up-hint" id="upload-hint">${escapeHtml(config.hint)}</p>\n`
    : "";

  const settings = [
    "data-upload",
    `data-accept="${escapeHtml(config.accept)}"`,
    `data-max-size="${config.maxSizeMb}"`,
    `data-max-files="${config.maxFiles}"`,
    `data-multiple="${config.multiple}"`,
    `data-show-size="${config.showSize}"`,
  ].join(" ");

  return `    <div class="up up--theme-${config.theme}" style="${vars}" ${settings}>
      <p class="up-label" id="upload-label">${escapeHtml(config.label)}</p>
${hint}      <div class="up-drop" data-drop>
        <label class="up-button">
          ${escapeHtml(config.buttonText)}
          <input class="up-input" type="file"${config.multiple ? " multiple" : ""} accept="${escapeHtml(config.accept)}"${config.hint.trim() ? ' aria-describedby="upload-hint"' : ""} data-input>
        </label>
        <span class="up-drop-text" aria-hidden="true">${escapeHtml(config.dropText)}</span>
      </div>
      <p class="up-sr" role="status" aria-live="polite" data-announce></p>
      <ul class="up-problems" role="alert" data-problems hidden></ul>
      <ul class="up-files" aria-labelledby="upload-label" data-files hidden></ul>
    </div>`;
}

export function renderUploadHtml(config: UploadConfig) {
  return htmlPage({ title: "File upload", slug: "upload", body: renderUploadMarkup(config), script: true });
}
