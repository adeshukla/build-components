"use client";

import { useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export type FaqConfig = {
  heading: string;
  intro: string;
  items: { question: string; answer: string }[];
  showToggleAll: boolean;
  openFirst: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: FaqConfig = {
  heading: "Questions",
  intro: "If yours is not here, write to us and we will add it.",
  items: [
    {
      question: "Do I need to install anything?",
      answer: "No. You copy the files into your project, or install them by URL through the registry. There is no package to add and nothing to keep updated.",
    },
    {
      question: "Which Tailwind version does the React output need?",
      answer: "Tailwind v4. The exported file uses v4-only syntax for custom properties, so v3 will not style it correctly.",
    },
    {
      question: "Can I change the code afterwards?",
      answer: "That is the point. Once the files are in your project they are yours: rename things, delete the options you do not use, fold them into your own components.",
    },
    {
      question: "What about dark mode?",
      answer: "Every part has a theme option: light, dark, or following the visitor's device. The dark colours are part of the exported file, not a separate stylesheet.",
    },
  ],
  showToggleAll: true,
  openFirst: false,
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

export function Faq({ config = defaultConfig }: { config?: FaqConfig }) {
  const items = config.items.filter((item) => item.question.trim() !== "");
  const [allOpen, setAllOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--fq-accent": config.accentColor,
    "--fq-accent-text": readableAccent(config.accentColor, dark),
    "--fq-surface": palette.surface,
    "--fq-sunk": palette.sunk,
    "--fq-text": palette.text,
    "--fq-muted": palette.muted,
    "--fq-line": palette.line,
  } as CSSProperties;

  return (
    <div ref={rootRef} style={style} className="bg-(--fq-surface) text-(--fq-text)">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{config.heading}</h2>
          {config.intro.trim() !== "" && <p className="mt-1 text-sm text-(--fq-muted)">{config.intro}</p>}
        </div>
        {config.showToggleAll && items.length > 1 && (
          <button
            type="button"
            aria-pressed={allOpen}
            onClick={() => {
              // The browser owns each answer's open state, so it is set on the elements themselves
              // rather than mirrored in React — nothing to keep in sync, nothing to get wrong.
              const next = !allOpen;
              setAllOpen(next);
              rootRef.current?.querySelectorAll("details").forEach((entry) => {
                entry.open = next;
              });
            }}
            className="min-h-11 cursor-pointer rounded-md border border-(--fq-line) px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--fq-accent-text)"
          >
            {allOpen ? "Close all" : "Open all"}
          </button>
        )}
      </div>

      {/* Native details and summary: open and close, the keyboard, and find-on-page all come free. */}
      <div className="mt-4 divide-y divide-(--fq-line) border-y border-(--fq-line)">
        {items.map((item, index) => (
          <details key={item.question} open={config.openFirst && index === 0} className="group py-1">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 py-2 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--fq-accent-text)">
              {item.question}
              <span
                aria-hidden="true"
                className="shrink-0 text-(--fq-muted) transition-transform group-open:rotate-45 motion-reduce:transition-none"
              >
                +
              </span>
            </summary>
            <p className="max-w-prose pb-3 text-sm text-pretty text-(--fq-muted)">{item.answer}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
