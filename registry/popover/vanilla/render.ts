import { escapeHtml, htmlPage, luminance, safeHref } from "@/lib/html";
import type { PopoverConfig } from "../react/popover";

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", muted: "#4d4a57", line: "#d9d5e4", hover: "#f4f3f8" },
  dark: { surface: "#141019", text: "#f6f5fa", muted: "#b6b3c2", line: "#3a3448", hover: "#221d2e" },
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

const closeIcon = `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg>`;

/** The popover ships as real HTML, hidden until the script opens it. */
export function renderPopoverMarkup(config: PopoverConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const accentLuminance = luminance(config.accentColor);
  const vars = [
    `--pv-accent: ${config.accentColor}`,
    `--pv-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--pv-on-accent: ${accentLuminance > 0.179 ? "#000000" : "#ffffff"}`,
    `--pv-radius: ${config.radius}px`,
    `--pv-width: ${config.width}px`,
    `--pv-surface: ${palette.surface}`,
    `--pv-text: ${palette.text}`,
    `--pv-muted: ${palette.muted}`,
    `--pv-line: ${palette.line}`,
    `--pv-hover: ${palette.hover}`,
  ].join("; ");

  const primary =
    config.primaryHref.trim() !== ""
      ? `          <a class="pv-button pv-button--primary" href="${escapeHtml(safeHref(config.primaryHref))}">${escapeHtml(config.primaryText)}</a>`
      : `          <button class="pv-button pv-button--primary" type="button">${escapeHtml(config.primaryText)}</button>`;

  return `    <div class="pv pv--${config.placement} pv--${config.align} pv--theme-${config.theme}" style="${vars}" data-popover data-close-outside="${config.closeOnOutside}">
      <button class="pv-trigger" type="button" aria-expanded="false" aria-controls="popover-panel" data-trigger>${escapeHtml(config.triggerText)}</button>
      <div class="pv-panel" id="popover-panel" role="dialog" aria-label="${escapeHtml(config.heading)}" hidden>
${config.arrow ? `        <span class="pv-arrow" aria-hidden="true"></span>\n` : ""}        <div class="pv-head">
          <p class="pv-heading">${escapeHtml(config.heading)}</p>
${config.closeButton ? `          <button class="pv-close" type="button" data-close><span class="pv-sr">Close</span>${closeIcon}</button>\n` : ""}        </div>
${config.body.trim() ? `        <p class="pv-body">${escapeHtml(config.body)}</p>\n` : ""}        <div class="pv-actions">
${primary}
${config.secondaryButton ? `          <button class="pv-button pv-button--secondary" type="button">${escapeHtml(config.secondaryText)}</button>\n` : ""}        </div>
      </div>
    </div>`;
}

export function renderPopoverHtml(config: PopoverConfig) {
  return htmlPage({ title: "Popover", slug: "popover", body: renderPopoverMarkup(config), script: true });
}
