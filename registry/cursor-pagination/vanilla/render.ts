import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { CursorPaginationConfig } from "../react/cursor-pagination";

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

export function renderCursorPaginationMarkup(config: CursorPaginationConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--cp-accent: ${config.accentColor}`,
    `--cp-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...Object.entries(palette).map(([key, value]) => `--cp-${key}: ${value}`),
  ].join("; ");

  return `    <div class="cp cp--theme-${config.theme}" style="${vars}" data-cursor-pagination>
      <h2 class="cp-heading" id="cp-heading" tabindex="-1" data-heading>${escapeHtml(config.heading)}</h2>

      ${config.showRange ? '<p class="cp-range" role="status" data-range></p>' : ""}

      <ul class="cp-list" aria-labelledby="cp-heading" data-list></ul>

      <nav class="cp-nav" aria-label="${escapeHtml(config.label)}">
        <button class="cp-button" type="button" data-previous><span aria-hidden="true">←</span>${escapeHtml(config.previousLabel)}</button>
        <button class="cp-button" type="button" data-next>${escapeHtml(config.nextLabel)}<span aria-hidden="true">→</span></button>
      </nav>

      <!-- The reason is on the page, described by whichever button it belongs to. -->
      <p class="cp-reason" id="cp-at-start" hidden data-at-start>${escapeHtml(config.atStartText)}</p>
      <p class="cp-reason" id="cp-at-end" hidden data-at-end>${escapeHtml(config.atEndText)}</p>
    </div>`;
}

export function renderCursorPaginationHtml(config: CursorPaginationConfig) {
  return htmlPage({
    title: "Cursor pagination",
    slug: "cursor-pagination",
    body: renderCursorPaginationMarkup(config),
    script: true,
  });
}
