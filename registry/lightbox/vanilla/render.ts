import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { LightboxConfig } from "../react/lightbox";

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", muted: "#4d4a57", line: "#d9d5e4" },
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

const safeSrc = (value: string) => (/^(\/|https?:\/\/)/i.test(value.trim()) ? value.trim() : "");

/**
 * The thumbnails ship in the HTML as buttons; each carries its full-size address, description and
 * caption, which the script shows in the viewer.
 */
export function renderLightboxMarkup(config: LightboxConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--lb-accent: ${config.accentColor}`,
    `--lb-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...Object.entries(palette).map(([key, value]) => `--lb-${key}: ${value}`),
  ].join("; ");
  const items = config.items.filter((item) => item.alt.trim() !== "" || item.src.trim() !== "");

  const thumbs = items
    .map((item, index) => {
      const src = safeSrc(item.src);
      const picture = src
        ? `<img class="lb-thumb" src="${escapeHtml(src)}" alt="${escapeHtml(item.alt)}">`
        : `<span class="lb-thumb lb-placeholder lb-placeholder--${index % 6}" role="img" aria-label="${escapeHtml(item.alt)}"></span>`;
      return `        <li><button class="lb-open" type="button" aria-haspopup="dialog" data-index="${index}" data-src="${escapeHtml(src)}" data-alt="${escapeHtml(item.alt)}" data-caption="${escapeHtml(item.caption)}">${picture}</button></li>`;
    })
    .join("\n");

  return `    <div class="lb lb--theme-${config.theme}" style="${vars}" data-lightbox data-loop="${config.loop}" data-captions="${config.showCaptions}">
      <p class="lb-label" id="lightbox-label">${escapeHtml(config.label)}</p>
      <ul class="lb-grid lb-grid--${config.columns}" aria-labelledby="lightbox-label">
${thumbs}
      </ul>
      <dialog class="lb-viewer" aria-label="${escapeHtml(config.label)}, picture viewer">
        <div class="lb-stage" data-backdrop>
          <p class="lb-counter" aria-live="polite" data-counter></p>
          <button class="lb-round lb-close" type="button" aria-label="Close" data-close><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
          <figure class="lb-figure">
            <span class="lb-picture" data-picture></span>
            <figcaption class="lb-caption" data-caption></figcaption>
          </figure>
${items.length > 1 ? `          <button class="lb-round lb-prev" type="button" aria-label="Previous picture" data-prev><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 6-6 6 6 6"/></svg></button>
          <button class="lb-round lb-next" type="button" aria-label="Next picture" data-next><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 6 6 6-6 6"/></svg></button>\n` : ""}        </div>
      </dialog>
    </div>`;
}

export function renderLightboxHtml(config: LightboxConfig) {
  return htmlPage({ title: "Lightbox", slug: "lightbox", body: renderLightboxMarkup(config), script: true });
}
