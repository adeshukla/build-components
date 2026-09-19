import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { TooltipConfig } from "../react/tooltip";

const palettes = {
  light: { surface: "#ffffff", tip: "#16121f", tipText: "#ffffff", text: "#16121f", line: "#d9d5e4" },
  dark: { surface: "#141019", tip: "#f6f5fa", tipText: "#16121f", text: "#f6f5fa", line: "#3a3448" },
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

const helpIcon = `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.7M12 17h.01"/></svg>`;

/** The tooltip ships as real HTML; the script only shows and hides it. */
export function renderTooltipMarkup(config: TooltipConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--tt-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--tt-radius: ${config.radius}px`,
    `--tt-surface: ${palette.surface}`,
    `--tt-tip: ${palette.tip}`,
    `--tt-tip-text: ${palette.tipText}`,
    `--tt-text: ${palette.text}`,
    `--tt-line: ${palette.line}`,
  ].join("; ");

  const label = config.trigger === "icon" ? ` aria-label="${escapeHtml(config.triggerText)}"` : "";
  const inner = config.trigger === "icon" ? helpIcon : escapeHtml(config.triggerText);
  const arrow = config.arrow ? `<span class="tt-arrow" aria-hidden="true"></span>` : "";

  return `    <div class="tt tt--${config.placement} tt--${config.trigger} tt--theme-${config.theme}" style="${vars}" data-tooltip data-delay="${config.delay}">
      <span class="tt-anchor">
        <button class="tt-trigger" type="button"${label} data-trigger>${inner}</button>
        <span class="tt-tip" id="tooltip-text" role="tooltip" hidden>${escapeHtml(config.text)}${arrow}</span>
      </span>
    </div>`;
}

export function renderTooltipHtml(config: TooltipConfig) {
  return htmlPage({ title: "Tooltip", slug: "tooltip", body: renderTooltipMarkup(config), script: true });
}
