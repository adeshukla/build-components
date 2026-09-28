import { escapeHtml, htmlPage, luminance, safeHref } from "@/lib/html";
import type { AuthorBylineConfig } from "../react/author-byline";

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

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Written out by hand, the same way the React output does it. Duplicated: that file is a client one. */
function sayDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

function initialsFor(name: string, override: string) {
  if (override.trim() !== "") return override.trim().slice(0, 3).toUpperCase();
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function renderAuthorBylineMarkup(config: AuthorBylineConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--byl-accent: ${config.accentColor}`,
    `--byl-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...Object.entries(palette).map(([key, value]) => `--byl-${key}: ${value}`),
  ].join("; ");

  const who =
    config.nameHref.trim() === ""
      ? `<span class="byl-who">${escapeHtml(config.name)}</span>`
      : // rel="author" says what the link is, which is more than "a link with a person's name".
        `<a class="byl-link" href="${safeHref(config.nameHref)}" rel="author">${escapeHtml(config.name)}</a>`;

  const dot = '<span aria-hidden="true">·</span>';

  return `    <div class="byl byl--theme-${config.theme}${config.layout === "stacked" ? " byl--stacked" : ""}" style="${vars}">
      <!--
        Not an <address> element: that is for the contact details of the nearest article or of the page,
        and a byline on its own is neither. It is a paragraph about who wrote the thing.
      -->
      <div class="byl-row" data-byline>
        ${
          config.showAvatar
            ? `<span class="byl-avatar" aria-hidden="true">${escapeHtml(initialsFor(config.name, config.initials))}</span>`
            : ""
        }

        <div>
          <p class="byl-name"><span class="byl-by">By </span>${who}${
            config.role.trim() === "" ? "" : `<span class="byl-role">, ${escapeHtml(config.role)}</span>`
          }</p>

          <p class="byl-meta">
            <span>Published <time datetime="${escapeHtml(config.date)}">${escapeHtml(sayDate(config.date))}</time></span>
            <!-- Updated is said as well as published, not instead of it: both are facts people want. -->
            ${
              config.updatedDate.trim() === ""
                ? ""
                : `${dot}<span>Updated <time datetime="${escapeHtml(config.updatedDate)}">${escapeHtml(sayDate(config.updatedDate))}</time></span>`
            }
            ${config.readingMinutes > 0 ? `${dot}<span>${config.readingMinutes} minute read</span>` : ""}
          </p>
        </div>
      </div>
    </div>`;
}

export function renderAuthorBylineHtml(config: AuthorBylineConfig) {
  return htmlPage({ title: "Author byline", slug: "author-byline", body: renderAuthorBylineMarkup(config), script: false });
}
