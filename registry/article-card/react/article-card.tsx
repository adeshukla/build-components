"use client";

import { useSyncExternalStore, type CSSProperties } from "react";

export type ArticleCardConfig = {
  title: string;
  href: string;
  summary: string;
  date: string;
  readingMinutes: number;
  tags: string;
  headingLevel: "h2" | "h3";
  wholeCardClickable: boolean;
  showThumb: boolean;
  thumbAlt: string;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: ArticleCardConfig = {
  title: "Why your focus ring keeps disappearing",
  href: "https://build-components.devstash.me/accessibility",
  summary: "Four ways a focus ring gets lost — overflow, outline:none, a sticky header and a transform — and what to do about each.",
  date: "2026-09-12",
  readingMinutes: 7,
  tags: "Accessibility, CSS",
  headingLevel: "h2",
  wholeCardClickable: true,
  showThumb: true,
  thumbAlt: "",
  theme: "light",
  accentColor: "#7c3aed",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#f1eff7", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#181320", sunk: "#272031", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
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

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Written out by hand: Intl gives the server and the browser different strings. */
export function sayDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return `${day} ${MONTHS[month - 1]} ${year}`;
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

export function ArticleCard({ config = defaultConfig }: { config?: ArticleCardConfig }) {
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--atc-accent": config.accentColor,
    "--atc-accent-text": readableAccent(config.accentColor, dark),
    "--atc-surface": palette.surface,
    "--atc-sunk": palette.sunk,
    "--atc-text": palette.text,
    "--atc-muted": palette.muted,
    "--atc-line": palette.line,
  } as CSSProperties;

  const Heading = config.headingLevel;
  const tags = config.tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  return (
    <div style={style} className="bg-(--atc-surface) p-1 text-(--atc-text)">
      {/*
        One link per card, and it is the heading. A card with a "Read more" as well gives a screen
        reader two links to the same place, one of them called "Read more".
      */}
      <article
        data-card
        className="group relative max-w-lg overflow-hidden rounded-xl border border-(--atc-line) bg-(--atc-surface) has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-(--atc-accent-text)"
      >
        {config.showThumb && (
          // A thumbnail slot, drawn rather than shipped: put your own image here. An empty alt is
          // correct for a decorative one, and a described one needs real words.
          <div
            role={config.thumbAlt.trim() === "" ? undefined : "img"}
            aria-label={config.thumbAlt.trim() === "" ? undefined : config.thumbAlt}
            aria-hidden={config.thumbAlt.trim() === "" ? true : undefined}
            className="aspect-[16/9] w-full bg-(--atc-sunk)"
            style={{
              backgroundImage:
                "repeating-linear-gradient(135deg, color-mix(in oklab, var(--atc-accent) 22%, transparent) 0 14px, transparent 14px 28px)",
            }}
          />
        )}

        <div className="p-4">
          <Heading className="m-0 text-xl leading-snug font-semibold">
            <a
              href={safeHref(config.href)}
              className={`text-(--atc-text) no-underline group-hover:underline group-hover:decoration-(--atc-accent) group-hover:decoration-2 group-hover:underline-offset-4 focus-visible:outline-none ${
                // The overlay makes the whole card clickable without a second link. It costs text
                // selection inside the card, which is why it is an option rather than the only way.
                config.wholeCardClickable ? "after:absolute after:inset-0 after:content-['']" : ""
              }`}
            >
              {config.title}
            </a>
          </Heading>

          <p className="mt-2 text-(--atc-muted)">{config.summary}</p>

          <p className="mt-3 flex flex-wrap items-center gap-x-2 text-sm text-(--atc-muted)">
            <time dateTime={config.date}>{sayDate(config.date)}</time>
            {config.readingMinutes > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span>{`${config.readingMinutes} minute read`}</span>
              </>
            )}
          </p>

          {tags.length > 0 && (
            <ul className="mt-3 flex list-none flex-wrap gap-2 p-0">
              {tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full border border-(--atc-line) px-2.5 py-0.5 text-xs font-medium text-(--atc-muted)"
                >
                  {tag}
                </li>
              ))}
            </ul>
          )}
        </div>
      </article>
    </div>
  );
}
