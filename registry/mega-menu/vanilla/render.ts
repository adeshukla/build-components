import { escapeHtml, htmlPage, luminance, safeHref } from "@/lib/html";
import type { MegaMenuConfig, MegaMenuItem } from "../react/mega-menu";

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", muted: "#4d4a57", line: "#e4e1ec", hover: "#f4f3f8" },
  dark: { surface: "#141019", text: "#f6f5fa", muted: "#b6b3c2", line: "#2c2838", hover: "#221d2e" },
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

/** Rows are flat (one per link) so they stay easy to edit; the menus are rebuilt from them here. */
function groupItems(items: MegaMenuItem[]) {
  const menus: { name: string; groups: { name: string; links: MegaMenuItem[] }[] }[] = [];
  for (const item of items) {
    if (item.menu.trim() === "" || item.label.trim() === "") continue;
    let menu = menus.find((entry) => entry.name === item.menu);
    if (!menu) {
      menu = { name: item.menu, groups: [] };
      menus.push(menu);
    }
    let group = menu.groups.find((entry) => entry.name === item.group);
    if (!group) {
      group = { name: item.group, links: [] };
      menu.groups.push(group);
    }
    group.links.push(item);
  }
  return menus;
}

const panelId = (name: string) => `mega-panel-${name.replace(/\W+/g, "-").toLowerCase()}`;

const icons = {
  chevronDown: `<svg class="mm-chevron" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>`,
  chevronRight: `<svg class="mm-forward" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>`,
  chevronLeft: `<svg class="mm-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6l-6 6 6 6"/></svg>`,
  burger: `<svg class="mm-icon mm-icon-open" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>`,
  close: `<svg class="mm-icon mm-icon-close" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg>`,
};

/**
 * The mega menu ships as real HTML with every panel written into the page and hidden, so its
 * markup is generated from the options. The script opens and closes the panels, and on a narrow
 * screen turns the bar into a menu button with one step at a time.
 */
export function renderMegaMenuMarkup(config: MegaMenuConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const accentLuminance = luminance(config.accentColor);
  const vars = [
    `--mm-accent: ${config.accentColor}`,
    `--mm-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--mm-on-accent: ${accentLuminance > 0.179 ? "#000000" : "#ffffff"}`,
    `--mm-radius: ${config.radius}px`,
    `--mm-surface: ${palette.surface}`,
    `--mm-text: ${palette.text}`,
    `--mm-muted: ${palette.muted}`,
    `--mm-line: ${palette.line}`,
    `--mm-hover: ${palette.hover}`,
  ].join("; ");
  const classes = ["mm", `mm--cols-${config.columns}`, `mm--panel-${config.panel}`, `mm--theme-${config.theme}`].join(
    " ",
  );

  const menus = groupItems(config.items)
    .map((menu) => {
      const id = panelId(menu.name);
      const groups = menu.groups
        .map(
          (group) => `              <div class="mm-group">
${group.name.trim() ? `                <p class="mm-group-name">${escapeHtml(group.name)}</p>\n` : ""}                <ul class="mm-links">
${group.links
  .map(
    (link) => `                  <li><a class="mm-link" href="${escapeHtml(safeHref(link.href))}">
                    <span class="mm-link-label">${escapeHtml(link.label)}</span>
${config.descriptions && link.description.trim() ? `                    <span class="mm-link-description">${escapeHtml(link.description)}</span>\n` : ""}                  </a></li>`,
  )
  .join("\n")}
                </ul>
              </div>`,
        )
        .join("\n");

      return `          <div class="mm-menu" data-menu="${escapeHtml(menu.name)}">
            <button class="mm-top mm-button" type="button" aria-expanded="false" aria-controls="${id}">
              <span class="mm-button-text">${escapeHtml(menu.name)}</span>
              ${icons.chevronDown}
              ${icons.chevronRight}
            </button>
            <div class="mm-panel" id="${id}" hidden>
              <button class="mm-top mm-back" type="button" data-back>${icons.chevronLeft}${escapeHtml(config.backLabel)}</button>
              <p class="mm-panel-title">${escapeHtml(menu.name)}</p>
              <div class="mm-columns">
${groups}
              </div>
            </div>
          </div>`;
    })
    .join("\n");

  const links = config.links
    .filter((link) => link.label.trim() !== "")
    .map(
      (link) => `          <a class="mm-top" href="${escapeHtml(safeHref(link.href))}">${escapeHtml(link.label)}</a>`,
    )
    .join("\n");
  const cta = config.ctaButton
    ? `          <a class="mm-cta" href="${escapeHtml(safeHref(config.ctaHref))}">${escapeHtml(config.ctaText)}</a>\n`
    : "";

  return `    <nav class="${classes}" style="${vars}" aria-label="${escapeHtml(config.label)}" data-mega-menu data-open-on="${config.openOn}" data-breakpoint="${config.mobileBreakpoint}">
      <div class="mm-bar">
        <span class="mm-logo">${escapeHtml(config.logoText)}</span>
        <button class="mm-top mm-toggle" type="button" data-toggle aria-expanded="false" aria-controls="mega-drawer">
          ${icons.burger}${icons.close}${escapeHtml(config.menuLabel)}
        </button>
        <div class="mm-items" id="mega-drawer">
${menus}
${links}
${cta}        </div>
      </div>
    </nav>`;
}

export function renderMegaMenuHtml(config: MegaMenuConfig) {
  return htmlPage({ title: "Mega menu", slug: "mega-menu", body: renderMegaMenuMarkup(config), script: true });
}
