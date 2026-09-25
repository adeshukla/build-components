import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { KanbanConfig } from "../react/kanban";

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", card: "#ffffff", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#141019", sunk: "#221d2e", card: "#1c1826", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
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

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export function renderKanbanMarkup(config: KanbanConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--kb-accent: ${config.accentColor}`,
    `--kb-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...Object.entries(palette).map(([key, value]) => `--kb-${key}: ${value}`),
  ].join("; ");

  const columns = config.columns.filter((column) => column.name.trim() !== "");
  const names = columns.map((column) => column.name);
  const cards = config.cards
    .filter((card) => card.title.trim() !== "")
    .map((card) => ({ ...card, column: names.includes(card.column) ? card.column : names[0] ?? "" }));

  const board = columns
    .map((column, index) => {
      const inColumn = cards.filter((card) => card.column === column.name);
      const items = inColumn
        .map(
          (card) => `          <li class="kb-card"${config.allowDrag ? ' draggable="true"' : ""} data-card data-title="${escapeHtml(card.title)}">
            <span>${escapeHtml(card.title)}</span>
            <!-- Dragging is optional; these buttons are what makes the board usable without a pointer. -->
            <span class="kb-moves">
              <button class="kb-move" type="button" data-move="-1"${index > 0 ? "" : " hidden"}><span class="kb-sr">Move ${escapeHtml(card.title)} to ${escapeHtml(names[index - 1] ?? "")}</span><span aria-hidden="true">←</span></button>
              <button class="kb-move" type="button" data-move="1"${index < columns.length - 1 ? "" : " hidden"}><span class="kb-sr">Move ${escapeHtml(card.title)} to ${escapeHtml(names[index + 1] ?? "")}</span><span aria-hidden="true">→</span></button>
            </span>
          </li>`,
        )
        .join("\n");
      return `        <section class="kb-column" aria-labelledby="kb-${slug(column.name)}" data-column="${escapeHtml(column.name)}">
          <h3 class="kb-column-name" id="kb-${slug(column.name)}">${escapeHtml(column.name)}${config.showCounts ? `<span class="kb-count" data-count> (${inColumn.length})</span>` : ""}</h3>
          <ul class="kb-list" data-list>
${items}
          </ul>
        </section>`;
    })
    .join("\n");

  return `    <div class="kb kb--theme-${config.theme}" style="${vars}" data-kanban${config.allowDrag ? ' data-drag="true"' : ""}>
      <div class="kb-board" aria-label="${escapeHtml(config.label)}">
${board}
      </div>
      <!-- A card jumping to another column is invisible to a screen reader: say where it went. -->
      <p class="kb-status" role="status" data-status></p>
    </div>`;
}

export function renderKanbanHtml(config: KanbanConfig) {
  return htmlPage({ title: "Kanban board", slug: "kanban", body: renderKanbanMarkup(config), script: true });
}
