import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { ToastConfig } from "../react/toast";

const palettes = {
  light: { page: "#ffffff", surface: "#ffffff", text: "#16121f", muted: "#4d4a57", line: "#d9d5e4", good: "#1a7f52", bad: "#b4232b" },
  dark: { page: "#141019", surface: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#3a3448", good: "#6ddba4", bad: "#ff8f8f" },
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
 * The triggers and the live region ship as real HTML. The script only builds each message:
 * the region has to be in the page from the start, or the first message is announced late.
 */
export function renderToastMarkup(config: ToastConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--to-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--to-radius: ${config.radius}px`,
    `--to-page: ${palette.page}`,
    `--to-surface: ${palette.surface}`,
    `--to-text: ${palette.text}`,
    `--to-muted: ${palette.muted}`,
    `--to-line: ${palette.line}`,
    `--to-good: ${palette.good}`,
    `--to-bad: ${palette.bad}`,
  ].join("; ");

  const settings = [
    `data-toast`,
    `data-duration="${config.duration}"`,
    `data-max="${config.maxVisible}"`,
    `data-close="${config.closeButton}"`,
    `data-icon="${config.icon}"`,
    `data-message="${escapeHtml(config.message)}"`,
    `data-error="${escapeHtml(config.errorMessage)}"`,
    `data-action="${escapeHtml(config.actionText)}"`,
  ].join(" ");

  return `    <div class="to to--theme-${config.theme}" style="${vars}" ${settings}>
      <div class="to-triggers">
        <button class="to-trigger" type="button" data-show="good">${escapeHtml(config.buttonText)}</button>
        <button class="to-trigger" type="button" data-show="bad">${escapeHtml(config.errorButtonText)}</button>
      </div>
      <div class="to-stack to-stack--${config.position}" role="region" aria-label="Notifications" data-stack>
        <div class="to-live" aria-live="polite" aria-atomic="false" data-live></div>
      </div>
    </div>`;
}

export function renderToastHtml(config: ToastConfig) {
  return htmlPage({ title: "Notifications", slug: "toast", body: renderToastMarkup(config), script: true });
}
