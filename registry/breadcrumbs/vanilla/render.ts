import { escapeHtml, htmlPage, luminance, safeHref } from "@/lib/html";
import type { BreadcrumbsConfig } from "../react/breadcrumbs";

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", muted: "#4d4a57" },
  dark: { surface: "#141019", text: "#f6f5fa", muted: "#b6b3c2" },
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

const separators = { chevron: "›", slash: "/", arrow: "→" };
const homeIcon = `<svg class="bc-home" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 11 12 4l8 7M6 10v9h12v-9"/></svg>`;

/** The trail ships as real HTML and needs no JavaScript at all. */
export function renderBreadcrumbsMarkup(config: BreadcrumbsConfig) {
  const items = config.items.filter((item) => item.label.trim() !== "");
  if (items.length === 0) return "";
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--bc-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--bc-surface: ${palette.surface}`,
    `--bc-text: ${palette.text}`,
    `--bc-muted: ${palette.muted}`,
  ].join("; ");
  const collapses = config.collapse && items.length > 2;

  const steps = items
    .map((item, index) => {
      const last = index === items.length - 1;
      const hidden = collapses && !last && index !== 0;
      const separator =
        index > 0 ? `<span class="bc-sep" aria-hidden="true">${separators[config.separator]}</span>` : "";
      const body = last
        ? `<span class="bc-current" aria-current="page">${escapeHtml(item.label)}</span>`
        : `<a class="bc-link" href="${escapeHtml(safeHref(item.href))}">${index === 0 && config.homeIcon ? homeIcon : ""}${escapeHtml(item.label)}</a>`;
      // The gap stands in for the steps between, and only on a phone.
      const gap =
        collapses && index === 0
          ? `<span class="bc-gap" aria-hidden="true">${separators[config.separator]} …</span>`
          : "";
      return `        <li class="bc-item${hidden ? " bc-hide" : ""}">${separator}${body}${gap}</li>`;
    })
    .join("\n");

  return `    <nav class="bc bc--theme-${config.theme}" style="${vars}" aria-label="${escapeHtml(config.label)}">
      <ol class="bc-list">
${steps}
      </ol>
    </nav>`;
}

export function renderBreadcrumbsHtml(config: BreadcrumbsConfig) {
  return htmlPage({ title: "Breadcrumbs", slug: "breadcrumbs", body: renderBreadcrumbsMarkup(config), script: false });
}
