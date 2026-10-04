import { escapeHtml, htmlPage, luminance, safeHref, themedColour } from "@/lib/html";
import type { AnnouncementBarConfig } from "../react/announcement-bar";

const palettes = {
  light: { sunk: "#f4f3f8", text: "#16121f", line: "#d9d5e4" },
  dark: { sunk: "#1c1726", text: "#f6f5fa", line: "#3a3448" },
};

/** Plain HTML, no JavaScript: the markup is generated from the options. "system" theme is handled in CSS. */
export function renderAnnouncementBarMarkup(config: AnnouncementBarConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const onAccent = luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff";
  const vars = [
    `--ab-accent: ${config.accentColor}`,
    `--ab-on-accent: ${onAccent}`,
    ...(config.theme === "system" ? [] : Object.entries(palette).map(([key, value]) => `--ab-${key}: ${themedColour(key, value, dark)}`)),
  ].join("; ");
  const link = config.linkText.trim()
    ? ` <a class="ab-link" href="${escapeHtml(safeHref(config.linkHref))}">${escapeHtml(config.linkText)}<span aria-hidden="true"> →</span></a>`
    : "";
  return `    <aside class="ab ab--${config.tone} ab--theme-${config.theme}" style="${vars}" aria-label="${escapeHtml(config.regionLabel)}">
      <p class="ab-text">${escapeHtml(config.message)}${link}</p>
    </aside>`;
}

export function renderAnnouncementBarHtml(config: AnnouncementBarConfig) {
  return htmlPage({ title: "Announcement bar", slug: "announcement-bar", body: renderAnnouncementBarMarkup(config), script: false });
}
