import { escapeHtml, htmlPage, luminance, safeHref } from "@/lib/html";
import type { MenuConfig } from "../react/menu";

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", muted: "#4d4a57", line: "#d9d5e4", hover: "#f4f3f8" },
  dark: { surface: "#141019", text: "#f6f5fa", muted: "#b6b3c2", line: "#3a3448", hover: "#221d2e" },
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

const chevron = `<svg class="mn-chevron" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>`;

/** The menu ships as real HTML, hidden until the script opens it. */
export function renderMenuMarkup(config: MenuConfig) {
  const items = config.items.filter((item) => item.label.trim() !== "");
  if (items.length === 0) return "";
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--mn-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--mn-radius: ${config.radius}px`,
    `--mn-surface: ${palette.surface}`,
    `--mn-text: ${palette.text}`,
    `--mn-muted: ${palette.muted}`,
    `--mn-line: ${palette.line}`,
    `--mn-hover: ${palette.hover}`,
  ].join("; ");

  const list = items
    .map((item) =>
      item.href.trim() !== ""
        ? `          <a class="mn-item" role="menuitem" tabindex="-1" href="${escapeHtml(safeHref(item.href))}">${escapeHtml(item.label)}</a>`
        : `          <button class="mn-item" role="menuitem" tabindex="-1" type="button">${escapeHtml(item.label)}</button>`,
    )
    .join("\n");

  return `    <div class="mn mn--${config.align} mn--theme-${config.theme}" style="${vars}" data-menu data-type-ahead="${config.typeAhead}">
      <button class="mn-button" type="button" aria-haspopup="true" aria-expanded="false" aria-controls="menu-list" data-button>
        ${escapeHtml(config.buttonText)}${config.chevron ? chevron : ""}
      </button>
      <div class="mn-list" id="menu-list" role="menu" aria-label="${escapeHtml(config.buttonText)}" hidden>
${list}
      </div>
    </div>`;
}

export function renderMenuHtml(config: MenuConfig) {
  return htmlPage({ title: "Dropdown menu", slug: "menu", body: renderMenuMarkup(config), script: true });
}
