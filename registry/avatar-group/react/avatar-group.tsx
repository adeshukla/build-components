"use client";

import { useSyncExternalStore, type CSSProperties } from "react";

export type AvatarGroupConfig = {
  label: string;
  people: { name: string; src: string }[];
  max: number;
  size: "sm" | "md" | "lg";
  overlap: boolean;
  theme: "light" | "dark" | "system";
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
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", muted: "#4d4a57", ring: "#ffffff" },
  dark: { surface: "#141019", text: "#f6f5fa", muted: "#b6b3c2", ring: "#141019" },
};
const sizes = { sm: "size-7 text-xs", md: "size-9 text-sm", lg: "size-12 text-base" };
/** Tints picked to keep dark text on them above 4.5:1, so initials stay readable. */
const tints = ["#d9e4ff", "#d8f0e0", "#fce4d6", "#e7ddfb", "#fbe3ef", "#d7eef5"];

const darkMedia = {
  subscribe: (onChange: () => void) => {
    const list = window.matchMedia("(prefers-color-scheme: dark)");
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  },
  get: () => window.matchMedia("(prefers-color-scheme: dark)").matches,
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

export function AvatarGroup({ config = defaultConfig }: { config?: AvatarGroupConfig }) {
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--ag-surface": palette.surface,
    "--ag-text": palette.text,
    "--ag-muted": palette.muted,
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
              aria-label={`${rest.length} more: ${rest.map((person) => person.name).join(", ")}`}
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
