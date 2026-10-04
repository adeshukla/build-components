import { escapeHtml, htmlPage, luminance, themedColour } from "@/lib/html";
import type { RatingConfig } from "../react/rating";

/** Words with something put in them: "{count} left" (D94). */
const fill = (words: string, values: Record<string, string | number>) => words.replace(/\{(\w+)\}/g, (match, name) => String(values[name] ?? match));

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", muted: "#4d4a57", empty: "#c9c5d4" },
  dark: { surface: "#141019", text: "#f6f5fa", muted: "#b6b3c2", empty: "#4a4458" },
};

const STAR_PATH = "m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z";
const STAR = `<svg class="ra-star" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="${STAR_PATH}"/></svg>`;

/*
 * One side of a star, for picking half ratings: the same path in a window half as wide. The left half
 * shows the first twelve units of it, the right half the last twelve. Each half is 24px across — the
 * smallest a target may be — which is why a row of half stars is drawn larger than a row of whole ones.
 */
const HALF = (side: "left" | "right") =>
  `<svg class="ra-star ra-star--half" aria-hidden="true" viewBox="${side === "left" ? "0 0 12 24" : "12 0 12 24"}" fill="currentColor"><path d="${STAR_PATH}"/></svg>`;

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

/** Written by hand, never by locale, so the server and the browser always agree. */
const show = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(1));

export function renderRatingMarkup(config: RatingConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--ra-accent: ${config.accentColor}`,
    `--ra-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...(config.theme === "system" ? [] : Object.entries(palette).map(([key, value]) => `--ra-${key}: ${themedColour(key, value, dark)}`)),
  ].join("; ");
  const max = Math.max(2, Math.min(10, Math.round(config.max)));
  const stars = Array.from({ length: max }, (_, index) => index + 1);
  const count = config.countText.trim();
  const countHtml = count ? `\n        <span class="ra-count">${escapeHtml(count)}</span>` : "";

  if (config.mode === "show") {
    const value = Math.min(max, Math.max(0, config.value));
    // One image with the whole thing in its name; part stars come from clipping the filled row.
    return `    <div class="ra ra--theme-${config.theme}" style="${vars}" data-rating data-score="${escapeHtml(config.scoreText)}">
      <div class="ra-row">
        <span class="ra-stars" role="img" aria-label="${escapeHtml(fill(config.scoreText, { value: show(value), max }))}">
          <span class="ra-empty" aria-hidden="true">${stars.map(() => STAR).join("")}</span>
          <span class="ra-filled" aria-hidden="true" style="width: ${(value / max) * 100}%">${stars.map(() => STAR).join("")}</span>
        </span>
${config.showValue ? `        <span class="ra-value">${show(value)} <span class="ra-of">${escapeHtml(fill(config.outOfText, { max }))}</span></span>` : ""}${countHtml}
      </div>
    </div>`;
  }

  const picked = Math.min(
    max,
    Math.max(0, config.halfStars ? Math.round(config.value * 2) / 2 : Math.round(config.value)),
  );
  /** What one star offers: both halves of it, or just the whole. */
  const steps = (star: number) => (config.halfStars ? [star - 0.5, star] : [star]);
  const inputs = stars
    .map(
      (star) => `          <span class="ra-star-pair">
${steps(star)
  .map(
    (step) => `            <label class="ra-pick">
              <input class="ra-input" type="radio" name="${escapeHtml(config.name || "rating")}" value="${step}"${step === picked ? " checked" : ""}>
              <span class="ra-sr">${escapeHtml(fill(step === 1 ? config.starOne : config.starMany, { count: show(step) }))}</span>
              ${config.halfStars ? HALF(step === star ? "right" : "left") : STAR}
            </label>`,
  )
  .join("\n")}
          </span>`,
    )
    .join("\n");

  return `    <div class="ra ra--theme-${config.theme}" style="${vars}" data-rating data-max="${max}">
      <fieldset class="ra-fieldset">
        <legend class="ra-legend">${escapeHtml(config.label)}</legend>
        <div class="ra-row">
          <div class="ra-picks">
${inputs}
          </div>
${config.showValue ? `          <output class="ra-value" data-output>${escapeHtml(picked === 0 ? config.noneText : fill(config.scoreText, { value: show(picked), max }))}</output>` : ""}${countHtml}
        </div>
      </fieldset>
    </div>`;
}

export function renderRatingHtml(config: RatingConfig) {
  return htmlPage({ title: "Rating", slug: "rating", body: renderRatingMarkup(config), script: true });
}
