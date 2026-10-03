import { escapeHtml, htmlPage, luminance, themedColour } from "@/lib/html";
import type { SplitFeatureConfig } from "../react/split-feature";

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
function safeUrl(value: string) {
  if (value.startsWith("/") || value.startsWith("#")) return value;
  try {
    const url = new URL(value, "https://example.com");
    return url.protocol === "http:" || url.protocol === "https:" ? value : "";
  } catch {
    return "";
  }
}

export function renderSplitFeatureMarkup(config: SplitFeatureConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--spl-accent: ${config.accentColor}`,
    `--spl-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...(config.theme === "system" ? [] : Object.entries(palette).map(([key, value]) => `--spl-${key}: ${themedColour(key, value, dark)}`)),
  ].join("; ");

  const src = safeUrl(config.mediaSrc);
  const described = config.mediaAlt.trim() !== "";
  const link = safeUrl(config.linkHref);

  const points =
    config.points.length === 0
      ? ""
      : `          <ul class="spl-points">
${config.points
  .map(
    (point) =>
      `            <li><!-- The tick is decoration: it is a list, and a screen reader says so. --><svg class="spl-tick" viewBox="0 0 20 20" aria-hidden="true"><path d="M7.6 14.2 3.4 10l1.4-1.4 2.8 2.8 7-7L16 5.8z"></path></svg><span>${escapeHtml(point.text)}</span></li>`,
  )
  .join("\n")}
          </ul>`;

  const media =
    src === ""
      ? `<div class="spl-media spl-placeholder"${described ? ` role="img" aria-label="${escapeHtml(config.mediaAlt)}"` : ' aria-hidden="true"'} data-media>[TODO: set mediaSrc]</div>`
      : `<img class="spl-media" src="${escapeHtml(src)}" alt="${escapeHtml(config.mediaAlt)}" loading="lazy" decoding="async" data-media>`;

  return `    <div class="spl spl--theme-${config.theme} spl--${config.aspect}${config.mediaSide === "left" ? " spl--media-left" : ""}" style="${vars}">
      <section class="spl-section" aria-labelledby="spl-heading">
        <!--
          The words come first in the source whichever side the picture is on. Only the column placement
          changes, so the reading order never depends on the layout.
        -->
        <div class="spl-words">
          <${config.headingLevel} class="spl-heading" id="spl-heading">${escapeHtml(config.heading)}</${config.headingLevel}>
          <p class="spl-body">${escapeHtml(config.body)}</p>
${points}
          ${
            config.linkLabel.trim() === "" || link === ""
              ? ""
              : `<p class="spl-link-row"><a class="spl-link" href="${escapeHtml(link)}">${escapeHtml(config.linkLabel)}</a></p>`
          }
        </div>

        <div class="spl-media-holder">${media}</div>
      </section>
    </div>`;
}

export function renderSplitFeatureHtml(config: SplitFeatureConfig) {
  return htmlPage({ title: "Split feature", slug: "split-feature", body: renderSplitFeatureMarkup(config), script: false });
}
