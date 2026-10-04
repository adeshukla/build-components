import { escapeHtml, htmlPage, luminance, safeHref, themedColour } from "@/lib/html";
import type { TextSectionConfig } from "../react/text-section";

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", muted: "#4d4a57" },
  dark: { surface: "#141019", text: "#f6f5fa", muted: "#b6b3c2" },
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

/** The same split as the React file's (a copy: that file is a client module). */
function paragraphsOf(body: string) {
  return body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

/** Plain HTML, no JavaScript: the markup is generated from the options. "system" theme is handled in CSS. */
export function renderTextSectionMarkup(config: TextSectionConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--tx-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...(config.theme === "system" ? [] : Object.entries(palette).map(([key, value]) => `--tx-${key}: ${themedColour(key, value, dark)}`)),
  ].join("; ");
  const heading = config.headingLevel;
  const paragraphs = paragraphsOf(config.body)
    .map((paragraph) => `          <p class="tx-body">${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("\n");
  return `    <section class="tx tx--theme-${config.theme}${config.align === "centre" ? " tx--centre" : ""}" style="${vars}" aria-labelledby="tx-heading">
      <div class="tx-inner">
${config.eyebrow.trim() ? `        <p class="tx-eyebrow">${escapeHtml(config.eyebrow)}</p>\n` : ""}        <${heading} class="tx-heading" id="tx-heading">${escapeHtml(config.heading)}</${heading}>
${paragraphs}
${config.linkText.trim() ? `        <p class="tx-more"><a class="tx-link" href="${escapeHtml(safeHref(config.linkHref))}">${escapeHtml(config.linkText)}</a></p>\n` : ""}      </div>
    </section>`;
}

export function renderTextSectionHtml(config: TextSectionConfig) {
  return htmlPage({ title: "Text section", slug: "text-section", body: renderTextSectionMarkup(config), script: false });
}
