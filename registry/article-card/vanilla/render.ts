import { escapeHtml, htmlPage, luminance, safeHref, themedColour } from "@/lib/html";
import type { ArticleCardConfig } from "../react/article-card";

const palettes = {
  light: { surface: "#ffffff", sunk: "#f1eff7", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#181320", sunk: "#272031", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
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

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Written out by hand, the same way the React output does it. Duplicated: that file is a client one. */
function sayDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

export function renderArticleCardMarkup(config: ArticleCardConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--atc-accent: ${config.accentColor}`,
    `--atc-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...(config.theme === "system" ? [] : Object.entries(palette).map(([key, value]) => `--atc-${key}: ${themedColour(key, value, dark)}`)),
  ].join("; ");

  const tags = config.tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const described = config.thumbAlt.trim() !== "";

  return `    <div class="atc atc--theme-${config.theme}" style="${vars}">
      <!--
        One link per card, and it is the heading. A card with a "Read more" as well gives a screen reader
        two links to the same place, one of them called "Read more".
      -->
      <article class="atc-card${config.wholeCardClickable ? " atc--whole" : ""}" data-card>
        ${
          config.showThumb
            ? `<div class="atc-thumb"${described ? ` role="img" aria-label="${escapeHtml(config.thumbAlt)}"` : ' aria-hidden="true"'}></div>`
            : ""
        }

        <div class="atc-body">
          <${config.headingLevel} class="atc-title"><a class="atc-link" href="${safeHref(config.href)}">${escapeHtml(config.title)}</a></${config.headingLevel}>

          <p class="atc-summary">${escapeHtml(config.summary)}</p>

          <p class="atc-meta">
            <time datetime="${escapeHtml(config.date)}">${escapeHtml(sayDate(config.date))}</time>
            ${config.readingMinutes > 0 ? `<span aria-hidden="true">·</span><span>${config.readingMinutes} minute read</span>` : ""}
          </p>

          ${tags.length === 0 ? "" : `<ul class="atc-tags">${tags.map((tag) => `<li>${escapeHtml(tag)}</li>`).join("")}</ul>`}
        </div>
      </article>
    </div>`;
}

export function renderArticleCardHtml(config: ArticleCardConfig) {
  return htmlPage({ title: "Article card", slug: "article-card", body: renderArticleCardMarkup(config), script: false });
}
