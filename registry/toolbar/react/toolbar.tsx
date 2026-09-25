"use client";

import { useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export type ToolbarConfig = {
  label: string;
  items: { label: string; kind: string }[];
  orientation: "horizontal" | "vertical";
  theme: "light" | "dark" | "system";
  accentColor: string;
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
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
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

export function Toolbar({ config = defaultConfig }: { config?: ToolbarConfig }) {
  const items = config.items.filter((item) => item.label.trim() !== "");
  // One stop for the whole toolbar: Tab goes past it, the arrow keys move inside it (APG toolbar).
  const [here, setHere] = useState(0);
  const [pressed, setPressed] = useState<string[]>([]);
  const [said, setSaid] = useState("");
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--tb-accent": config.accentColor,
    "--tb-accent-text": readableAccent(config.accentColor, dark),
    "--tb-on-accent": luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff",
    "--tb-surface": palette.surface,
    "--tb-sunk": palette.sunk,
    "--tb-text": palette.text,
    "--tb-muted": palette.muted,
    "--tb-line": palette.line,
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
    if (event.key === forward) go(here + 1);
    else if (event.key === back) go(here - 1);
    else if (event.key === "Home") go(0);
    else if (event.key === "End") go(items.length - 1);
    else return;
    event.preventDefault();
  }

  function activate(item: { label: string; kind: string }) {
    if (item.kind === "toggle") {
      const on = !pressed.includes(item.label);
      setPressed((current) => (on ? [...current, item.label] : current.filter((entry) => entry !== item.label)));
      setSaid(`${item.label} ${on ? "on" : "off"}`);
    } else {
      setSaid(`${item.label} done`);
    }
  }

  return (
    <div style={style} className="bg-(--tb-surface) text-(--tb-text)">
      <div
        role="toolbar"
        aria-label={config.label}
        aria-orientation={config.orientation}
        onKeyDown={onKeyDown}
        className={`inline-flex gap-1 rounded-lg border border-(--tb-line) bg-(--tb-sunk) p-1 ${vertical ? "flex-col" : "flex-row flex-wrap"}`}
      >
        {items.map((item, index) => {
          const toggle = item.kind === "toggle";
          const on = pressed.includes(item.label);
          return (
            <button
              key={item.label}
              ref={(node) => {
                buttons.current[index] = node;
              }}
              type="button"
              // Only the current item is tabbable; the rest are reached with the arrow keys.
              tabIndex={index === here ? 0 : -1}
              aria-pressed={toggle ? on : undefined}
              onFocus={() => setHere(index)}
              onClick={() => activate(item)}
              className={`min-h-11 cursor-pointer rounded-md border px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--tb-accent-text) ${
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
