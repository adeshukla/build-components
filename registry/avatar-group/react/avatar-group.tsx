"use client";

import { useSyncExternalStore, type CSSProperties } from "react";

export type AvatarGroupConfig = {
  label: string;
  people: { name: string; src: string }[];
  max: number;
  size: "sm" | "md" | "lg";
  overlap: boolean;
  theme: "light" | "dark" | "system";
  moreLabel: string;
};

// @config-start
const defaultConfig: AvatarGroupConfig = {
  label: "On this project",
  people: [
    { name: "Ada Okafor", src: "" },
    { name: "Bruno Lind", src: "" },
    { name: "Cerys Nolan", src: "" },
    { name: "Dara Whitfield", src: "" },
    { name: "Elin Marsh", src: "" },
  ],
  max: 4,
  size: "md",
  overlap: true,
  theme: "light",
  moreLabel: "{count} more: {names}",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", muted: "#4d4a57", ring: "#ffffff" },
  dark: { surface: "#141019", text: "#f6f5fa", muted: "#b6b3c2", ring: "#141019" },
};
const sizes = { sm: "size-7 text-xs", md: "size-9 text-sm", lg: "size-12 text-base" };
/** Tints picked to keep dark text on them above 4.5:1, so initials stay readable. */
const tints = ["#d9e4ff", "#d8f0e0", "#fce4d6", "#e7ddfb", "#fbe3ef", "#d7eef5"];

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

/** The first letter of the first two words: "Ada Okafor" becomes AO. */
function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

/** Same name, same tint, every render: no randomness to break hydration. */
function tintOf(name: string) {
  const sum = [...name].reduce((total, letter) => total + letter.charCodeAt(0), 0);
  return tints[sum % tints.length];
}

const safeSrc = (value: string) => (/^(\/|https?:\/\/)/i.test(value.trim()) ? value.trim() : "");

/** Words with something put in them: "{count} left" (D94). */
const fill = (words: string, values: Record<string, string | number>) => words.replace(/\{(\w+)\}/g, (match, name) => String(values[name] ?? match));

export function AvatarGroup({ config = defaultConfig }: { config?: AvatarGroupConfig }) {
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--ag-surface": `var(--bc-${dark ? "dark" : "light"}-surface, ${palette.surface})`,
    "--ag-text": `var(--bc-${dark ? "dark" : "light"}-text, ${palette.text})`,
    "--ag-muted": `var(--bc-${dark ? "dark" : "light"}-muted, ${palette.muted})`,
    "--ag-ring": palette.ring,
  } as CSSProperties;
  const people = config.people.filter((person) => person.name.trim() !== "");
  const max = Math.max(1, Math.min(8, Math.round(config.max)));
  const shown = people.slice(0, max);
  const rest = people.slice(max);
  const avatar = `grid place-items-center overflow-hidden rounded-full ring-2 ring-(--ag-ring) ${sizes[config.size]}`;

  return (
    <div style={style} className="bg-(--ag-surface) text-(--ag-text)">
      <ul aria-label={config.label} className={`flex items-center ${config.overlap ? "-space-x-2" : "gap-2"}`}>
        {shown.map((person, index) => {
          const src = safeSrc(person.src);
          return (
            <li key={`${person.name}-${index}`} className="relative">
              {src ? (
                // A plain <img>: the exported file has to work outside Next.js too.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt={person.name} className={`${avatar} object-cover`} />
              ) : (
                // The initials are decoration; the name itself is what gets read out.
                <span
                  role="img"
                  aria-label={person.name}
                  style={{ backgroundColor: tintOf(person.name) }}
                  className={`${avatar} font-semibold text-[#16121f]`}
                >
                  <span aria-hidden="true">{initialsOf(person.name)}</span>
                </span>
              )}
            </li>
          );
        })}
        {rest.length > 0 && (
          <li className="relative">
            <span
              role="img"
              aria-label={fill(config.moreLabel, { count: rest.length, names: rest.map((person) => person.name).join(", ") })}
              className={`${avatar} bg-(--ag-surface) font-semibold text-(--ag-muted) ring-1 ring-(--ag-muted)`}
            >
              <span aria-hidden="true">+{rest.length}</span>
            </span>
          </li>
        )}
      </ul>
    </div>
  );
}
