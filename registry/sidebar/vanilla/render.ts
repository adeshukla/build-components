import { escapeHtml, htmlPage, luminance, safeHref } from "@/lib/html";
import type { SidebarConfig, SidebarItem } from "../react/sidebar";

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#d9d5e4", hover: "#f0eff6" },
  dark: { surface: "#141019", sunk: "#1c1726", text: "#f6f5fa", muted: "#b6b3c2", line: "#3a3448", hover: "#221d2e" },
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

/** Rows are flat so they stay easy to edit; the sections are rebuilt from them here. */
function groupItems(items: SidebarItem[]) {
  const sections: { name: string; links: SidebarItem[] }[] = [];
  for (const item of items) {
    if (item.label.trim() === "") continue;
    let section = sections.find((entry) => entry.name === item.section);
    if (!section) {
      section = { name: item.section, links: [] };
      sections.push(section);
    }
    section.links.push(item);
  }
  return sections;
}

const sectionId = (name: string) => `sidebar-${name.replace(/\W+/g, "-").toLowerCase()}`;

/**
 * The sidebar ships as real HTML with every link in place. The script only folds the sections
 * away and runs the drawer on a narrow screen.
 */
export function renderSidebarMarkup(config: SidebarConfig) {
  const sections = groupItems(config.items);
  if (sections.length === 0) return "";
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--sb-accent: ${config.accentColor}`,
    `--sb-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--sb-radius: ${config.radius}px`,
    `--sb-width: ${config.width}px`,
    `--sb-surface: ${palette.surface}`,
    `--sb-sunk: ${palette.sunk}`,
    `--sb-text: ${palette.text}`,
    `--sb-muted: ${palette.muted}`,
    `--sb-line: ${palette.line}`,
    `--sb-hover: ${palette.hover}`,
  ].join("; ");

  const groups = sections
    .map((section) => {
      const id = sectionId(section.name);
      const heading =
        section.name.trim() === ""
          ? ""
          : config.collapsible
            ? `          <h2 class="sb-heading">
            <button class="sb-toggle-section" type="button" aria-expanded="true" aria-controls="${id}">
              ${escapeHtml(section.name)}
              <svg class="sb-chevron" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
            </button>
          </h2>\n`
            : `          <h2 class="sb-heading sb-heading--static">${escapeHtml(section.name)}</h2>\n`;

      const links = section.links
        .map((item) => {
          const active = item.href.trim() !== "" && item.href === config.activeHref;
          const badge =
            config.badges && item.badge.trim() !== ""
              ? `<span class="sb-badge">${escapeHtml(item.badge)}<span class="sb-sr"> waiting</span></span>`
              : "";
          return `            <li><a class="sb-link${active ? " sb-active" : ""}" href="${escapeHtml(safeHref(item.href))}"${active ? ' aria-current="page"' : ""}>${escapeHtml(item.label)}${badge}</a></li>`;
        })
        .join("\n");

      return `        <div class="sb-section">
${heading}          <ul class="sb-links" id="${id}">
${links}
          </ul>
        </div>`;
    })
    .join("\n");

  return `    <div class="sb sb--theme-${config.theme}" style="${vars}" data-sidebar data-breakpoint="${config.mobileBreakpoint}">
      <button class="sb-toggle" type="button" aria-expanded="false" aria-controls="sidebar-drawer" data-toggle>
        <svg class="sb-icon sb-icon-open" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
        <svg class="sb-icon sb-icon-close" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg>
        ${escapeHtml(config.toggleText)}
      </button>
      <div class="sb-panel" id="sidebar-drawer">
        <nav class="sb-nav" aria-label="${escapeHtml(config.label)}">
${groups}
        </nav>
      </div>
    </div>`;
}

export function renderSidebarHtml(config: SidebarConfig) {
  return htmlPage({ title: "Sidebar navigation", slug: "sidebar", body: renderSidebarMarkup(config), script: true });
}
