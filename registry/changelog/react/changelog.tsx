"use client";

import { useSyncExternalStore, type CSSProperties } from "react";

export type ChangelogConfig = {
  heading: string;
  headingLevel: "h2" | "h3";
  entries: { version: string; date: string; kind: string; text: string }[];
  latestLabel: string;
  showLatest: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: ChangelogConfig = {
  heading: "What changed",
  headingLevel: "h2",
  entries: [
    { version: "2.4.0", date: "2026-09-18", kind: "Added", text: "Keyboard shortcuts for every board action." },
    { version: "2.4.0", date: "2026-09-18", kind: "Added", text: "Export a board as CSV." },
    { version: "2.4.0", date: "2026-09-18", kind: "Fixed", text: "Dragging a card in Safari dropped it one place short." },
    { version: "2.3.1", date: "2026-08-30", kind: "Fixed", text: "The invite email linked to the old sign-in page." },
    { version: "2.3.0", date: "2026-08-12", kind: "Changed", text: "Comments now load oldest first." },
    { version: "2.3.0", date: "2026-08-12", kind: "Removed", text: "The legacy CSV importer, replaced in 2.1." },
  ],
  latestLabel: "Latest",
  showLatest: true,
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

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Written out by hand: Intl gives the server and the browser different strings. */
export function sayDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

/** Runs of entries with the same version become one release, in the order they are listed. */
export function toReleases(entries: ChangelogConfig["entries"]) {
  const releases: { version: string; date: string; kinds: { kind: string; items: string[] }[] }[] = [];
  for (const entry of entries) {
    let release = releases[releases.length - 1];
    if (release === undefined || release.version !== entry.version) {
      release = { version: entry.version, date: entry.date, kinds: [] };
      releases.push(release);
    }
    const group = release.kinds.find((one) => one.kind === entry.kind);
    if (group === undefined) release.kinds.push({ kind: entry.kind, items: [entry.text] });
    else group.items.push(entry.text);
  }
  return releases;
}

export function Changelog({ config = defaultConfig }: { config?: ChangelogConfig }) {
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--chg-accent": config.accentColor,
    "--chg-accent-text": readableAccent(config.accentColor, dark),
    "--chg-on-accent": luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff",
    "--chg-surface": palette.surface,
    "--chg-sunk": palette.sunk,
    "--chg-text": palette.text,
    "--chg-muted": palette.muted,
    "--chg-line": palette.line,
  } as CSSProperties;

  const releases = toReleases(config.entries);
  const Heading = config.headingLevel;
  const Sub = config.headingLevel === "h2" ? "h3" : "h4";

  return (
    <div style={style} className="bg-(--chg-surface) p-1 text-(--chg-text)">
      <Heading className="text-2xl font-semibold">{config.heading}</Heading>

      {/* An ordered list of releases, newest first, so the order is in the markup and not just the layout. */}
      <ol className="mt-5 list-none p-0">
        {releases.map((release, index) => (
          <li key={release.version} className="border-t border-(--chg-line) py-5 first:border-t-0 first:pt-0">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <Sub className="m-0 font-mono text-lg font-semibold">{release.version}</Sub>
              {/* A real time element, written out in full: 2026-09-18 is not a date most people read. */}
              <time dateTime={release.date} className="text-sm text-(--chg-muted)">
                {sayDate(release.date)}
              </time>
              {config.showLatest && index === 0 && (
                <span className="rounded-full bg-(--chg-accent) px-2 py-0.5 text-xs font-semibold text-(--chg-on-accent)">
                  {config.latestLabel}
                </span>
              )}
            </div>

            {release.kinds.map((group) => (
              <div key={group.kind} className="mt-3">
                {/*
                  The kind is a word, not a coloured dot. A legend of colours is no use to anyone who
                  cannot tell them apart, and none at all to a screen reader.
                */}
                <p className="font-mono text-xs tracking-wide text-(--chg-muted) uppercase">{group.kind}</p>
                <ul className="mt-1 list-disc pl-5">
                  {group.items.map((text) => (
                    <li key={text} className="mt-1">
                      {text}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </li>
        ))}
      </ol>
    </div>
  );
}
