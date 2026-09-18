import { escapeHtml, htmlPage, luminance, safeHref } from "@/lib/html";
import type { FooterConfig } from "../react/footer";

const palettes = {
  light: { surface: "#f7f7fb", text: "#16121f", muted: "#4d4a57", line: "#d9d5e4" },
  dark: { surface: "#141019", text: "#f6f5fa", muted: "#b6b3c2", line: "#3a3448" },
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

const listItems = (links: { label: string; href: string }[], indent: string) =>
  links
    .filter((link) => link.label.trim() !== "")
    .map(
      (link) =>
        `${indent}<li><a class="ft-link" href="${escapeHtml(safeHref(link.href))}">${escapeHtml(link.label)}</a></li>`,
    )
    .join("\n");

/**
 * The footer ships as real HTML with no JavaScript, so its markup is generated from the options.
 * "system" theme is handled in CSS.
 */
export function renderFooterMarkup(config: FooterConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--ft-accent: ${readableAccent(config.accentColor, dark)}`,
    `--ft-surface: ${palette.surface}`,
    `--ft-text: ${palette.text}`,
    `--ft-muted: ${palette.muted}`,
    `--ft-line: ${palette.line}`,
  ].join("; ");
  const classes = [
    "ft",
    `ft--${config.spacing}`,
    `ft--${config.layout}`,
    `ft--theme-${config.theme}`,
    config.topBorder ? "ft--bordered" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const links = listItems(config.links, "            ");
  const nav =
    links === ""
      ? ""
      : `        <nav class="ft-nav" aria-label="${escapeHtml(config.navLabel)}">
          <ul class="ft-list">
${links}
          </ul>
        </nav>\n`;
  const social =
    config.social && listItems(config.socialLinks, "").length > 0
      ? `      <ul class="ft-list ft-social">
${listItems(config.socialLinks, "        ")}
      </ul>\n`
      : "";

  return `    <footer class="${classes}" style="${vars}">
      <div class="ft-top">
        <div class="ft-brand">
          <p class="ft-name">${escapeHtml(config.brandText)}</p>
${config.tagline ? `          <p class="ft-tagline">${escapeHtml(config.tagline)}</p>\n` : ""}        </div>
${nav}      </div>
${social}      <div class="ft-bottom">
${config.legalText ? `        <p class="ft-legal">${escapeHtml(config.legalText)}</p>\n` : ""}${config.backToTop ? `        <a class="ft-link" href="#top">${escapeHtml(config.backToTopText)}</a>\n` : ""}      </div>
    </footer>`;
}

export function renderFooterHtml(config: FooterConfig) {
  return htmlPage({ title: "Site footer", slug: "footer", body: renderFooterMarkup(config), script: false });
}
