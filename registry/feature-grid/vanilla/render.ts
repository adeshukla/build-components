import { escapeHtml, htmlPage, luminance, safeHref, themedColour } from "@/lib/html";
import type { FeatureGridConfig } from "../react/feature-grid";

/** Words with something put in them: "{count} left" (D94). */
const fill = (words: string, values: Record<string, string | number>) => words.replace(/\{(\w+)\}/g, (match, name) => String(values[name] ?? match));

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
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

export function renderFeatureGridMarkup(config: FeatureGridConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--fg-accent: ${config.accentColor}`,
    `--fg-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...(config.theme === "system" ? [] : Object.entries(palette).map(([key, value]) => `--fg-${key}: ${themedColour(key, value, dark)}`)),
  ].join("; ");

  const items = config.items
    .filter((item) => item.title.trim() !== "")
    .map(
      (item) => `        <li class="fg-item">
${item.glyph.trim() === "" ? "" : `          <!-- Decoration: the heading next to it carries the meaning. -->
          <p class="fg-glyph" aria-hidden="true">${escapeHtml(item.glyph)}</p>\n`}          <h3 class="fg-title">${escapeHtml(item.title)}</h3>
          <p class="fg-text">${escapeHtml(item.text)}</p>
${item.href.trim() === "" ? "" : `          <a class="fg-link" href="${escapeHtml(safeHref(item.href))}">${escapeHtml(config.linkText)}<span class="fg-sr"> ${escapeHtml(fill(config.aboutText, { title: item.title.toLowerCase() }))}</span></a>\n`}        </li>`,
    )
    .join("\n");

  return `    <section class="fg fg--theme-${config.theme} fg--${config.columns}${config.showRule ? " fg--rule" : ""}" style="${vars}" aria-labelledby="features-heading" data-feature-grid>
      <h2 class="fg-heading" id="features-heading">${escapeHtml(config.heading)}</h2>
${config.intro.trim() === "" ? "" : `      <p class="fg-intro">${escapeHtml(config.intro)}</p>\n`}      <ul class="fg-list">
${items}
      </ul>
    </section>`;
}

export function renderFeatureGridHtml(config: FeatureGridConfig) {
  return htmlPage({ title: "Feature grid", slug: "feature-grid", body: renderFeatureGridMarkup(config), script: false });
}
