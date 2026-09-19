"use client";

import { useState, useSyncExternalStore, type CSSProperties } from "react";

export type AccordionItem = { title: string; content: string };

export type AccordionConfig = {
  items: AccordionItem[];
  headingLevel: "h2" | "h3" | "h4";
  allowMultiple: boolean;
  openFirst: boolean;
  icon: "chevron" | "plus";
  look: "bordered" | "separated" | "plain";
  theme: "light" | "dark" | "system";
  accentColor: string;
  radius: number;
};

// @config-start
const defaultConfig: AccordionConfig = {
  items: [
    { title: "How do I install a part?", content: "Copy the file, or run the one install command shown under the editor. Either way the code lands in your project and belongs to you." },
    { title: "Do I need a library?", content: "No. Every part is plain React and Tailwind, or plain HTML, CSS and JavaScript. Nothing is installed at runtime." },
    { title: "Can I change it later?", content: "Yes. The options you set are a plain object at the top of the file, so you can edit them by hand whenever you like." },
  ],
  headingLevel: "h3",
  allowMultiple: false,
  openFirst: true,
  icon: "chevron",
  look: "bordered",
  theme: "light",
  accentColor: "#2563eb",
  radius: 10,
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#d9d5e4" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#3a3448" },
};

const darkMedia = {
  subscribe: (onChange: () => void) => {
    const list = window.matchMedia("(prefers-color-scheme: dark)");
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  },
  get: () => window.matchMedia("(prefers-color-scheme: dark)").matches,
};

// WCAG relative luminance, used to keep the accent readable as text.
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

export function Accordion({ config = defaultConfig }: { config?: AccordionConfig }) {
  const items = config.items.filter((item) => item.title.trim() !== "");
  const [open, setOpen] = useState<number[]>(config.openFirst && items.length > 0 ? [0] : []);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const Heading = config.headingLevel;

  function toggle(index: number) {
    const isOpen = open.includes(index);
    if (config.allowMultiple) setOpen(isOpen ? open.filter((entry) => entry !== index) : [...open, index]);
    else setOpen(isOpen ? [] : [index]);
  }

  const style = {
    "--ac-accent": config.accentColor,
    "--ac-accent-text": readableAccent(config.accentColor, dark),
    "--ac-radius": `${config.radius}px`,
    "--ac-surface": palette.surface,
    "--ac-sunk": palette.sunk,
    "--ac-text": palette.text,
    "--ac-muted": palette.muted,
    "--ac-line": palette.line,
  } as CSSProperties;

  if (items.length === 0) return null;

  return (
    <div
      style={style}
      className={`bg-(--ac-surface) text-(--ac-text) ${
        config.look === "bordered" ? "divide-y divide-(--ac-line) rounded-(--ac-radius) border border-(--ac-line)" : ""
      } ${config.look === "separated" ? "flex flex-col gap-3" : ""} ${
        config.look === "plain" ? "divide-y divide-(--ac-line)" : ""
      }`}
    >
      {items.map((item, index) => {
        const expanded = open.includes(index);
        return (
          <div
            key={index}
            className={config.look === "separated" ? "rounded-(--ac-radius) border border-(--ac-line)" : ""}
          >
            <Heading className="m-0">
              <button
                type="button"
                id={`accordion-button-${index}`}
                aria-expanded={expanded}
                aria-controls={`accordion-panel-${index}`}
                onClick={() => toggle(index)}
                className="flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-4 text-left text-base font-medium hover:bg-(--ac-sunk) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--ac-accent-text)"
              >
                {item.title}
                <span
                  aria-hidden="true"
                  className={`grid size-6 shrink-0 place-items-center rounded-full text-(--ac-accent-text) transition-transform duration-200 ease-out motion-reduce:transition-none ${
                    expanded && config.icon === "chevron" ? "rotate-180" : ""
                  } ${expanded && config.icon === "plus" ? "rotate-45" : ""}`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-5">
                    {config.icon === "chevron" ? <path d="m6 9 6 6 6-6" /> : <path d="M12 5v14M5 12h14" />}
                  </svg>
                </span>
              </button>
            </Heading>
            <div
              id={`accordion-panel-${index}`}
              role="region"
              aria-labelledby={`accordion-button-${index}`}
              hidden={!expanded}
              className="px-4 pb-4 text-pretty text-(--ac-muted)"
            >
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
