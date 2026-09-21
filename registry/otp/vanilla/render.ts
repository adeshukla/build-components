import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { OtpConfig } from "../react/otp";

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", muted: "#4d4a57", line: "#8d8a99" },
  dark: { surface: "#141019", text: "#f6f5fa", muted: "#b6b3c2", line: "#8d8a99" },
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
 * The group, the boxes and the label ship as real HTML, so a code can be typed before the
 * script runs. The script adds moving between boxes, pasting and the completion message.
 */
export function renderOtpMarkup(config: OtpConfig) {
  const length = Math.min(10, Math.max(3, Math.round(config.length)));
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--ot-accent: ${config.accentColor}`,
    `--ot-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--ot-radius: ${config.radius}px`,
    `--ot-surface: ${palette.surface}`,
    `--ot-text: ${palette.text}`,
    `--ot-muted: ${palette.muted}`,
    `--ot-line: ${palette.line}`,
  ].join("; ");

  const hint = config.hint.trim()
    ? `        <p class="ot-hint" id="otp-hint">${escapeHtml(config.hint)}</p>\n`
    : "";
  const describedBy = config.hint.trim() ? ' aria-describedby="otp-hint"' : "";
  const mode = config.allowLetters ? "text" : "numeric";

  const field =
    config.mode === "single"
      ? `        <input class="ot-single" type="text" inputmode="${mode}" autocomplete="one-time-code" maxlength="${length}" aria-label="${escapeHtml(config.label)}"${describedBy} data-single>`
      : `        <div class="ot-boxes">
${Array.from({ length })
  .map(
    (_, index) =>
      `          <input class="ot-box" type="text" inputmode="${mode}" autocomplete="${index === 0 ? "one-time-code" : "off"}" maxlength="1" aria-label="Character ${index + 1} of ${length}"${index === 0 ? describedBy : ""} data-box="${index}">`,
  )
  .join("\n")}
        </div>`;

  const resend = config.resendText.trim()
    ? `      <button class="ot-resend" type="button">${escapeHtml(config.resendText)}</button>\n`
    : "";

  return `    <div class="ot ot--theme-${config.theme}" style="${vars}" data-otp data-length="${length}" data-letters="${config.allowLetters}" data-complete="${escapeHtml(config.completeText)}">
      <fieldset class="ot-group">
        <legend class="ot-label">${escapeHtml(config.label)}</legend>
${hint}${field}
      </fieldset>
      <p class="ot-status" role="status" aria-live="polite" data-announce></p>
${resend}    </div>`;
}

export function renderOtpHtml(config: OtpConfig) {
  return htmlPage({ title: "One-time code", slug: "otp", body: renderOtpMarkup(config), script: true });
}
