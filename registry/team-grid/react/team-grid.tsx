"use client";

import { useSyncExternalStore, type CSSProperties } from "react";

export type TeamGridConfig = {
  heading: string;
  intro: string;
  people: { name: string; role: string; href: string }[];
  columns: number;
  showInitials: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: TeamGridConfig = {
  heading: "Who you will be working with",
  intro: "Four of us, one time zone, no account managers.",
  people: [
    { name: "[TODO: name]", role: "Engineering lead", href: "" },
    { name: "[TODO: name]", role: "Designer", href: "" },
    { name: "[TODO: name]", role: "Accessibility specialist", href: "" },
    { name: "[TODO: name]", role: "Support", href: "" },
  ],
  columns: 2,
  showInitials: true,
  theme: "light",
  accentColor: "#0f766e",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#eef0f2", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#141019", sunk: "#272031", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
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

/** First letters of the first two words. A placeholder name gives a question mark rather than junk. */
export function initialsFor(name: string) {
  const words = name.replace(/\[|\]/g, "").split(/\s+/).filter(Boolean);
  const letters = words
    .filter((word) => /^[A-Za-z]/.test(word))
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
  return letters === "" ? "?" : letters;
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

export function TeamGrid({ config = defaultConfig }: { config?: TeamGridConfig }) {
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--tm-accent": config.accentColor,
    "--tm-accent-text": readableAccent(config.accentColor, dark),
    "--tm-surface": palette.surface,
    "--tm-sunk": palette.sunk,
    "--tm-text": palette.text,
    "--tm-muted": palette.muted,
    "--tm-line": palette.line,
  } as CSSProperties;

  return (
    <div style={style} className="bg-(--tm-surface) p-1 text-(--tm-text)">
      <h2 id="tm-heading" className="text-xl font-semibold">
        {config.heading}
      </h2>
      {config.intro.trim() !== "" && <p className="mt-1 max-w-prose text-(--tm-muted)">{config.intro}</p>}

      {/*
        A list of people, not a grid of headings. Four names as h3s would put four entries in the page's
        outline that nobody wants to navigate by.
      */}
      <ul
        aria-labelledby="tm-heading"
        className="mt-5 grid list-none gap-5 p-0"
        style={{ gridTemplateColumns: `repeat(${Math.max(config.columns, 1)}, minmax(0, 1fr))` }}
      >
        {config.people.map((person, index) => (
          <li key={`${person.name}-${index}`} className="flex items-center gap-3">
            {config.showInitials && (
              // Initials, not a photograph: no images ship with this part, and the name is right beside
              // it, so the circle is decoration either way.
              <span
                aria-hidden="true"
                className="grid size-12 shrink-0 place-items-center rounded-full bg-(--tm-sunk) font-semibold text-(--tm-accent-text)"
              >
                {initialsFor(person.name)}
              </span>
            )}
            <div className="min-w-0">
              <p className="m-0 font-semibold">
                {person.href.trim() === "" ? (
                  person.name
                ) : (
                  <a
                    href={safeHref(person.href)}
                    className="text-(--tm-text) underline decoration-(--tm-accent) decoration-2 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--tm-accent-text)"
                  >
                    {person.name}
                  </a>
                )}
              </p>
              {/* The role is the same kind of thing for everyone, so it reads as a pair with the name. */}
              <p className="mt-0.5 text-sm text-(--tm-muted)">{person.role}</p>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-5 text-xs text-(--tm-muted)">
        No names or photographs ship with this part. Put your own in, and ask each person before you do.
      </p>
    </div>
  );
}
