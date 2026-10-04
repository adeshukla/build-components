"use client";

import { useSyncExternalStore, type CSSProperties } from "react";

export type AuthorBylineConfig = {
  name: string;
  nameHref: string;
  role: string;
  date: string;
  updatedDate: string;
  readingMinutes: number;
  initials: string;
  showAvatar: boolean;
  layout: "row" | "stacked";
  theme: "light" | "dark" | "system";
  accentColor: string;
  monthNames: string;
  dateText: string;
  byText: string;
  publishedText: string;
  updatedText: string;
  readText: string;
};

// @config-start
const defaultConfig: AuthorBylineConfig = {
  name: "Adesh Shukla",
  nameHref: "https://devstash.me",
  role: "UI developer",
  date: "2026-09-12",
  updatedDate: "2026-09-24",
  readingMinutes: 7,
  initials: "",
  showAvatar: true,
  layout: "row",
  theme: "light",
  accentColor: "#7c3aed",
  monthNames: "January,February,March,April,May,June,July,August,September,October,November,December",
  dateText: "{day} {month} {year}",
  byText: "By",
  publishedText: "Published",
  updatedText: "Updated",
  readText: "{minutes} minute read",
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

/** Written out by hand from the Words options (D94): Intl gives the server and the browser different strings. */
export function sayDate(iso: string, words: { monthNames: string; dateText: string }) {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return fill(words.dateText, { day, month: words.monthNames.split(",")[month - 1]?.trim() ?? month, year });
}

/** First letters of the first two words, unless the initials are given. */
export function initialsFor(name: string, override: string) {
  if (override.trim() !== "") return override.trim().slice(0, 3).toUpperCase();
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
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

/** Words with something put in them: "{count} left" (D94). */
const fill = (words: string, values: Record<string, string | number>) => words.replace(/\{(\w+)\}/g, (match, name) => String(values[name] ?? match));

export function AuthorByline({ config = defaultConfig }: { config?: AuthorBylineConfig }) {
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--byl-accent": config.accentColor,
    "--byl-accent-text": readableAccent(config.accentColor, dark),
    "--byl-surface": `var(--bc-${dark ? "dark" : "light"}-surface, ${palette.surface})`,
    "--byl-sunk": `var(--bc-${dark ? "dark" : "light"}-sunk, ${palette.sunk})`,
    "--byl-text": `var(--bc-${dark ? "dark" : "light"}-text, ${palette.text})`,
    "--byl-muted": `var(--bc-${dark ? "dark" : "light"}-muted, ${palette.muted})`,
    "--byl-line": `var(--bc-${dark ? "dark" : "light"}-line, ${palette.line})`,
  } as CSSProperties;

  const named = config.nameHref.trim() !== "";

  return (
    <div style={style} className="bg-(--byl-surface) p-1 text-(--byl-text)">
      {/*
        Not an <address> element: that is for the contact details of the nearest article or of the page,
        and a byline on its own is neither. It is a paragraph about who wrote the thing.
      */}
      <div
        data-byline
        className={`flex gap-3 ${config.layout === "stacked" ? "flex-col items-start" : "flex-wrap items-center"}`}
      >
        {config.showAvatar && (
          // Initials, not a photograph: there is no image to ship, and the name is right beside it, so
          // the circle is decoration either way.
          <span
            aria-hidden="true"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-(--byl-sunk) font-semibold text-(--byl-accent-text)"
          >
            {initialsFor(config.name, config.initials)}
          </span>
        )}

        <div>
          <p className="m-0">
            <span className="text-(--byl-muted)">{`${config.byText} `}</span>
            {named ? (
              // rel="author" says what the link is, which is more than "a link with a person's name".
              <a
                href={safeHref(config.nameHref)}
                rel="author"
                className="font-semibold text-(--byl-text) underline decoration-(--byl-accent) decoration-2 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--byl-accent-text)"
              >
                {config.name}
              </a>
            ) : (
              <span className="font-semibold">{config.name}</span>
            )}
            {config.role.trim() !== "" && <span className="text-(--byl-muted)">{`, ${config.role}`}</span>}
          </p>

          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-(--byl-muted)">
            <span>
              {config.publishedText} <time dateTime={config.date}>{sayDate(config.date, config)}</time>
            </span>
            {/* Updated is said as well as published, not instead of it: both are facts people want. */}
            {config.updatedDate.trim() !== "" && (
              <>
                <span aria-hidden="true">·</span>
                <span>
                  {config.updatedText} <time dateTime={config.updatedDate}>{sayDate(config.updatedDate, config)}</time>
                </span>
              </>
            )}
            {config.readingMinutes > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span>{fill(config.readText, { minutes: config.readingMinutes })}</span>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
