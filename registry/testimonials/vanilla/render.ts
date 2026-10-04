import { escapeHtml, htmlPage, luminance, themedColour } from "@/lib/html";
import type { TestimonialsConfig } from "../react/testimonials";

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#d9d5e4" },
  dark: { surface: "#141019", sunk: "#1c1726", text: "#f6f5fa", muted: "#b6b3c2", line: "#3a3448" },
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

/** Plain HTML, no JavaScript: the markup is generated from the options. "system" theme is handled in CSS. */
export function renderTestimonialsMarkup(config: TestimonialsConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--tm-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...(config.theme === "system" ? [] : Object.entries(palette).map(([key, value]) => `--tm-${key}: ${themedColour(key, value, dark)}`)),
  ].join("; ");
  const heading = config.headingLevel;
  const items = config.items
    .filter((item) => item.quote.trim() !== "")
    .map((item) => {
      const name = item.name.trim() ? `<span class="tm-name">${escapeHtml(item.name)}</span>` : "";
      const role = item.role.trim() ? `<span class="tm-role">${escapeHtml(item.role)}</span>` : "";
      return `        <li>
          <figure class="tm-card">
            <span class="tm-mark" aria-hidden="true">“</span>
            <blockquote class="tm-quote">${escapeHtml(item.quote)}</blockquote>
${name || role ? `            <figcaption class="tm-who">${name}${role}</figcaption>\n` : ""}          </figure>
        </li>`;
    })
    .join("\n");
  return `    <section class="tm tm--theme-${config.theme}" style="${vars}" aria-labelledby="tm-heading">
      <${heading} class="tm-heading" id="tm-heading">${escapeHtml(config.heading)}</${heading}>
${config.intro.trim() ? `      <p class="tm-intro">${escapeHtml(config.intro)}</p>\n` : ""}      <ul class="tm-list">
${items}
      </ul>
    </section>`;
}

export function renderTestimonialsHtml(config: TestimonialsConfig) {
  return htmlPage({ title: "Testimonials", slug: "testimonials", body: renderTestimonialsMarkup(config), script: false });
}
