import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { FeedConfig } from "../react/feed";

const palettes = {
  light: { surface: "#ffffff", raised: "#ffffff", text: "#16121f", muted: "#4d4a57", line: "#d9d5e4", border: "#737373", hover: "#eeecf5" },
  dark: { surface: "#141019", raised: "#1f1a29", text: "#f6f5fa", muted: "#b6b3c2", line: "#3a3448", border: "#8e8a99", hover: "#2a2438" },
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

/**
 * The first page ships as articles; the rest wait in a JSON block (with "<" escaped) standing in
 * for your server, and the script adds them a page at a time.
 */
export function renderFeedMarkup(config: FeedConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--fd-accent: ${config.accentColor}`,
    `--fd-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...Object.entries(palette).map(([key, value]) => `--fd-${key}: ${value}`),
  ].join("; ");
  const all = config.items.filter((item) => item.title.trim() !== "");
  const pageSize = Math.max(1, config.pageSize);
  const first = all.slice(0, pageSize);
  const done = first.length >= all.length;

  const articles = first
    .map(
      (item, index) => `        <article class="fd-item" tabindex="0" aria-labelledby="feed-title-${index}"${item.summary.trim() ? ` aria-describedby="feed-summary-${index}"` : ""} aria-posinset="${index + 1}" aria-setsize="${all.length}">
          <p class="fd-title" id="feed-title-${index}">${escapeHtml(item.title)}</p>
${item.summary.trim() ? `          <p class="fd-summary" id="feed-summary-${index}">${escapeHtml(item.summary)}</p>\n` : ""}        </article>`,
    )
    .join("\n");

  return `    <div class="fd fd--theme-${config.theme}" style="${vars}" data-feed data-mode="${config.mode}" data-page-size="${pageSize}">
      <p class="fd-label" id="feed-label">${escapeHtml(config.label)}</p>
      <div class="fd-list" role="feed" aria-labelledby="feed-label" aria-busy="false" data-list>
${articles}
      </div>
      <div class="fd-sentinel" aria-hidden="true" data-sentinel></div>
      <div class="fd-footer">
${done ? `        <p class="fd-count">That's everything: ${all.length} of ${all.length}.</p>` : `        <button class="fd-more" type="button" data-more>Load more</button>
        <p class="fd-count" data-count>Showing ${first.length} of ${all.length}</p>`}
      </div>
      <p class="fd-sr" role="status" data-status></p>
      <script type="application/json" data-source>${JSON.stringify(all).replace(/</g, "\\u003c")}</script>
    </div>`;
}

export function renderFeedHtml(config: FeedConfig) {
  return htmlPage({ title: "Feed", slug: "feed", body: renderFeedMarkup(config), script: true });
}
