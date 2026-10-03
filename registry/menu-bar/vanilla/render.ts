import { escapeHtml, htmlPage, luminance, themedColour } from "@/lib/html";
import type { MenuBarConfig } from "../react/menu-bar";

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#1b1624", sunk: "#272031", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
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

/** Runs of items with the same menu name become one menu, the same way the React output groups them. */
function toMenus(items: MenuBarConfig["items"]) {
  const menus: { name: string; items: MenuBarConfig["items"] }[] = [];
  for (const entry of items) {
    const last = menus[menus.length - 1];
    if (last !== undefined && last.name === entry.menu) last.items.push(entry);
    else menus.push({ name: entry.menu, items: [entry] });
  }
  return menus;
}

export function renderMenuBarMarkup(config: MenuBarConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--mb-accent: ${config.accentColor}`,
    `--mb-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--mb-on-accent: ${luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff"}`,
    ...(config.theme === "system" ? [] : Object.entries(palette).map(([key, value]) => `--mb-${key}: ${themedColour(key, value, dark)}`)),
  ].join("; ");

  const menus = toMenus(config.items)
    .map((menu, index) => {
      const items = menu.items
        .map(
          (entry) => `            <button class="mb-item" type="button" role="menuitem" tabindex="-1" data-label="${escapeHtml(entry.item)}">
              <span>${escapeHtml(entry.item)}</span>
              ${config.showShortcuts && entry.shortcut !== "" ? `<kbd class="mb-shortcut">${escapeHtml(entry.shortcut)}</kbd>` : ""}
            </button>`,
        )
        .join("\n");
      return `        <div class="mb-holder">
          <button class="mb-top" type="button" role="menuitem" aria-haspopup="true" aria-expanded="false" tabindex="${index === 0 ? 0 : -1}" data-top="${index}">${escapeHtml(menu.name)}</button>
          <div class="mb-menu" role="menu" aria-label="${escapeHtml(menu.name)}" data-menu="${index}" hidden>
${items}
          </div>
        </div>`;
    })
    .join("\n");

  return `    <div class="mb mb--theme-${config.theme}" style="${vars}" data-menu-bar>
      <div class="mb-bar" role="menubar" aria-label="${escapeHtml(config.label)}" aria-orientation="horizontal">
${menus}
      </div>

      <p class="mb-status" role="status" data-status></p>
    </div>`;
}

export function renderMenuBarHtml(config: MenuBarConfig) {
  return htmlPage({ title: "Menu bar", slug: "menu-bar", body: renderMenuBarMarkup(config), script: true });
}
