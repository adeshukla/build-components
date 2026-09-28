import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { PageHeaderConfig } from "../react/page-header";

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
function safeHref(href: string) {
  if (href.startsWith("/") || href.startsWith("#")) return href;
  try {
    const url = new URL(href, "https://example.com");
    return url.protocol === "http:" || url.protocol === "https:" ? href : "#";
  } catch {
    return "#";
  }
}

export function renderPageHeaderMarkup(config: PageHeaderConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--pgh-accent: ${config.accentColor}`,
    `--pgh-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--pgh-on-accent: ${luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff"}`,
    ...Object.entries(palette).map(([key, value]) => `--pgh-${key}: ${value}`),
  ].join("; ");

  const crumbs =
    !config.showTrail || config.crumbs.length === 0
      ? ""
      : `        <!-- The trail belongs in the header, and it is a nav of its own with its own name. -->
        <nav class="pgh-crumbs" aria-label="Breadcrumb">
          <ol class="pgh-trail">
${config.crumbs
  .map(
    (crumb) =>
      `            <li><a class="pgh-crumb" href="${escapeHtml(safeHref(crumb.href))}">${escapeHtml(crumb.label)}</a><span class="pgh-sep" aria-hidden="true">/</span></li>`,
  )
  .join("\n")}
            <!-- The current page is the last step and is not a link: there is nowhere for it to go. -->
            <li class="pgh-current" aria-current="page">${escapeHtml(config.title)}</li>
          </ol>
        </nav>`;

  const actions =
    config.primaryLabel.trim() === "" && config.secondaryLabel.trim() === ""
      ? ""
      : `        <div class="pgh-actions">
          ${config.primaryLabel.trim() === "" ? "" : `<a class="pgh-primary" href="${escapeHtml(safeHref(config.primaryHref))}">${escapeHtml(config.primaryLabel)}</a>`}
          ${config.secondaryLabel.trim() === "" ? "" : `<a class="pgh-secondary" href="${escapeHtml(safeHref(config.secondaryHref))}">${escapeHtml(config.secondaryLabel)}</a>`}
        </div>`;

  const meta =
    config.metaValue.trim() === ""
      ? ""
      : `        <!-- A labelled pair, not a bare date: "24 September 2026" alone says nothing about what it is. -->
        <dl class="pgh-meta"><dt>${escapeHtml(config.metaLabel)}</dt><dd>${escapeHtml(config.metaValue)}</dd></dl>`;

  return `    <div class="pgh pgh--theme-${config.theme}${config.align === "centre" ? " pgh--centre" : ""}" style="${vars}">
      <!--
        A header element, so it is a landmark whichever page it is on — and it holds the page's one h1,
        which is the single most useful thing on it for anyone navigating by heading.
      -->
      <header class="pgh-header" data-page-header>
        <div class="pgh-inner">
${crumbs}
          <h1 class="pgh-title">${escapeHtml(config.title)}</h1>
          ${config.lede.trim() === "" ? "" : `<p class="pgh-lede">${escapeHtml(config.lede)}</p>`}
${actions}
${meta}
        </div>
      </header>
    </div>`;
}

export function renderPageHeaderHtml(config: PageHeaderConfig) {
  return htmlPage({ title: "Page header", slug: "page-header", body: renderPageHeaderMarkup(config), script: false });
}
