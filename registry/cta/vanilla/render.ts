import { escapeHtml, htmlPage, luminance, safeHref } from "@/lib/html";
import type { CtaConfig } from "../react/cta";

const palettes = {
  light: { surface: "#f7f7fb", text: "#16121f", muted: "#4d4a57", border: "#6f6b7a" },
  dark: { surface: "#16161c", text: "#f6f5fa", muted: "#b6b3c2", border: "#8d8a99" },
};

/**
 * The CTA ships as real HTML with no JavaScript, so its markup is generated from the options
 * instead of being swapped into a config block. "system" theme is handled in CSS.
 */
export function renderCtaMarkup(config: CtaConfig) {
  const palette = config.theme === "dark" ? palettes.dark : palettes.light;
  const accentLuminance = luminance(config.accentColor);
  const vars = [
    `--cta-accent: ${config.accentColor}`,
    `--cta-on-accent: ${accentLuminance > 0.179 ? "#000000" : "#ffffff"}`,
    `--cta-ring: ${accentLuminance <= 0.35 || config.theme === "dark" ? config.accentColor : palette.text}`,
    `--cta-radius: ${config.radius}px`,
    `--cta-surface: ${palette.surface}`,
    `--cta-text: ${palette.text}`,
    `--cta-muted: ${palette.muted}`,
    `--cta-border: ${palette.border}`,
  ].join("; ");
  const classes = ["cta", `cta--${config.spacing}`, `cta--${config.layout}`, `cta--theme-${config.theme}`].join(" ");
  const heading = config.headingLevel;

  return `    <section class="${classes}" style="${vars}" aria-labelledby="cta-heading">
      <div class="cta-inner">
        <${heading} class="cta-heading" id="cta-heading">${escapeHtml(config.heading)}</${heading}>
${config.body ? `        <p class="cta-body">${escapeHtml(config.body)}</p>\n` : ""}        <div class="cta-actions">
          <a class="cta-button cta-button--primary" href="${escapeHtml(safeHref(config.primaryHref))}">${escapeHtml(config.primaryText)}</a>
${config.secondaryButton ? `          <a class="cta-button cta-button--secondary" href="${escapeHtml(safeHref(config.secondaryHref))}">${escapeHtml(config.secondaryText)}</a>\n` : ""}        </div>
${config.note && config.noteText ? `        <p class="cta-note">${escapeHtml(config.noteText)}</p>\n` : ""}      </div>
    </section>`;
}

export function renderCtaHtml(config: CtaConfig) {
  return htmlPage({ title: "CTA section", slug: "cta", body: renderCtaMarkup(config), script: false });
}
