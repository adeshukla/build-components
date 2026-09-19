import { escapeHtml, htmlPage, luminance, safeHref } from "@/lib/html";
import type { CtaConfig } from "../react/cta";

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", border: "#d9d5e4" },
  dark: { surface: "#141019", sunk: "#1c1726", text: "#f6f5fa", muted: "#b6b3c2", border: "#3a3448" },
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

/** A darker shade of the accent, for the far end of the gradient on the bold look. */
function deepen(hex: string) {
  const channels = [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * 0.72));
  return `#${channels.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

const arrow = `<svg class="cta-arrow" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;

/**
 * The CTA ships as real HTML with no JavaScript, so its markup is generated from the options
 * instead of being swapped into a config block. "system" theme is handled in CSS.
 */
export function renderCtaMarkup(config: CtaConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const accentLuminance = luminance(config.accentColor);
  const onAccent = accentLuminance > 0.179 ? "#000000" : "#ffffff";
  const bold = config.look === "bold";

  const vars = [
    `--cta-accent: ${config.accentColor}`,
    `--cta-on-accent: ${onAccent}`,
    `--cta-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--cta-deep: ${deepen(config.accentColor)}`,
    `--cta-radius: ${config.radius}px`,
    `--cta-surface: ${bold ? config.accentColor : palette.surface}`,
    `--cta-text: ${bold ? onAccent : palette.text}`,
    `--cta-muted: ${bold ? onAccent : palette.muted}`,
    `--cta-border: ${bold ? onAccent : palette.border}`,
    `--cta-outer: ${config.look === "card" ? palette.sunk : "transparent"}`,
  ].join("; ");

  const classes = [
    "cta",
    `cta--${config.spacing}`,
    `cta--${config.layout}`,
    `cta--${config.look}`,
    `cta--theme-${config.theme}`,
  ].join(" ");
  const heading = config.headingLevel;

  return `    <section class="${classes}" style="${vars}" aria-labelledby="cta-heading">
      <div class="cta-panel">
${bold ? `        <span class="cta-wash" aria-hidden="true"></span>\n        <span class="cta-glow" aria-hidden="true"></span>\n` : ""}        <div class="cta-inner">
          <div class="cta-words">
${config.eyebrow.trim() ? `            <p class="cta-eyebrow">${escapeHtml(config.eyebrow)}</p>\n` : ""}            <${heading} class="cta-heading" id="cta-heading">${escapeHtml(config.heading)}</${heading}>
${config.body ? `            <p class="cta-body">${escapeHtml(config.body)}</p>\n` : ""}          </div>
          <div class="cta-actions-block">
            <div class="cta-actions">
              <a class="cta-button cta-button--primary" href="${escapeHtml(safeHref(config.primaryHref))}">${escapeHtml(config.primaryText)}${arrow}</a>
${config.secondaryButton ? `              <a class="cta-button cta-button--secondary" href="${escapeHtml(safeHref(config.secondaryHref))}">${escapeHtml(config.secondaryText)}</a>\n` : ""}            </div>
${config.note && config.noteText ? `            <p class="cta-note">${escapeHtml(config.noteText)}</p>\n` : ""}          </div>
        </div>
      </div>
    </section>`;
}

export function renderCtaHtml(config: CtaConfig) {
  return htmlPage({ title: "CTA section", slug: "cta", body: renderCtaMarkup(config), script: false });
}
