import { escapeHtml, htmlPage, luminance, safeHref, themedColour } from "@/lib/html";
import type { ProductGridConfig } from "../react/product-grid";

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

/** A picture's address, if it is one a page can show: a web address or a path on the site. */
const pictureSrc = (value: string) => (/^(\/[^/]|https?:\/\/)/i.test(value.trim()) ? value.trim() : "");

/** Plain HTML, no JavaScript: the markup is generated from the options. "system" theme is handled in CSS. */
export function renderProductGridMarkup(config: ProductGridConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--pg-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...(config.theme === "system" ? [] : Object.entries(palette).map(([key, value]) => `--pg-${key}: ${themedColour(key, value, dark)}`)),
  ].join("; ");
  const heading = config.headingLevel;
  const name = heading === "h2" ? "h3" : "h4";
  const products = config.products
    .filter((product) => product.name.trim() !== "")
    .map((product) => {
      const src = pictureSrc(product.image);
      const picture = src
        ? `<img class="pg-picture" src="${escapeHtml(src)}" alt="${escapeHtml(product.alt)}" loading="lazy" decoding="async">`
        : `<div class="pg-picture pg-picture--empty" aria-hidden="true"></div>`;
      const note = product.note.trim() ? ` <span class="pg-note">${escapeHtml(product.note)}</span>` : "";
      return `        <li>
          <article class="pg-product">
            <${name} class="pg-name"><a class="pg-link" href="${escapeHtml(safeHref(product.href))}">${escapeHtml(product.name)}</a></${name}>
            <p class="pg-price"><span>${escapeHtml(product.price)}</span>${note}</p>
            ${picture}
          </article>
        </li>`;
    })
    .join("\n");
  return `    <section class="pg pg--cols-${config.columns} pg--${config.shape} pg--theme-${config.theme}" style="${vars}" aria-labelledby="pg-heading">
      <${heading} class="pg-heading" id="pg-heading">${escapeHtml(config.heading)}</${heading}>
${config.intro.trim() ? `      <p class="pg-intro">${escapeHtml(config.intro)}</p>\n` : ""}      <ul class="pg-list">
${products}
      </ul>
    </section>`;
}

export function renderProductGridHtml(config: ProductGridConfig) {
  return htmlPage({ title: "Product grid", slug: "product-grid", body: renderProductGridMarkup(config), script: false });
}
