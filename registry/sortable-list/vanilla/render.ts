import { escapeHtml, htmlPage, luminance, themedColour } from "@/lib/html";
import type { SortableListConfig } from "../react/sortable-list";

/** Words with something put in them: "{count} left" (D94). */
const fill = (words: string, values: Record<string, string | number>) => words.replace(/\{(\w+)\}/g, (match, name) => String(values[name] ?? match));

const palettes = {
  light: { surface: "#ffffff", raised: "#ffffff", text: "#16121f", muted: "#4d4a57", line: "#d9d5e4", hover: "#eeecf5" },
  dark: { surface: "#141019", raised: "#1f1a29", text: "#f6f5fa", muted: "#b6b3c2", line: "#3a3448", hover: "#2a2438" },
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

const grip =
  '<svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>';
const arrows = {
  up: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 15 6-6 6 6"/></svg>',
  down: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>',
};

/** The list and its controls ship in the HTML; the script moves rows and announces each move. */
export function renderSortableListMarkup(config: SortableListConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--sl-accent: ${config.accentColor}`,
    `--sl-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...(config.theme === "system" ? [] : Object.entries(palette).map(([key, value]) => `--sl-${key}: ${themedColour(key, value, dark)}`)),
  ].join("; ");
  const items = config.items.filter((item) => item.label.trim() !== "");

  const rows = items
    .map((item, index) => {
      const label = escapeHtml(item.label);
      const buttons = config.moveButtons
        ? `
          <span class="so-moves">
            <button class="so-icon" type="button" aria-label="${escapeHtml(fill(config.upLabel, { item: item.label }))}"${index === 0 ? ' aria-disabled="true"' : ""} data-up>${arrows.up}</button>
            <button class="so-icon" type="button" aria-label="${escapeHtml(fill(config.downLabel, { item: item.label }))}"${index === items.length - 1 ? ' aria-disabled="true"' : ""} data-down>${arrows.down}</button>
          </span>`
        : "";
      return `        <li class="so-item" data-label="${label}">
          <button class="so-icon so-handle" type="button" aria-label="${escapeHtml(fill(config.reorderLabel, { item: item.label }))}" aria-describedby="sortable-list-how" aria-pressed="false" data-handle>${grip}</button>
${config.numbered ? `          <span class="so-number" aria-hidden="true">${index + 1}</span>\n` : ""}          <span class="so-text">${label}</span>${buttons}
        </li>`;
    })
    .join("\n");

  return `    <div class="so so--theme-${config.theme}" style="${vars}" data-sortable-list data-words="${escapeHtml(JSON.stringify({ position: config.positionText, picked: config.pickedText, moved: config.movedText, dropped: config.droppedText, cancelled: config.cancelledText }))}">
      <p class="so-label" id="sortable-list-label">${escapeHtml(config.label)}</p>
${config.hint.trim() ? `      <p class="so-hint">${escapeHtml(config.hint)}</p>\n` : ""}      <p class="so-sr" id="sortable-list-how">${escapeHtml(config.howText)}</p>
      <ol class="so-list" aria-labelledby="sortable-list-label" data-list>
${rows}
      </ol>
      <p class="so-sr" role="status" data-status></p>
    </div>`;
}

export function renderSortableListHtml(config: SortableListConfig) {
  return htmlPage({ title: "Sortable list", slug: "sortable-list", body: renderSortableListMarkup(config), script: true });
}
