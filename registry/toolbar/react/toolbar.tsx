"use client";

import { useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export type ToolbarConfig = {
  label: string;
  items: { label: string; kind: string }[];
  orientation: "horizontal" | "vertical";
  theme: "light" | "dark" | "system";
  accentColor: string;
  onText: string;
  offText: string;
  doneText: string;
};

// @config-start
const defaultConfig: ToolbarConfig = {
  label: "Text formatting",
  items: [
    { label: "Bold", kind: "toggle" },
    { label: "Italic", kind: "toggle" },
    { label: "Underline", kind: "toggle" },
    { label: "Undo", kind: "action" },
    { label: "Redo", kind: "action" },
    { label: "Clear formatting", kind: "action" },
  ],
  orientation: "horizontal",
  theme: "light",
  accentColor: "#1d4ed8",
  onText: "{label} on",
  offText: "{label} off",
  doneText: "{label} done",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
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

/** The key as the reader means it (D93): in a right-to-left page, Left goes forward and Right goes back. */
function keyOf(event: { key: string; target: EventTarget | null }) {
  const rtl = event.target instanceof Element && getComputedStyle(event.target).direction === "rtl";
  const swapped: Record<string, string> = { ArrowLeft: "ArrowRight", ArrowRight: "ArrowLeft" };
  return rtl ? (swapped[event.key] ?? event.key) : event.key;
}

/** Words with something put in them: "{count} left" (D94). */
const fill = (words: string, values: Record<string, string | number>) => words.replace(/\{(\w+)\}/g, (match, name) => String(values[name] ?? match));

export function Toolbar({ config = defaultConfig }: { config?: ToolbarConfig }) {
  const items = config.items.filter((item) => item.label.trim() !== "");
  // One stop for the whole toolbar: Tab goes past it, the arrow keys move inside it (APG toolbar).
  const [here, setHere] = useState(0);
  // Pressed state is kept by position, not by label: two items can share a label.
  const [pressed, setPressed] = useState<number[]>([]);
  const [said, setSaid] = useState("");
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--tb-accent": config.accentColor,
    "--tb-accent-text": readableAccent(config.accentColor, dark),
    "--tb-on-accent": luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff",
    "--tb-surface": `var(--bc-${dark ? "dark" : "light"}-surface, ${palette.surface})`,
    "--tb-sunk": `var(--bc-${dark ? "dark" : "light"}-sunk, ${palette.sunk})`,
    "--tb-text": `var(--bc-${dark ? "dark" : "light"}-text, ${palette.text})`,
    "--tb-muted": `var(--bc-${dark ? "dark" : "light"}-muted, ${palette.muted})`,
    "--tb-line": `var(--bc-${dark ? "dark" : "light"}-line, ${palette.line})`,
  } as CSSProperties;

  const vertical = config.orientation === "vertical";

  function go(to: number) {
    const next = (to + items.length) % items.length;
    setHere(next);
    buttons.current[next]?.focus();
  }

  function onKeyDown(event: React.KeyboardEvent) {
    const forward = vertical ? "ArrowDown" : "ArrowRight";
    const back = vertical ? "ArrowUp" : "ArrowLeft";
    if (keyOf(event) === forward) go(here + 1);
    else if (keyOf(event) === back) go(here - 1);
    else if (keyOf(event) === "Home") go(0);
    else if (keyOf(event) === "End") go(items.length - 1);
    else return;
    event.preventDefault();
  }

  function activate(item: { label: string; kind: string }, index: number) {
    if (item.kind === "toggle") {
      const on = !pressed.includes(index);
      setPressed((current) => (on ? [...current, index] : current.filter((entry) => entry !== index)));
      setSaid(fill(on ? config.onText : config.offText, { label: item.label }));
    } else {
      setSaid(fill(config.doneText, { label: item.label }));
    }
  }

  return (
    <div style={style} className="bg-(--tb-surface) text-(--tb-text)">
      <div
        role="toolbar"
        aria-label={config.label}
        aria-orientation={config.orientation}
        onKeyDown={onKeyDown}
        className={`inline-flex gap-1 rounded-[var(--bc-radius-md,0.5rem)] border border-(--tb-line) bg-(--tb-sunk) p-1 ${vertical ? "flex-col" : "flex-row flex-wrap"}`}
      >
        {items.map((item, index) => {
          const toggle = item.kind === "toggle";
          const on = pressed.includes(index);
          return (
            <button
              key={index}
              ref={(node) => {
                buttons.current[index] = node;
              }}
              type="button"
              // Only the current item is tabbable; the rest are reached with the arrow keys.
              tabIndex={index === here ? 0 : -1}
              aria-pressed={toggle ? on : undefined}
              onFocus={() => setHere(index)}
              onClick={() => activate(item, index)}
              className={`min-h-11 cursor-pointer rounded-[var(--bc-radius-sm,0.375rem)] border px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--tb-accent-text) ${
                on ? "border-(--tb-accent) bg-(--tb-accent) text-(--tb-on-accent)" : "border-transparent"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Pressing a button in a toolbar changes something elsewhere: say what happened. */}
      <p role="status" className="mt-2 text-sm text-(--tb-muted)">
        {said}
      </p>
    </div>
  );
}
