"use client";

import { useSyncExternalStore, type CSSProperties } from "react";

export type SkipLinksConfig = {
  links: { label: string; target: string }[];
  alwaysVisible: boolean;
  position: "top-left" | "top-centre";
  demoHeading: string;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: SkipLinksConfig = {
  links: [
    { label: "Skip to main content", target: "main-content" },
    { label: "Skip to navigation", target: "site-nav" },
    { label: "Skip to search", target: "site-search" },
  ],
  alwaysVisible: false,
  position: "top-left",
  demoHeading: "What the links skip to",
  theme: "light",
  accentColor: "#1d4ed8",
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

export function SkipLinks({ config = defaultConfig }: { config?: SkipLinksConfig }) {
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--sk-accent": config.accentColor,
    "--sk-accent-text": readableAccent(config.accentColor, dark),
    "--sk-on-accent": luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff",
    "--sk-surface": `var(--bc-${dark ? "dark" : "light"}-surface, ${palette.surface})`,
    "--sk-sunk": `var(--bc-${dark ? "dark" : "light"}-sunk, ${palette.sunk})`,
    "--sk-text": `var(--bc-${dark ? "dark" : "light"}-text, ${palette.text})`,
    "--sk-muted": `var(--bc-${dark ? "dark" : "light"}-muted, ${palette.muted})`,
    "--sk-line": `var(--bc-${dark ? "dark" : "light"}-line, ${palette.line})`,
  } as CSSProperties;

  // Hidden by size rather than by display:none or visibility:hidden, because both of those take the
  // link out of the tab order — which is the one thing a skip link has to be in.
  // Padding and a min-height would keep a "1px" link 32px wide and 44px tall, so both wait for focus.
  const sizing = config.alwaysVisible
    ? "min-h-11 px-4"
    : "absolute h-px w-px overflow-hidden whitespace-nowrap [clip-path:inset(50%)] focus:static focus:h-auto focus:min-h-11 focus:w-auto focus:overflow-visible focus:px-4 focus:whitespace-normal focus:[clip-path:none]";

  return (
    <div style={style} className="bg-(--sk-surface) text-(--sk-text)">
      <nav
        aria-label="Skip links"
        className={`flex gap-2 ${config.position === "top-centre" ? "justify-center" : ""} ${config.alwaysVisible ? "flex-wrap border-b border-(--sk-line) p-2" : ""}`}
      >
        {config.links.map((link) => (
          <a
            key={link.target}
            href={`#${link.target}`}
            onClick={(event) => {
              event.preventDefault();
              const target = document.getElementById(link.target);
              if (target === null) return;
              // Focus, not just scroll: a link that only scrolls leaves the keyboard where it was, so the
              // next Tab goes back into the header it just skipped.
              target.focus();
              target.scrollIntoView({ block: "start" });
            }}
            className={`${sizing} z-50 inline-flex items-center rounded-[var(--bc-radius-button,0.375rem)] bg-(--sk-accent) font-medium text-(--sk-on-accent) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--sk-accent-text)`}
          >
            {link.label}
          </a>
        ))}
      </nav>

      {/* The demo page the links skip into. In your own page these are the landmarks you already have. */}
      <div className="p-4">
        <h2 className="font-medium">{config.demoHeading}</h2>
        <p className="mt-1 text-sm text-(--sk-muted)">
          Press Tab from the very top of the page. Each target takes focus, so the next Tab carries on from there.
        </p>
        <div className="mt-4 grid gap-3">
          {config.links.map((link) => (
            <section
              key={link.target}
              id={link.target}
              tabIndex={-1}
              aria-label={link.label.replace(/^Skip to /i, "")}
              className="rounded-[var(--bc-radius-sm,0.375rem)] border border-(--sk-line) bg-(--sk-sunk) p-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--sk-accent-text)"
            >
              <p className="font-mono text-xs text-(--sk-muted)">#{link.target}</p>
              <p className="mt-1">{link.label.replace(/^Skip to /i, "Landing here skips to ")}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
