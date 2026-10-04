import { escapeHtml, htmlPage, themedColour } from "@/lib/html";
import type { PictureSectionConfig } from "../react/picture-section";

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", muted: "#4d4a57", line: "#d9d5e4" },
  dark: { surface: "#141019", sunk: "#1c1726", muted: "#b6b3c2", line: "#3a3448" },
};

/** Only http(s) and same-site paths are let through, the same rule the React output uses. */
function safeSrc(value: string) {
  if (value === "#") return ""; // what an unsafe address became
  if (value.startsWith("/")) return value;
  try {
    const url = new URL(value, "https://example.com");
    return url.protocol === "http:" || url.protocol === "https:" ? value : "";
  } catch {
    return "";
  }
}

/** Plain HTML, no JavaScript: the markup is generated from the options. "system" theme is handled in CSS. */
export function renderPictureSectionMarkup(config: PictureSectionConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  // Left to the stylesheet for "system", so its dark block can apply; the site theme's colours when there is one.
  const vars =
    config.theme === "system"
      ? ""
      : Object.entries(palette)
          .map(([key, value]) => `--pc-${key}: ${themedColour(key, value, dark)}`)
          .join("; ");
  const picture = safeSrc(config.imageSrc);
  const classes = `pc-box pc-box--${config.shape}${config.frame ? " pc-box--frame" : ""}`;
  const media = picture
    ? `<img class="${classes}" src="${escapeHtml(picture)}" alt="${escapeHtml(config.alt)}">`
    : `<div class="${classes} pc-placeholder" role="img" aria-label="${escapeHtml(config.alt || config.placeholderLabel)}"></div>`;
  return `    <figure class="pc pc--theme-${config.theme}" style="${vars}">
      ${media}
${config.caption.trim() ? `      <figcaption class="pc-caption">${escapeHtml(config.caption)}</figcaption>\n` : ""}    </figure>`;
}

export function renderPictureSectionHtml(config: PictureSectionConfig) {
  return htmlPage({ title: "Picture", slug: "picture-section", body: renderPictureSectionMarkup(config), script: false });
}
