import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { SearchConfig } from "../react/search";

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#d9d5e4", hover: "#eeecf5" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#3a3448", hover: "#2a2438" },
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

const icon = `<svg class="se-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>`;

/**
 * The box ships as real HTML; the data rides along in a JSON script block, so replacing it is
 * one edit and needs no build step. The script does the walking, matching and listing.
 */
export function renderSearchMarkup(config: SearchConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--se-accent: ${config.accentColor}`,
    `--se-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--se-radius: ${config.radius}px`,
    `--se-surface: ${palette.surface}`,
    `--se-sunk: ${palette.sunk}`,
    `--se-text: ${palette.text}`,
    `--se-muted: ${palette.muted}`,
    `--se-line: ${palette.line}`,
    `--se-hover: ${palette.hover}`,
  ].join("; ");
  const dialog = config.layout === "dialog";

  // "<" is escaped so data containing "</script>" cannot end the block early.
  let data = "[]";
  try {
    data = JSON.stringify(JSON.parse(config.data), null, 2).replace(/</g, "\\u003c");
  } catch {
    // Unreadable data searches nothing rather than breaking the page.
  }

  const panel = `        <label class="se-label${dialog ? " se-sr" : ""}" for="search-input">${escapeHtml(config.label)}</label>
        <div class="se-field">
          ${icon}
          <input class="se-input" id="search-input" type="search" role="combobox" aria-expanded="false" aria-controls="search-results" aria-autocomplete="list" autocomplete="off" placeholder="${escapeHtml(config.placeholder)}" data-input>
        </div>
        <p class="se-sr" aria-live="polite" data-announce></p>
        <p class="se-empty" data-empty hidden>${escapeHtml(config.emptyText)}</p>
        <div class="se-results" id="search-results" role="listbox" aria-label="${escapeHtml(config.label)}, results" data-results hidden></div>`;

  const settings = [
    "data-search",
    `data-layout="${config.layout}"`,
    `data-title-key="${escapeHtml(config.titleKey.trim() || "title")}"`,
    `data-fields="${escapeHtml(config.fields)}"`,
    `data-max="${config.maxResults}"`,
    `data-groups="${config.groups}"`,
    `data-highlight="${config.highlight}"`,
    `data-shortcut="${config.shortcut}"`,
    `data-empty-text="${escapeHtml(config.emptyText)}"`,
  ].join(" ");

  const body = dialog
    ? `      <button class="se-trigger" type="button" data-trigger>
        ${icon}
        <span class="se-trigger-text">${escapeHtml(config.label)}</span>
${config.shortcut ? `        <kbd class="se-kbd" data-kbd>Ctrl K</kbd>\n` : ""}      </button>
      <dialog class="se-dialog" aria-label="${escapeHtml(config.label)}" data-dialog>
${panel}
      </dialog>`
    : panel;

  return `    <div class="se se--${config.layout} se--theme-${config.theme}" style="${vars}" ${settings}>
${body}
      <script type="application/json" data-source>${data}</script>
    </div>`;
}

export function renderSearchHtml(config: SearchConfig) {
  return htmlPage({ title: "Search", slug: "search", body: renderSearchMarkup(config), script: true });
}
