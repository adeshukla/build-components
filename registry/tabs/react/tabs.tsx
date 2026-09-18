"use client";

import { useRef, useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent } from "react";

export type TabsConfig = {
  label: string;
  items: { label: string; content: string }[];
  activation: "automatic" | "manual";
  orientation: "horizontal" | "vertical";
  stretch: boolean;
  panelBox: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
  radius: number;
  look: "underline" | "pill";
  size: "sm" | "md";
};

// @config-start
const defaultConfig: TabsConfig = {
  label: "Plan details",
  items: [
    { label: "Overview", content: "Everything a small team needs to ship: unlimited projects, 10 GB of storage and email support within one working day." },
    { label: "Pricing", content: "£12 per person per month, billed yearly. No setup fee, and you can cancel whenever you like." },
    { label: "Support", content: "Email support on working days, plus a shared channel once you pass twenty seats." },
  ],
  activation: "automatic",
  orientation: "horizontal",
  stretch: false,
  panelBox: true,
  theme: "light",
  accentColor: "#2563eb",
  radius: 8,
  look: "underline",
  size: "md",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", muted: "#4d4a57", line: "#d9d5e4", hover: "#f4f3f8" },
  dark: { surface: "#141019", text: "#f6f5fa", muted: "#b6b3c2", line: "#3a3448", hover: "#221d2e" },
};

const darkMedia = {
  subscribe: (onChange: () => void) => {
    const list = window.matchMedia("(prefers-color-scheme: dark)");
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  },
  get: () => window.matchMedia("(prefers-color-scheme: dark)").matches,
};

// WCAG relative luminance, used to keep text on the accent readable.
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

export function Tabs({ config = defaultConfig }: { config?: TabsConfig }) {
  const items = config.items.filter((item) => item.label.trim() !== "");
  const [selected, setSelected] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const vertical = config.orientation === "vertical";
  const accentLuminance = luminance(config.accentColor);
  const current = Math.min(selected, Math.max(0, items.length - 1));

  const style = {
    "--tb-accent": config.accentColor,
    "--tb-accent-text": readableAccent(config.accentColor, dark),
    "--tb-on-accent": accentLuminance > 0.179 ? "#000000" : "#ffffff",
    "--tb-radius": `${config.radius}px`,
    "--tb-surface": palette.surface,
    "--tb-text": palette.text,
    "--tb-muted": palette.muted,
    "--tb-line": palette.line,
    "--tb-hover": palette.hover,
  } as CSSProperties;

  function focusTab(index: number) {
    tabRefs.current[index]?.focus();
    if (config.activation === "automatic") setSelected(index);
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const previous = vertical ? "ArrowUp" : "ArrowLeft";
    const next = vertical ? "ArrowDown" : "ArrowRight";
    const moves: Record<string, number> = {
      [previous]: (index - 1 + items.length) % items.length,
      [next]: (index + 1) % items.length,
      Home: 0,
      End: items.length - 1,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    focusTab(moves[event.key]);
  }

  if (items.length === 0) return null;

  return (
    <div
      style={style}
      className={`bg-(--tb-surface) text-(--tb-text) ${config.size === "sm" ? "text-sm" : "text-base"} ${vertical ? "flex flex-col gap-4 sm:flex-row" : ""}`}
    >
      <div
        role="tablist"
        aria-label={config.label}
        aria-orientation={vertical ? "vertical" : undefined}
        className={
          vertical
            ? "flex shrink-0 flex-col gap-1 sm:w-48"
            : `flex gap-1 overflow-x-auto ${config.look === "underline" ? "border-b border-(--tb-line)" : ""} ${config.stretch ? "" : "justify-start"}`
        }
      >
        {items.map((item, index) => {
          const active = index === current;
          const pill = config.look === "pill";
          return (
            <button
              key={index}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`tabs-tab-${index}`}
              aria-selected={active}
              aria-controls={`tabs-panel-${index}`}
              tabIndex={active ? 0 : -1}
              onClick={() => setSelected(index)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={`cursor-pointer whitespace-nowrap px-4 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--tb-accent-text) ${
                config.size === "sm" ? "py-2" : "py-3"
              } ${config.stretch && !vertical ? "flex-1" : ""} ${vertical ? "text-left" : ""} ${
                pill
                  ? `rounded-(--tb-radius) ${active ? "bg-(--tb-accent) text-(--tb-on-accent)" : "text-(--tb-muted) hover:bg-(--tb-hover)"}`
                  : vertical
                    ? `border-l-2 ${active ? "border-(--tb-accent) text-(--tb-accent-text)" : "border-(--tb-line) text-(--tb-muted) hover:bg-(--tb-hover)"}`
                    : `-mb-px border-b-2 ${active ? "border-(--tb-accent) text-(--tb-accent-text)" : "border-transparent text-(--tb-muted) hover:bg-(--tb-hover)"}`
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {items.map((item, index) => (
        <div
          key={index}
          role="tabpanel"
          id={`tabs-panel-${index}`}
          aria-labelledby={`tabs-tab-${index}`}
          // The panel takes focus itself, because its content may hold nothing focusable.
          tabIndex={0}
          hidden={index !== current}
          className={`min-w-0 flex-1 text-pretty focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--tb-accent-text) ${
            config.panelBox
              ? `rounded-(--tb-radius) border border-(--tb-line) p-5 ${vertical ? "" : "mt-4"}`
              : `${vertical ? "" : "mt-4"}`
          }`}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
