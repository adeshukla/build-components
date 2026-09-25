import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { ReadingProgressConfig } from "../react/reading-progress";

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#d9d5e4" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#3a3448" },
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

const slug = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export function renderReadingProgressMarkup(config: ReadingProgressConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--rp-accent: ${config.accentColor}`,
    `--rp-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...Object.entries(palette).map(([key, value]) => `--rp-${key}: ${value}`),
  ].join("; ");
  const sections = config.sections.filter((section) => section.title.trim() !== "");

  const links = sections
    .map(
      (section, index) => `          <li><a class="rp-link" href="#${slug(section.title)}"${index === 0 ? ' aria-current="location"' : ""}><span class="rp-sr"${index === 0 ? "" : ' hidden'}>Current section: </span>${escapeHtml(section.title)}</a></li>`,
    )
    .join("\n");

  // Example page content, so there is something to read past. Delete it in your own page.
  const body = !config.showDemo ? "" : sections
    .map(
      (section) => `        <h2 class="rp-heading" id="${slug(section.title)}">${escapeHtml(section.title)}</h2>
        <p class="rp-filler">Something to read, so the bar has somewhere to go and the contents list has something to follow. Real pages have paragraphs this long, which is why a section takes most of a screen to get through.</p>
        <p class="rp-filler">Another paragraph of the same, to make the section long enough to scroll through. Swap all of this for your own writing: the bar and the contents list read the page, not this text.</p>
        <p class="rp-filler">A third one, so each section takes about a screen and marking the current section is worth doing. Nothing here is needed by the component itself — turn the example sections off once your content is in.</p>`,
    )
    .join("\n");

  return `    <div class="rp rp--theme-${config.theme}" style="${vars}" data-reading-progress>
${config.showBar ? `      <div class="rp-track">
        <div class="rp-bar" role="progressbar" aria-label="${escapeHtml(config.label)}" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" aria-valuetext="0% read" data-bar></div>
      </div>\n` : ""}${
    config.showContents && sections.length
      ? `      <nav class="rp-contents" aria-labelledby="reading-contents">
        <p class="rp-contents-title" id="reading-contents">${escapeHtml(config.contentsTitle)}</p>
        <ul class="rp-list" data-list>
${links}
        </ul>
      </nav>\n`
      : ""
  }${body ? `      <div class="rp-page">\n${body}\n      </div>\n` : ""}
    </div>`;
}

export function renderReadingProgressHtml(config: ReadingProgressConfig) {
  return htmlPage({ title: "Reading progress", slug: "reading-progress", body: renderReadingProgressMarkup(config), script: true });
}
