"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export type ReadingProgressConfig = {
  label: string;
  showBar: boolean;
  showContents: boolean;
  contentsTitle: string;
  sections: { title: string }[];
  showDemo: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
  currentLabel: string;
  readText: string;
};

// @config-start
const defaultConfig: ReadingProgressConfig = {
  label: "Reading progress",
  showBar: true,
  showContents: true,
  contentsTitle: "On this page",
  sections: [
    { title: "What this is" },
    { title: "Getting started" },
    { title: "Options" },
    { title: "Accessibility notes" },
  ],
  showDemo: true,
  theme: "light",
  accentColor: "#2563eb",
  currentLabel: "Current section:",
  readText: "{percent}% read",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#d9d5e4" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#3a3448" },
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

const slug = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Words with something put in them: "{count} left" (D94). */
const fill = (words: string, values: Record<string, string | number>) => words.replace(/\{(\w+)\}/g, (match, name) => String(values[name] ?? match));

export function ReadingProgress({ config = defaultConfig }: { config?: ReadingProgressConfig }) {
  const id = useId();
  const sections = config.sections.filter((section) => section.title.trim() !== "");
  const [percent, setPercent] = useState(0);
  const [current, setCurrent] = useState(sections[0] ? slug(sections[0].title) : "");
  const rootRef = useRef<HTMLDivElement>(null);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--rp-accent": config.accentColor,
    "--rp-accent-text": readableAccent(config.accentColor, dark),
    "--rp-surface": `var(--bc-${dark ? "dark" : "light"}-surface, ${palette.surface})`,
    "--rp-sunk": `var(--bc-${dark ? "dark" : "light"}-sunk, ${palette.sunk})`,
    "--rp-text": `var(--bc-${dark ? "dark" : "light"}-text, ${palette.text})`,
    "--rp-muted": `var(--bc-${dark ? "dark" : "light"}-muted, ${palette.muted})`,
    "--rp-line": `var(--bc-${dark ? "dark" : "light"}-line, ${palette.line})`,
  } as CSSProperties;

  // How far down the page, and which heading you are in. Both are read from the page itself, so
  // this works over whatever content you put it with.
  useEffect(() => {
    function onScroll() {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      setPercent(height <= 0 ? 100 : Math.min(100, Math.max(0, Math.round((window.scrollY / height) * 100))));
      const headings = sections
        .map((section) => document.getElementById(slug(section.title)))
        .filter((heading): heading is HTMLElement => heading !== null);
      const passed = headings.filter((heading) => heading.getBoundingClientRect().top <= 120);
      // At the bottom of the page the last heading may still sit below the line, so nothing would
      // ever mark the final section. Once there is no more to scroll, that is the one you are in.
      const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
      const active = (atBottom ? headings[headings.length - 1] : passed[passed.length - 1]) ?? headings[0];
      if (active) setCurrent(active.id);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [sections]);

  return (
    <div ref={rootRef} style={style} className="bg-(--rp-surface) text-(--rp-text)">
      {config.showBar && (
        <div className="fixed inset-x-0 top-0 z-40 h-1 bg-(--rp-sunk)">
          {/* A progress bar the browser describes for us; the number is in its own label. */}
          <div
            role="progressbar"
            aria-label={config.label}
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuetext={fill(config.readText, { percent })}
            style={{ width: `${percent}%` }}
            className="h-full bg-(--rp-accent) transition-[width] duration-150 motion-reduce:transition-none"
          />
        </div>
      )}

      {config.showContents && sections.length > 0 && (
        <nav aria-labelledby={`${id}-contents`} className="rounded-[var(--bc-radius-md,0.5rem)] border border-(--rp-line) p-4">
          <p id={`${id}-contents`} className="font-medium">
            {config.contentsTitle}
          </p>
          <ul className="mt-2 space-y-1">
            {sections.map((section) => {
              const target = slug(section.title);
              const here = current === target;
              return (
                <li key={target}>
                  <a
                    href={`#${target}`}
                    // The heading you are in is marked for everyone, not just by colour.
                    aria-current={here ? "location" : undefined}
                    className={`block rounded-[var(--bc-radius-xs,0.25rem)] py-1 text-sm underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--rp-accent-text) ${here ? "font-semibold text-(--rp-accent-text)" : "text-(--rp-muted)"}`}
                  >
                    {here && <span className="sr-only">{`${config.currentLabel} `}</span>}
                    {section.title}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      )}

      {config.showDemo && (
        // Example page content, so there is something to read past. Delete it in your own page.
        <div data-demo className="mt-6">
          {sections.map((section) => (
            <section key={slug(section.title)}>
              <h2 id={slug(section.title)} className="mt-6 mb-2 text-lg font-semibold">
                {section.title}
              </h2>
              <p className="mb-4 max-w-prose">
                Something to read, so the bar has somewhere to go and the contents list has something to follow. Real pages have paragraphs this long, which is why a section takes most of a screen to get through.
              </p>
              <p className="mb-4 max-w-prose">Another paragraph of the same, to make the section long enough to scroll through. Swap all of this for your own writing: the bar and the contents list read the page, not this text.</p>
              <p className="mb-4 max-w-prose">A third one, so each section takes about a screen and marking the current section is worth doing. Nothing here is needed by the component itself — turn the example sections off once your content is in.</p>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
