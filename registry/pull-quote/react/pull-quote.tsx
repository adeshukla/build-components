"use client";

import { useSyncExternalStore, type CSSProperties } from "react";

export type PullQuoteConfig = {
  quote: string;
  attribution: string;
  source: string;
  sourceHref: string;
  showMarks: boolean;
  align: "left" | "centre";
  size: "large" | "huge";
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: PullQuoteConfig = {
  quote: "The first thing a screen reader tells you about a button is its name. Almost nothing else about it matters as much.",
  attribution: "Léonie Watson",
  source: "Accessibility, from the ground up",
  sourceHref: "",
  showMarks: true,
  align: "left",
  size: "large",
  theme: "light",
  accentColor: "#7c3aed",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#f1eff7", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#141019", sunk: "#272031", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
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

/** Only http(s) links are let through: a config value must never become a javascript: URL. */
function safeHref(href: string) {
  try {
    const url = new URL(href, "https://example.com");
    return url.protocol === "http:" || url.protocol === "https:" ? href : "#";
  } catch {
    return "#";
  }
}

export function PullQuote({ config = defaultConfig }: { config?: PullQuoteConfig }) {
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--pq-accent": config.accentColor,
    "--pq-accent-text": readableAccent(config.accentColor, dark),
    "--pq-surface": `var(--bc-${dark ? "dark" : "light"}-surface, ${palette.surface})`,
    "--pq-sunk": `var(--bc-${dark ? "dark" : "light"}-sunk, ${palette.sunk})`,
    "--pq-text": `var(--bc-${dark ? "dark" : "light"}-text, ${palette.text})`,
    "--pq-muted": `var(--bc-${dark ? "dark" : "light"}-muted, ${palette.muted})`,
    "--pq-line": `var(--bc-${dark ? "dark" : "light"}-line, ${palette.line})`,
  } as CSSProperties;

  const linked = config.sourceHref.trim() !== "" && config.source.trim() !== "";

  return (
    <div style={style} className="bg-(--pq-surface) p-1 text-(--pq-text)">
      {/*
        A figure with the quotation in a blockquote and the attribution in a figcaption. The attribution
        does not go inside the blockquote: that would make it part of what was said.
      */}
      <figure
        data-quote
        className={`m-0 max-w-2xl ${config.align === "centre" ? "text-center" : "border-s-4 border-(--pq-accent) ps-5"}`}
      >
        <blockquote
          // cite is the URL the words came from, which is not the same thing as the visible source line.
          cite={linked ? safeHref(config.sourceHref) : undefined}
          className={`m-0 font-medium text-balance ${config.size === "huge" ? "text-3xl leading-tight sm:text-4xl" : "text-2xl leading-snug"}`}
        >
          {config.showMarks && (
            // The marks are decoration: a screen reader already says "quote" for a blockquote, and
            // reading a stray left double quotation mark is noise.
            <span aria-hidden="true" className="me-1 text-(--pq-accent-text)">
              &ldquo;
            </span>
          )}
          <span>{config.quote}</span>
          {config.showMarks && (
            <span aria-hidden="true" className="ms-1 text-(--pq-accent-text)">
              &rdquo;
            </span>
          )}
        </blockquote>

        {(config.attribution.trim() !== "" || config.source.trim() !== "") && (
          <figcaption className="mt-4 text-sm text-(--pq-muted)">
            {config.attribution.trim() !== "" && <span className="font-semibold text-(--pq-text)">{config.attribution}</span>}
            {config.source.trim() !== "" && (
              <>
                {config.attribution.trim() !== "" && <span>, </span>}
                {/* cite is for the work, not the person: the title goes in it, the name does not. */}
                <cite className="italic">
                  {linked ? (
                    <a
                      href={safeHref(config.sourceHref)}
                      className="text-(--pq-accent-text) underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--pq-accent-text)"
                    >
                      {config.source}
                    </a>
                  ) : (
                    config.source
                  )}
                </cite>
              </>
            )}
          </figcaption>
        )}
      </figure>
    </div>
  );
}
