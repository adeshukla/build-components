import { escapeHtml, htmlPage, luminance, themedColour } from "@/lib/html";
import type { ImageGalleryConfig } from "../react/image-gallery";

const palettes = {
  light: { surface: "#ffffff", sunk: "#eceaf3", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#141019", sunk: "#272031", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
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

/** Only http(s) and same-site paths are let through, the same rule the React output uses. */
function safeSrc(src: string) {
  if (src.startsWith("/")) return src;
  try {
    const url = new URL(src, "https://example.com");
    return url.protocol === "http:" || url.protocol === "https:" ? src : "";
  } catch {
    return "";
  }
}

export function renderImageGalleryMarkup(config: ImageGalleryConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--gal-accent: ${config.accentColor}`,
    `--gal-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...(config.theme === "system" ? [] : Object.entries(palette).map(([key, value]) => `--gal-${key}: ${themedColour(key, value, dark)}`)),
  ].join("; ");

  const items = config.items
    .map((item) => {
      const src = safeSrc(item.src);
      const described = item.alt.trim() !== "";
      const media =
        src === ""
          ? `<div class="gal-media gal-placeholder"${described ? ` role="img" aria-label="${escapeHtml(item.alt)}"` : ' aria-hidden="true"'}>[TODO: set src]</div>`
          : `<img class="gal-media" src="${escapeHtml(src)}" alt="${escapeHtml(item.alt)}" loading="lazy" decoding="async">`;
      return `        <li>
          <figure class="gal-figure">
            ${media}
            ${
              config.showCaptions && item.caption.trim() !== ""
                ? `<figcaption class="gal-caption">${escapeHtml(item.caption)}</figcaption>`
                : ""
            }
          </figure>
        </li>`;
    })
    .join("\n");

  return `    <div class="gal gal--theme-${config.theme} gal--${config.aspect}" style="${vars}">
      <h2 class="gal-heading" id="gal-heading">${escapeHtml(config.heading)}</h2>

      <!-- A list of figures, so a screen reader counts the pictures and can move between them. -->
      <ul class="gal-list" aria-labelledby="gal-heading" style="grid-template-columns: repeat(${Math.max(config.columns, 1)}, minmax(0, 1fr))">
${items}
      </ul>

      <p class="gal-note" data-demo>No pictures ship with this part. Set each item's src, and write alt for the ones that carry meaning — leave it empty for the ones that are decoration.</p>
    </div>`;
}

export function renderImageGalleryHtml(config: ImageGalleryConfig) {
  return htmlPage({ title: "Image gallery", slug: "image-gallery", body: renderImageGalleryMarkup(config), script: false });
}
