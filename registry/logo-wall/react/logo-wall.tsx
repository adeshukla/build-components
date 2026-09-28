"use client";

import { useSyncExternalStore, type CSSProperties } from "react";

export type LogoWallConfig = {
  heading: string;
  headingLevel: "h2" | "h3" | "p";
  items: { name: string; href: string; src: string }[];
  columns: number;
  grayscale: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: LogoWallConfig = {
  heading: "Built with",
  headingLevel: "h2",
  items: [
    { name: "Next.js", href: "", src: "" },
    { name: "React", href: "", src: "" },
    { name: "Tailwind CSS", href: "", src: "" },
    { name: "TypeScript", href: "", src: "" },
    { name: "Playwright", href: "", src: "" },
    { name: "axe", href: "", src: "" },
  ],
  columns: 3,
  grayscale: false,
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

/** Only http(s) and same-site paths are let through: a config value must never become a javascript: URL. */
function safeUrl(value: string) {
  if (value.startsWith("/")) return value;
  try {
    const url = new URL(value, "https://example.com");
    return url.protocol === "http:" || url.protocol === "https:" ? value : "";
  } catch {
    return "";
  }
}

export function LogoWall({ config = defaultConfig }: { config?: LogoWallConfig }) {
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--lw-accent": config.accentColor,
    "--lw-accent-text": readableAccent(config.accentColor, dark),
    "--lw-surface": palette.surface,
    "--lw-sunk": palette.sunk,
    "--lw-text": palette.text,
    "--lw-muted": palette.muted,
    "--lw-line": palette.line,
  } as CSSProperties;

  const Heading = config.headingLevel;

  return (
    <div style={style} className="bg-(--lw-surface) p-1 text-(--lw-text)">
      <Heading
        id="lw-heading"
        className={
          config.headingLevel === "p"
            ? "m-0 font-mono text-xs tracking-wide text-(--lw-muted) uppercase"
            : "m-0 text-xl font-semibold"
        }
      >
        {config.heading}
      </Heading>

      {/*
        A list, so a screen reader counts them. Each entry is the name in words: a wordmark is a picture
        of a name, and the name is what anyone needs.
      */}
      <ul
        aria-labelledby="lw-heading"
        className="mt-4 grid list-none items-center gap-4 p-0"
        style={{ gridTemplateColumns: `repeat(${Math.max(config.columns, 1)}, minmax(0, 1fr))` }}
      >
        {config.items.map((item, index) => {
          const src = safeUrl(item.src);
          const href = safeUrl(item.href);
          // alt is the name, never the word "logo": a screen reader already says "image".
          const mark =
            src === "" ? (
              <span className="font-semibold tracking-tight">{item.name}</span>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- this file is exported for any project, so it must not depend on next/image.
              <img
                src={src}
                alt={item.name}
                loading="lazy"
                decoding="async"
                className={`max-h-8 w-auto ${config.grayscale ? "grayscale contrast-125 hover:grayscale-0" : ""}`}
              />
            );
          return (
            <li
              key={`${item.name}-${index}`}
              className="grid min-h-16 place-items-center rounded-lg border border-(--lw-line) bg-(--lw-sunk) px-3 py-2 text-center"
            >
              {href === "" ? (
                mark
              ) : (
                <a
                  href={href}
                  className="grid min-h-11 place-items-center text-(--lw-text) no-underline hover:underline hover:decoration-(--lw-accent) hover:decoration-2 hover:underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--lw-accent-text)"
                >
                  {mark}
                </a>
              )}
            </li>
          );
        })}
      </ul>

      <p className="mt-4 text-xs text-(--lw-muted)">
        These are the tools this page is built with, which is a claim about us. A &ldquo;trusted by&rdquo;
        wall is a claim about someone else — only put a name there with their permission.
      </p>
    </div>
  );
}
