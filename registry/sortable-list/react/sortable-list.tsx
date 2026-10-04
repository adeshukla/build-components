"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

export type SortableListConfig = {
  label: string;
  hint: string;
  items: { label: string }[];
  moveButtons: boolean;
  numbered: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
  howText: string;
  positionText: string;
  pickedText: string;
  movedText: string;
  droppedText: string;
  cancelledText: string;
  reorderLabel: string;
  upLabel: string;
  downLabel: string;
  alreadyFirstText: string;
  alreadyLastText: string;
};

// @config-start
const defaultConfig: SortableListConfig = {
  label: "Your priorities",
  hint: "Drag a handle, or press Space on it and use the arrow keys.",
  items: [
    { label: "Fix the checkout bug" },
    { label: "Write release notes" },
    { label: "Review the design system PR" },
    { label: "Plan next sprint" },
    { label: "Update dependencies" },
  ],
  moveButtons: true,
  numbered: true,
  theme: "light",
  accentColor: "#2563eb",
  howText: "Press Space to pick up, the up and down arrows to move, Space again to drop, and Escape to cancel.",
  positionText: "position {index} of {total}",
  pickedText: "Picked up {item}, {position}. Use the up and down arrows to move it, Space to drop, Escape to cancel.",
  movedText: "{item} moved to {position}.",
  droppedText: "{item} dropped at {position}.",
  cancelledText: "Cancelled. {item} is back at {position}.",
  reorderLabel: "Reorder {item}",
  upLabel: "Move {item} up",
  downLabel: "Move {item} down",
  alreadyFirstText: "{item} is already first.",
  alreadyLastText: "{item} is already last.",
};
// @config-end

type Item = { id: number; label: string };

const palettes = {
  light: { surface: "#ffffff", raised: "#ffffff", text: "#16121f", muted: "#4d4a57", line: "#d9d5e4", hover: "#eeecf5" },
  dark: { surface: "#141019", raised: "#1f1a29", text: "#f6f5fa", muted: "#b6b3c2", line: "#3a3448", hover: "#2a2438" },
};

// Follows the system, unless the page has a light/dark choice of its own: <html data-bc-scheme> (D87).
const darkMedia = {
  subscribe: (onChange: () => void) => {
    const list = window.matchMedia("(prefers-color-scheme: dark)");
    const chosen = new MutationObserver(onChange);
    list.addEventListener("change", onChange);
    chosen.observe(document.documentElement, { attributes: true, attributeFilter: ["data-bc-scheme"] });
    return () => {
      list.removeEventListener("change", onChange);
      chosen.disconnect();
    };
  },
  get: () => {
    const chosen = document.documentElement.dataset.bcScheme;
    return chosen ? chosen === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  },
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

function move(list: Item[], from: number, to: number) {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

const iconButton =
  "grid size-8 shrink-0 cursor-pointer place-items-center rounded-[var(--bc-radius-sm,0.375rem)] text-(--sl-muted) hover:bg-(--sl-hover) hover:text-(--sl-text) focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--sl-accent-text) aria-disabled:cursor-default aria-disabled:opacity-40 aria-disabled:hover:bg-transparent";

/** Words with something put in them: "{count} left" (D94). */
const fill = (words: string, values: Record<string, string | number>) => words.replace(/\{(\w+)\}/g, (match, name) => String(values[name] ?? match));

export function SortableList({
  config = defaultConfig,
  onChange,
}: {
  config?: SortableListConfig;
  /** Called with the labels in their new order after every move. */
  onChange?: (labels: string[]) => void;
}) {
  const id = useId();
  const [items, setItems] = useState<Item[]>(() =>
    config.items.map((item, index) => ({ id: index, label: item.label })).filter((item) => item.label.trim() !== ""),
  );
  const [grabbed, setGrabbed] = useState<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const before = useRef<Item[]>([]);
  const rows = useRef(new Map<number, HTMLLIElement>());
  // Moving a row moves its DOM node, which drops focus; this puts it back on the same control.
  const refocus = useRef<string | null>(null);

  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--sl-accent": config.accentColor,
    "--sl-accent-text": readableAccent(config.accentColor, dark),
    "--sl-surface": `var(--bc-${dark ? "dark" : "light"}-surface, ${palette.surface})`,
    "--sl-raised": palette.raised,
    "--sl-text": `var(--bc-${dark ? "dark" : "light"}-text, ${palette.text})`,
    "--sl-muted": `var(--bc-${dark ? "dark" : "light"}-muted, ${palette.muted})`,
    "--sl-line": `var(--bc-${dark ? "dark" : "light"}-line, ${palette.line})`,
    "--sl-hover": palette.hover,
  } as CSSProperties;

  useEffect(() => {
    if (!refocus.current) return;
    document.getElementById(refocus.current)?.focus();
    refocus.current = null;
  }, [items]);

  const where = (list: Item[], itemId: number) => list.findIndex((item) => item.id === itemId);
  const position = (index: number, list: Item[]) => fill(config.positionText, { index: index + 1, total: list.length });

  function reorder(from: number, to: number, control: string) {
    if (to < 0 || to >= items.length || to === from) return false;
    const next = move(items, from, to);
    refocus.current = control;
    setItems(next);
    onChange?.(next.map((item) => item.label));
    return true;
  }

  function onHandleKey(event: KeyboardEvent<HTMLButtonElement>, item: Item) {
    const index = where(items, item.id);
    const control = `${id}-handle-${item.id}`;
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      if (grabbed === item.id) {
        setGrabbed(null);
        setMessage(fill(config.droppedText, { item: item.label, position: position(index, items) }));
      } else {
        before.current = items;
        setGrabbed(item.id);
        setMessage(fill(config.pickedText, { item: item.label, position: position(index, items) }));
      }
    } else if (grabbed === item.id && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
      event.preventDefault();
      const to = index + (event.key === "ArrowUp" ? -1 : 1);
      if (reorder(index, to, control)) setMessage(fill(config.movedText, { item: item.label, position: position(to, items) }));
    } else if (grabbed === item.id && event.key === "Escape") {
      event.preventDefault();
      refocus.current = control;
      setItems(before.current);
      setGrabbed(null);
      setMessage(fill(config.cancelledText, { item: item.label, position: position(where(before.current, item.id), before.current) }));
    }
  }

  function onButton(item: Item, step: -1 | 1) {
    const index = where(items, item.id);
    const to = index + step;
    if (reorder(index, to, `${id}-${step < 0 ? "up" : "down"}-${item.id}`)) {
      setMessage(fill(config.movedText, { item: item.label, position: position(to, items) }));
    } else {
      setMessage(fill(step < 0 ? config.alreadyFirstText : config.alreadyLastText, { item: item.label }));
    }
  }

  // Pointer dragging: the row follows the pointer past each neighbour's midpoint. The listeners sit
  // on the window, because moving the row's DOM node would drop pointer capture on the handle, and
  // they read the latest order from a ref, because pointer events outrun re-renders.
  const latest = useRef(items);
  useEffect(() => {
    latest.current = items;
  });
  useEffect(() => {
    if (dragging === null) return;
    function onMove(event: globalThis.PointerEvent) {
      const current = latest.current;
      const from = current.findIndex((item) => item.id === dragging);
      let to = from;
      current.forEach((other, index) => {
        const box = rows.current.get(other.id)?.getBoundingClientRect();
        if (!box || index === from) return;
        const middle = box.top + box.height / 2;
        if (index < from && event.clientY < middle) to = Math.min(to, index);
        if (index > from && event.clientY > middle) to = Math.max(to, index);
      });
      if (to === from) return;
      latest.current = move(current, from, to);
      setItems(latest.current);
    }
    function onUp() {
      setDragging(null);
      const current = latest.current;
      const index = current.findIndex((item) => item.id === dragging);
      if (index === before.current.findIndex((item) => item.id === dragging)) return;
      setMessage(fill(config.droppedText, { item: current[index].label, position: position(index, current) }));
      onChange?.(current.map((item) => item.label));
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [dragging, onChange]);

  return (
    <div style={style} className="max-w-md bg-(--sl-surface) text-(--sl-text)">
      <p id={`${id}-label`} className="font-medium">
        {config.label}
      </p>
      {config.hint.trim() !== "" && <p className="mt-0.5 text-sm text-(--sl-muted)">{config.hint}</p>}
      <p id={`${id}-how`} className="sr-only">
        {config.howText}
      </p>
      <ol aria-labelledby={`${id}-label`} className="mt-3 space-y-2">
        {items.map((item, index) => {
          const active = grabbed === item.id || dragging === item.id;
          return (
            <li
              key={item.id}
              ref={(element) => {
                if (element) rows.current.set(item.id, element);
                else rows.current.delete(item.id);
              }}
              className={`flex min-h-12 items-center gap-2 rounded-[var(--bc-radius-md,0.5rem)] border bg-(--sl-raised) px-2 py-1.5 transition-shadow motion-reduce:transition-none ${active ? "border-(--sl-accent) shadow-lg ring-1 ring-(--sl-accent)" : "border-(--sl-line)"}`}
            >
              <button
                id={`${id}-handle-${item.id}`}
                type="button"
                aria-label={fill(config.reorderLabel, { item: item.label })}
                aria-describedby={`${id}-how`}
                aria-pressed={grabbed === item.id}
                onKeyDown={(event) => onHandleKey(event, item)}
                onBlur={() => {
                  if (grabbed === item.id && refocus.current === null) setGrabbed(null);
                }}
                onPointerDown={(event: PointerEvent<HTMLButtonElement>) => {
                  if (event.button !== 0) return;
                  before.current = items;
                  setDragging(item.id);
                }}
                className={`${iconButton} touch-none ${dragging === item.id ? "cursor-grabbing" : "cursor-grab"}`}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="size-5">
                  {[6, 12, 18].map((y) => (
                    <g key={y}>
                      <circle cx="9" cy={y} r="1.5" />
                      <circle cx="15" cy={y} r="1.5" />
                    </g>
                  ))}
                </svg>
              </button>
              {config.numbered && (
                <span aria-hidden="true" className="w-5 shrink-0 text-right text-sm text-(--sl-muted) tabular-nums">
                  {index + 1}
                </span>
              )}
              <span className="min-w-0 flex-1 break-words">{item.label}</span>
              {config.moveButtons && (
                <span className="flex shrink-0">
                  {([-1, 1] as const).map((step) => {
                    const atEnd = step < 0 ? index === 0 : index === items.length - 1;
                    return (
                      <button
                        key={step}
                        id={`${id}-${step < 0 ? "up" : "down"}-${item.id}`}
                        type="button"
                        aria-label={fill(step < 0 ? config.upLabel : config.downLabel, { item: item.label })}
                        aria-disabled={atEnd || undefined}
                        onClick={() => onButton(item, step)}
                        className={iconButton}
                      >
                        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4">
                          <path d={step < 0 ? "m6 15 6-6 6 6" : "m6 9 6 6 6-6"} />
                        </svg>
                      </button>
                    );
                  })}
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <p role="status" className="sr-only">
        {message}
      </p>
    </div>
  );
}
