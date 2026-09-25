"use client";

import { useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export type FilterBarConfig = {
  label: string;
  filters: { group: string; label: string }[];
  showPills: boolean;
  clearAll: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: FilterBarConfig = {
  label: "Filters",
  filters: [
    { group: "Colour", label: "Blue" },
    { group: "Colour", label: "Green" },
    { group: "Colour", label: "Sand" },
    { group: "Size", label: "Small" },
    { group: "Size", label: "Medium" },
    { group: "Size", label: "Large" },
    { group: "In stock", label: "Ready to ship" },
  ],
  showPills: true,
  clearAll: true,
  theme: "light",
  accentColor: "#0f766e",
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

const key = (filter: { group: string; label: string }) => `${filter.group}: ${filter.label}`;

export function FilterBar({ config = defaultConfig }: { config?: FilterBarConfig }) {
  const filters = config.filters.filter((filter) => filter.label.trim() !== "");
  const [on, setOn] = useState<string[]>([]);
  const chips = useRef(new Map<string, HTMLButtonElement | null>());
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--fb-accent": config.accentColor,
    "--fb-accent-text": readableAccent(config.accentColor, dark),
    "--fb-on-accent": luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff",
    "--fb-surface": palette.surface,
    "--fb-sunk": palette.sunk,
    "--fb-text": palette.text,
    "--fb-muted": palette.muted,
    "--fb-line": palette.line,
  } as CSSProperties;

  const groups = [...new Set(filters.map((filter) => filter.group))];
  const active = filters.filter((filter) => on.includes(key(filter)));

  function toggle(filter: { group: string; label: string }) {
    const id = key(filter);
    setOn((current) => (current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]));
  }

  // Removing a pill takes its own button away, so focus goes back to the chip it came from.
  function remove(filter: { group: string; label: string }) {
    setOn((current) => current.filter((entry) => entry !== key(filter)));
    chips.current.get(key(filter))?.focus();
  }

  const summary =
    active.length === 0
      ? "No filters applied"
      : `${active.length} filter${active.length === 1 ? "" : "s"} applied: ${active.map((filter) => filter.label).join(", ")}`;

  return (
    <div style={style} className="bg-(--fb-surface) text-(--fb-text)">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-medium">{config.label}</p>
        {config.clearAll && active.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setOn([]);
              // This button goes away once nothing is on, so hand focus to the first chip.
              chips.current.values().next().value?.focus();
            }}
            className="min-h-11 cursor-pointer rounded px-2 text-sm text-(--fb-accent-text) underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--fb-accent-text)"
          >
            Clear all
          </button>
        )}
      </div>

      {groups.map((group) => (
        <div key={group} role="group" aria-label={group} className="mt-3">
          <p className="text-sm text-(--fb-muted)">{group}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {filters
              .filter((filter) => filter.group === group)
              .map((filter) => {
                const id = key(filter);
                const picked = on.includes(id);
                return (
                  <button
                    key={id}
                    ref={(node) => {
                      chips.current.set(id, node);
                    }}
                    type="button"
                    // aria-pressed is what makes a styled button a real toggle to a screen reader.
                    aria-pressed={picked}
                    onClick={() => toggle(filter)}
                    className={`min-h-11 cursor-pointer rounded-full border px-4 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--fb-accent-text) ${
                      picked
                        ? "border-(--fb-accent) bg-(--fb-accent) text-(--fb-on-accent)"
                        : "border-(--fb-line) bg-(--fb-sunk) text-(--fb-text)"
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
          </div>
        </div>
      ))}

      {config.showPills && active.length > 0 && (
        <ul aria-label="Applied filters" className="mt-4 flex list-none flex-wrap gap-2 p-0">
          {active.map((filter) => (
            <li
              key={key(filter)}
              className="inline-flex items-center gap-1 rounded-full border border-(--fb-line) bg-(--fb-sunk) py-1 pr-1 pl-3 text-sm"
            >
              <span>{filter.label}</span>
              <button
                type="button"
                onClick={() => remove(filter)}
                className="inline-flex size-6 cursor-pointer items-center justify-center rounded-full text-(--fb-muted) hover:text-(--fb-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--fb-accent-text)"
              >
                <span className="sr-only">{`Remove filter ${key(filter)}`}</span>
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* What changed, said once, for people who cannot see the chips light up. */}
      <p role="status" className="mt-3 text-sm text-(--fb-muted)">
        {summary}
      </p>
    </div>
  );
}
