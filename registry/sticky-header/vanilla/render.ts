import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { StickyHeaderConfig } from "../react/sticky-header";

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

export function renderStickyHeaderMarkup(config: StickyHeaderConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--sth-accent: ${config.accentColor}`,
    `--sth-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--sth-on-accent: ${luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff"}`,
    ...Object.entries(palette).map(([key, value]) => `--sth-${key}: ${value}`),
  ].join("; ");

  const count = Math.max(config.demoSections, 1);
  const links = config.links
    .map(
      (link, index) =>
        `              <li><a class="sth-link" href="#sth-section-${(index % count) + 1}">${escapeHtml(link.label)}</a></li>`,
    )
    .join("\n");

  const sections = Array.from({ length: count }, (_, index) => index + 1)
    .map(
      (section) => `          <section aria-labelledby="sth-section-${section}">
            <h2 class="sth-section-title" id="sth-section-${section}" tabindex="-1">Section ${section}</h2>
            <p class="sth-text">Scroll down and the header shrinks; keep going and it steps out of the way. Tab back up and it returns before the focus reaches it.</p>
            <div class="sth-block" aria-hidden="true"></div>
          </section>`,
    )
    .join("\n");

  return `    <div class="sth sth--theme-${config.theme}" style="${vars}" data-sticky-header>
      <div class="sth-scroller" data-scroller>
        <header class="sth-header" data-header>
          <p class="sth-title">${escapeHtml(config.title)}</p>
          <nav class="sth-nav" aria-label="Sections">
            <ul class="sth-list">
${links}
            </ul>
          </nav>
          <button class="sth-action" type="button">${escapeHtml(config.actionLabel)}</button>
        </header>

        <!-- Something to scroll. In your own page this is the page. -->
        <div class="sth-body">
${sections}
        </div>
      </div>
    </div>`;
}

export function renderStickyHeaderHtml(config: StickyHeaderConfig) {
  return htmlPage({ title: "Shrinking sticky header", slug: "sticky-header", body: renderStickyHeaderMarkup(config), script: true });
}
