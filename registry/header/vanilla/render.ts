import { escapeHtml, htmlPage, luminance, safeHref } from "@/lib/html";
import type { HeaderConfig } from "../react/header";

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", muted: "#4d4a57", line: "#e4e1ec", hover: "#f4f3f8" },
  dark: { surface: "#141019", text: "#f6f5fa", muted: "#b6b3c2", line: "#2c2838", hover: "#221d2e" },
};

/**
 * The header ships as real HTML with a small progressive-enhancement script, so its markup is
 * generated from the options. "system" theme and the breakpoint are handled in CSS.
 */
export function renderHeaderMarkup(config: HeaderConfig) {
  const palette = config.theme === "dark" ? palettes.dark : palettes.light;
  const accentLuminance = luminance(config.accentColor);
  const vars = [
    `--hd-accent: ${config.accentColor}`,
    `--hd-on-accent: ${accentLuminance > 0.179 ? "#000000" : "#ffffff"}`,
    `--hd-ring: ${accentLuminance <= 0.35 || config.theme === "dark" ? config.accentColor : palette.text}`,
    `--hd-radius: ${config.radius}px`,
    `--hd-surface: ${palette.surface}`,
    `--hd-text: ${palette.text}`,
    `--hd-muted: ${palette.muted}`,
    `--hd-line: ${palette.line}`,
    `--hd-hover: ${palette.hover}`,
  ].join("; ");
  const classes = [
    "hd",
    `hd--${config.height}`,
    `hd--theme-${config.theme}`,
    config.sticky ? "hd--sticky" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const links = config.links
    .filter((link) => link.label.trim() !== "")
    .map(
      (link) =>
        `            <li><a class="hd-link" href="${escapeHtml(safeHref(link.href))}">${escapeHtml(link.label)}</a></li>`,
    )
    .join("\n");
  const cta = config.ctaButton
    ? `          <a class="hd-cta" href="${escapeHtml(safeHref(config.ctaHref))}">${escapeHtml(config.ctaText)}</a>\n`
    : "";

  return `    <header class="${classes}" style="${vars}" data-header data-breakpoint="${config.mobileBreakpoint}">
${config.skipLink ? `      <a class="hd-skip" href="#main">Skip to content</a>\n` : ""}      <div class="hd-bar">
        <a class="hd-logo" href="/">${escapeHtml(config.logoText)}</a>
        <nav class="hd-nav" aria-label="Main">
          <ul class="hd-list">
${links}
          </ul>
${cta}        </nav>
        <button class="hd-toggle" type="button" data-toggle aria-expanded="false" aria-controls="hd-menu">
          <svg class="hd-icon-open" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
          <svg class="hd-icon-close" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg>
          ${escapeHtml(config.menuLabel)}
        </button>
      </div>
      <div class="hd-menu" id="hd-menu" hidden>
        <nav class="hd-menu-inner" aria-label="Main">
          <ul class="hd-list hd-list--stacked">
${links}
          </ul>
${cta}        </nav>
      </div>
    </header>
    <main id="main" class="hd-demo-main">
      <h1>Page heading</h1>
      <p>The header sits above your page. This block is only here so the skip link has somewhere to go.</p>
    </main>`;
}

export function renderHeaderHtml(config: HeaderConfig) {
  return htmlPage({ title: "Site header", slug: "header", body: renderHeaderMarkup(config), script: true });
}
