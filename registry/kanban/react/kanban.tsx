"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export type KanbanConfig = {
  label: string;
  columns: { name: string }[];
  cards: { title: string; column: string }[];
  showCounts: boolean;
  allowDrag: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: KanbanConfig = {
  label: "Refit board",
  columns: [{ name: "To do" }, { name: "In progress" }, { name: "Done" }],
  cards: [
    { title: "Order sailcloth", column: "To do" },
    { title: "Sand the deck", column: "To do" },
    { title: "Rewire the cabin", column: "In progress" },
    { title: "Replace the winch", column: "In progress" },
    { title: "Paint the hull", column: "Done" },
  ],
  showCounts: true,
  allowDrag: true,
  theme: "light",
  accentColor: "#7c3aed",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", card: "#ffffff", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#141019", sunk: "#221d2e", card: "#1c1826", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
};

const darkMedia = {
  subscribe: (onChange: () => void) => {
    const list = window.matchMedia("(prefers-color-scheme: dark)");
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  },
  get: () => window.matchMedia("(prefers-color-scheme: dark)").matches,
};

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

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

export function Kanban({ config = defaultConfig }: { config?: KanbanConfig }) {
  const columns = config.columns.filter((column) => column.name.trim() !== "");
  const [cards, setCards] = useState(() =>
    config.cards
      .filter((card) => card.title.trim() !== "")
      .map((card) => ({ ...card, column: columns.some((column) => column.name === card.column) ? card.column : columns[0]?.name ?? "" })),
  );
  const [said, setSaid] = useState("");
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--kb-accent": config.accentColor,
    "--kb-accent-text": readableAccent(config.accentColor, dark),
    "--kb-surface": palette.surface,
    "--kb-sunk": palette.sunk,
    "--kb-card": palette.card,
    "--kb-text": palette.text,
    "--kb-muted": palette.muted,
    "--kb-line": palette.line,
  } as CSSProperties;

  function moveTo(title: string, column: string) {
    const next = cards.map((card) => (card.title === title ? { ...card, column } : card));
    const inColumn = next.filter((card) => card.column === column);
    setCards(next);
    setSaid(`${title} moved to ${column}, ${inColumn.findIndex((card) => card.title === title) + 1} of ${inColumn.length}`);
    // The button that was pressed belongs to the old column and is about to be re-rendered
    // elsewhere: remember the card so focus can follow it instead of falling back to the body.
    moved.current = title;
  }

  const moved = useRef<string | null>(null);
  const items = useRef(new Map<string, HTMLLIElement | null>());
  useEffect(() => {
    if (!moved.current) return;
    items.current.get(moved.current)?.querySelector("button")?.focus();
    moved.current = null;
  }, [cards]);

  return (
    <div style={style} className="bg-(--kb-surface) text-(--kb-text)">
      <div aria-label={config.label} className="grid gap-3 sm:grid-cols-3">
        {columns.map((column, columnIndex) => {
          const inColumn = cards.filter((card) => card.column === column.name);
          return (
            <section
              key={column.name}
              aria-labelledby={`kb-${slug(column.name)}`}
              onDragOver={config.allowDrag ? (event) => event.preventDefault() : undefined}
              onDrop={
                config.allowDrag
                  ? (event) => {
                      event.preventDefault();
                      const title = event.dataTransfer.getData("text/plain");
                      if (title) moveTo(title, column.name);
                    }
                  : undefined
              }
              className="rounded-lg border border-(--kb-line) bg-(--kb-sunk) p-3"
            >
              <h3 id={`kb-${slug(column.name)}`} className="text-sm font-semibold">
                {column.name}
                {/* Part of the heading, with the space, so the name reads "To do (2)" rather than "To do(2)". */}
                {config.showCounts && <span className="font-normal text-(--kb-muted)">{` (${inColumn.length})`}</span>}
              </h3>
              <ul className="mt-2 flex list-none flex-col gap-2 p-0">
                {inColumn.map((card) => (
                  <li
                    key={card.title}
                    ref={(node) => {
                      items.current.set(card.title, node);
                    }}
                    draggable={config.allowDrag}
                    onDragStart={config.allowDrag ? (event) => event.dataTransfer.setData("text/plain", card.title) : undefined}
                    className="flex items-center justify-between gap-2 rounded-md border border-(--kb-line) bg-(--kb-card) p-2 text-sm"
                  >
                    <span>{card.title}</span>
                    {/* Dragging is optional; these buttons are what makes the board usable without a pointer. */}
                    <span className="flex shrink-0 gap-1">
                      {columnIndex > 0 && (
                        <button
                          type="button"
                          onClick={() => moveTo(card.title, columns[columnIndex - 1].name)}
                          className="inline-flex size-8 cursor-pointer items-center justify-center rounded border border-(--kb-line) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--kb-accent-text)"
                        >
                          <span className="sr-only">{`Move ${card.title} to ${columns[columnIndex - 1].name}`}</span>
                          <span aria-hidden="true">←</span>
                        </button>
                      )}
                      {columnIndex < columns.length - 1 && (
                        <button
                          type="button"
                          onClick={() => moveTo(card.title, columns[columnIndex + 1].name)}
                          className="inline-flex size-8 cursor-pointer items-center justify-center rounded border border-(--kb-line) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--kb-accent-text)"
                        >
                          <span className="sr-only">{`Move ${card.title} to ${columns[columnIndex + 1].name}`}</span>
                          <span aria-hidden="true">→</span>
                        </button>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      {/* A card jumping to another column is invisible to a screen reader: say where it went. */}
      <p role="status" className="mt-3 text-sm text-(--kb-muted)">
        {said}
      </p>
    </div>
  );
}
