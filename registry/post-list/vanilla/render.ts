import { escapeHtml, htmlPage, luminance, safeHref, themedColour } from "@/lib/html";
import type { PostListConfig } from "../react/post-list";

/** Words with something put in them: "{count} left" (D94). */
const fill = (words: string, values: Record<string, string | number>) => words.replace(/\{(\w+)\}/g, (match, name) => String(values[name] ?? match));

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#d9d5e4" },
  dark: { surface: "#141019", sunk: "#1c1726", text: "#f6f5fa", muted: "#b6b3c2", line: "#3a3448" },
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

/** "2026-09-14" as "14 September 2026", by hand from the Words options (D94): Intl differs between the server and the browser. */
function sayDate(iso: string, words: { monthNames: string; dateText: string }) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return "";
  const month = words.monthNames.split(",")[Number(match[2]) - 1]?.trim();
  return month ? fill(words.dateText, { day: Number(match[3]), month, year: match[1] }) : "";
}

/** Plain HTML, no JavaScript: the markup is generated from the options. "system" theme is handled in CSS. */
export function renderPostListMarkup(config: PostListConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--pl-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...(config.theme === "system" ? [] : Object.entries(palette).map(([key, value]) => `--pl-${key}: ${themedColour(key, value, dark)}`)),
  ].join("; ");
  const heading = config.headingLevel;
  const title = heading === "h2" ? "h3" : "h4";
  const posts = config.posts
    .filter((post) => post.title.trim() !== "")
    .map((post) => {
      const date = sayDate(post.date, config);
      return `        <li>
          <article class="pl-post">
            <${title} class="pl-title"><a class="pl-link" href="${escapeHtml(safeHref(post.href))}">${escapeHtml(post.title)}</a></${title}>
${date ? `            <p class="pl-date"><time datetime="${escapeHtml(post.date.trim())}">${date}</time></p>\n` : ""}${config.showExcerpts && post.excerpt.trim() ? `            <p class="pl-excerpt">${escapeHtml(post.excerpt)}</p>\n` : ""}          </article>
        </li>`;
    })
    .join("\n");
  return `    <section class="pl pl--${config.layout} pl--theme-${config.theme}" style="${vars}" aria-labelledby="pl-heading">
      <${heading} class="pl-heading" id="pl-heading">${escapeHtml(config.heading)}</${heading}>
${config.intro.trim() ? `      <p class="pl-intro">${escapeHtml(config.intro)}</p>\n` : ""}      <ul class="pl-list">
${posts}
      </ul>
    </section>`;
}

export function renderPostListHtml(config: PostListConfig) {
  return htmlPage({ title: "Post list", slug: "post-list", body: renderPostListMarkup(config), script: false });
}
