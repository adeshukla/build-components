import { escapeHtml, htmlPage, luminance, safeHref } from "@/lib/html";
import type { HeroConfig } from "../react/hero";

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

/** Only http(s) and same-site paths are let through, the same rule the React output uses. */
function safeSrc(value: string) {
  if (value.startsWith("/")) return value;
  try {
    const url = new URL(value, "https://example.com");
    return url.protocol === "http:" || url.protocol === "https:" ? value : "";
  } catch {
    return "";
  }
}

export function renderHeroMarkup(config: HeroConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--hr-accent: ${config.accentColor}`,
    `--hr-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--hr-on-accent: ${luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff"}`,
    ...Object.entries(palette).map(([key, value]) => `--hr-${key}: ${value}`),
  ].join("; ");

  const centred = config.align === "centre";
  const panel = config.showPanel && !centred;
  const picture = safeSrc(config.imageSrc ?? "");
  const tag = config.headingLevel;

  return `    <section class="hr hr--theme-${config.theme} hr--${config.align}${panel ? " hr--split" : ""}" style="${vars}" aria-labelledby="hero-heading" data-hero>
      <div class="hr-inner">
        <div class="hr-body">
${config.eyebrow.trim() === "" ? "" : `          <!-- Above the heading, but not a heading itself: a fake one would break the page outline. -->
          <p class="hr-eyebrow">${escapeHtml(config.eyebrow)}</p>\n`}          <${tag} class="hr-heading" id="hero-heading">${escapeHtml(config.heading)}</${tag}>
${config.copy.trim() === "" ? "" : `          <p class="hr-copy">${escapeHtml(config.copy)}</p>\n`}
          <div class="hr-actions">
${config.primaryText.trim() === "" ? "" : `            <a class="hr-primary" href="${escapeHtml(safeHref(config.primaryHref))}">${escapeHtml(config.primaryText)}</a>\n`}${config.secondaryText.trim() === "" ? "" : `            <a class="hr-secondary" href="${escapeHtml(safeHref(config.secondaryHref))}">${escapeHtml(config.secondaryText)}</a>\n`}          </div>
${config.note.trim() === "" ? "" : `          <p class="hr-note">${escapeHtml(config.note)}</p>\n`}        </div>
${panel ? `        <!-- A place for a picture, drawn rather than loaded: the exported file carries no image of ours. -->
        ${picture ? `<img class="hr-img" src="${escapeHtml(picture)}" alt="${escapeHtml(config.panelLabel)}">` : `<div class="hr-panel" role="img" aria-label="${escapeHtml(config.panelLabel)}"></div>`}\n` : ""}      </div>
    </section>`;
}

export function renderHeroHtml(config: HeroConfig) {
  return htmlPage({ title: "Hero section", slug: "hero", body: renderHeroMarkup(config), script: false });
}
