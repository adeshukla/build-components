"use client";

import { useEffect, useId, useState, useSyncExternalStore, type CSSProperties } from "react";

export type AnchorNavConfig = {
  heading: string;
  sections: { label: string; target: string; body: string }[];
  sticky: boolean;
  markCurrent: boolean;
  smoothScroll: boolean;
  numbered: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: AnchorNavConfig = {
  heading: "On this page",
  sections: [
    { label: "What it does", target: "what", body: "A table of contents for one page, marking whichever section you are reading." },
    { label: "Installing it", target: "install", body: "Copy the file, or install it by URL. There is no package behind it." },
    { label: "Options", target: "options", body: "Every option is in the panel beside this preview, and in the URL." },
    { label: "Accessibility notes", target: "notes", body: "What was decided and why, in the checklist under the bench." },
  ],
  sticky: true,
  markCurrent: true,
  smoothScroll: true,
  numbered: false,
  theme: "light",
  accentColor: "#7c3aed",
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

export function AnchorNav({ config = defaultConfig }: { config?: AnchorNavConfig }) {
  const id = useId();
  const [current, setCurrent] = useState(config.sections[0]?.target ?? "");
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--an-accent": config.accentColor,
    "--an-accent-text": readableAccent(config.accentColor, dark),
    "--an-surface": palette.surface,
    "--an-sunk": palette.sunk,
    "--an-text": palette.text,
    "--an-muted": palette.muted,
    "--an-line": palette.line,
  } as CSSProperties;

  const targets = config.sections.map((section) => section.target).join("|");

  useEffect(() => {
    if (!config.markCurrent) return;
    const list = targets.split("|").filter(Boolean);
    const nodes = list.map((target) => document.getElementById(`${id}-${target}`)).filter((node) => node !== null);
    if (nodes.length === 0) return;
    const seen = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) seen.add(entry.target.id);
          else seen.delete(entry.target.id);
        }
        // The topmost heading still on screen is the one being read; if none is, keep the last answer.
        const first = nodes.find((node) => seen.has(node.id));
        if (first !== undefined) setCurrent(first.id.slice(`${id}-`.length));
      },
      { rootMargin: "0px 0px -60% 0px" },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [id, targets, config.markCurrent]);

  return (
    <div style={style} className="bg-(--an-surface) text-(--an-text)">
      <div className="grid gap-8 md:grid-cols-[14rem_1fr]">
        <nav aria-labelledby={`${id}-heading`} className={config.sticky ? "self-start md:sticky md:top-4" : "self-start"}>
          <h2 id={`${id}-heading`} className="font-mono text-xs tracking-wide text-(--an-muted) uppercase">
            {config.heading}
          </h2>
          <ol className="mt-2 list-none border-l border-(--an-line) p-0">
            {config.sections.map((section, index) => {
              const here = config.markCurrent && current === section.target;
              return (
                <li key={section.target}>
                  <a
                    href={`#${id}-${section.target}`}
                    // aria-current=true, not "page": the page has not changed, only the part of it being read.
                    aria-current={here ? true : undefined}
                    onClick={(event) => {
                      event.preventDefault();
                      const node = document.getElementById(`${id}-${section.target}`);
                      if (node === null) return;
                      node.focus();
                      node.scrollIntoView({ block: "start", behavior: config.smoothScroll ? "smooth" : "auto" });
                    }}
                    className={`-ml-px block min-h-11 border-l-2 py-2.5 pl-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--an-accent-text) ${
                      here
                        ? "border-(--an-accent) font-semibold text-(--an-accent-text)"
                        : "border-transparent text-(--an-muted) hover:text-(--an-text)"
                    }`}
                  >
                    {config.numbered && <span className="mr-2 font-mono text-xs">{index + 1}.</span>}
                    {section.label}
                  </a>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* The page the nav is about. In your own page these are the sections you already have. */}
        <div className="grid gap-10">
          {config.sections.map((section) => (
            <section key={section.target} aria-labelledby={`${id}-${section.target}`}>
              <h2
                id={`${id}-${section.target}`}
                tabIndex={-1}
                className="text-xl font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--an-accent-text)"
              >
                {section.label}
              </h2>
              <p className="mt-2 text-(--an-muted)">{section.body}</p>
              <div aria-hidden="true" className="mt-4 h-24 rounded-md bg-(--an-sunk)" />
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
