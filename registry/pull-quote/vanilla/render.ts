import { escapeHtml, htmlPage, luminance, safeHref } from "@/lib/html";
import type { PullQuoteConfig } from "../react/pull-quote";

const palettes = {
  light: { surface: "#ffffff", sunk: "#f1eff7", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
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

export function renderPullQuoteMarkup(config: PullQuoteConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--pq-accent: ${config.accentColor}`,
    `--pq-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...Object.entries(palette).map(([key, value]) => `--pq-${key}: ${value}`),
  ].join("; ");

  const linked = config.sourceHref.trim() !== "" && config.source.trim() !== "";
  const hasWho = config.attribution.trim() !== "";
  const hasSource = config.source.trim() !== "";
  const source = linked
    ? `<a href="${safeHref(config.sourceHref)}">${escapeHtml(config.source)}</a>`
    : escapeHtml(config.source);

  const caption =
    hasWho || hasSource
      ? `        <figcaption class="pq-caption">${hasWho ? `<span class="pq-who">${escapeHtml(config.attribution)}</span>` : ""}${
          hasWho && hasSource ? ", " : ""
        }<!-- cite is for the work, not the person: the title goes in it, the name does not. -->${
          hasSource ? `<cite class="pq-source">${source}</cite>` : ""
        }</figcaption>`
      : "";

  const modifiers = [
    `pq--theme-${config.theme}`,
    config.align === "centre" ? "pq--centre" : "pq--left",
    config.size === "huge" ? "pq--huge" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return `    <div class="pq ${modifiers}" style="${vars}">
      <!--
        A figure with the quotation in a blockquote and the attribution in a figcaption. The attribution
        does not go inside the blockquote: that would make it part of what was said.
      -->
      <figure class="pq-figure" data-quote>
        <!-- cite is the URL the words came from, which is not the same thing as the visible source line. -->
        <blockquote class="pq-quote"${linked ? ` cite="${safeHref(config.sourceHref)}"` : ""}>${
          config.showMarks ? '<span class="pq-mark pq-mark--open" aria-hidden="true">&ldquo;</span>' : ""
        }<span>${escapeHtml(config.quote)}</span>${
          config.showMarks ? '<span class="pq-mark pq-mark--close" aria-hidden="true">&rdquo;</span>' : ""
        }</blockquote>

${caption}
      </figure>
    </div>`;
}

export function renderPullQuoteHtml(config: PullQuoteConfig) {
  return htmlPage({ title: "Pull quote", slug: "pull-quote", body: renderPullQuoteMarkup(config), script: false });
}
