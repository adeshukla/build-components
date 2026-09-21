"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent } from "react";

export type MultiSelectConfig = {
  label: string;
  hint: string;
  placeholder: string;
  options: { label: string }[];
  maxSelected: number;
  filter: "contains" | "startsWith";
  clearAll: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
  radius: number;
};

// @config-start
const defaultConfig: MultiSelectConfig = {
  label: "Skills",
  hint: "Type to narrow the list. Pick as many as apply.",
  placeholder: "Search skills",
  options: [
    { label: "Accessibility" },
    { label: "Animation" },
    { label: "Design systems" },
    { label: "Performance" },
    { label: "Prototyping" },
    { label: "Research" },
    { label: "Testing" },
    { label: "Typography" },
  ],
  maxSelected: 0,
  filter: "contains",
  clearAll: true,
  theme: "light",
  accentColor: "#2563eb",
  radius: 10,
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#8d8a99", hover: "#f0eff6" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#8d8a99", hover: "#2a2438" },
};

const darkMedia = {
  subscribe: (onChange: () => void) => {
    const list = window.matchMedia("(prefers-color-scheme: dark)");
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  },
  get: () => window.matchMedia("(prefers-color-scheme: dark)").matches,
};

// WCAG relative luminance, used to keep text on the accent readable.
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

export function MultiSelect({ config = defaultConfig }: { config?: MultiSelectConfig }) {
  const all = config.options.map((option) => option.label).filter((label) => label.trim() !== "");
  const [chosen, setChosen] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [message, setMessage] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const accentLuminance = luminance(config.accentColor);

  const matches = all.filter((label) => {
    const text = label.toLowerCase();
    const search = query.trim().toLowerCase();
    return search === "" || (config.filter === "startsWith" ? text.startsWith(search) : text.includes(search));
  });
  const full = config.maxSelected > 0 && chosen.length >= config.maxSelected;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function toggle(label: string) {
    if (chosen.includes(label)) {
      const rest = chosen.filter((entry) => entry !== label);
      setChosen(rest);
      setMessage(`${label} removed. ${rest.length} selected.`);
      return;
    }
    if (full) {
      setMessage(`You can choose ${config.maxSelected} at most. Remove one first.`);
      return;
    }
    const next = [...chosen, label];
    setChosen(next);
    setMessage(`${label} selected. ${next.length} selected.`);
    setQuery("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        setActive(0);
        return;
      }
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((current) => (current + step + matches.length) % Math.max(1, matches.length));
      return;
    }
    if (event.key === "Enter" && open && matches[active]) {
      event.preventDefault();
      toggle(matches[active]);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      return;
    }
    // Backspace on an empty box takes the last one off, the way tag fields usually do.
    if (event.key === "Backspace" && query === "" && chosen.length > 0) {
      const last = chosen[chosen.length - 1];
      setChosen(chosen.slice(0, -1));
      setMessage(`${last} removed. ${chosen.length - 1} selected.`);
    }
  }

  const style = {
    "--ms-accent": config.accentColor,
    "--ms-accent-text": readableAccent(config.accentColor, dark),
    "--ms-on-accent": accentLuminance > 0.179 ? "#000000" : "#ffffff",
    "--ms-radius": `${config.radius}px`,
    "--ms-surface": palette.surface,
    "--ms-sunk": palette.sunk,
    "--ms-text": palette.text,
    "--ms-muted": palette.muted,
    "--ms-line": palette.line,
    "--ms-hover": palette.hover,
  } as CSSProperties;
  const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ms-accent-text)";

  return (
    <div ref={rootRef} style={style} className="relative bg-(--ms-surface) text-(--ms-text)">
      <label htmlFor="multi-select-input" className="block font-medium">
        {config.label}
      </label>
      {config.hint.trim() !== "" && (
        <p id="multi-select-hint" className="mt-0.5 text-sm text-(--ms-muted)">
          {config.hint}
        </p>
      )}

      {/* The chosen ones are buttons, not decoration: each one can be taken off again. */}
      {chosen.length > 0 && (
        <ul aria-label={`${config.label}, selected`} className="mt-2 flex list-none flex-wrap gap-2 p-0">
          {chosen.map((label) => (
            <li key={label}>
              <button
                type="button"
                onClick={() => toggle(label)}
                // Named outright: joined text nodes would read "Testing , remove".
                aria-label={`Remove ${label}`}
                className={`inline-flex min-h-8 cursor-pointer items-center gap-1 rounded-full bg-(--ms-sunk) py-1 pr-2 pl-3 text-sm ${focus}`}
              >
                {label}
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </li>
          ))}
          {config.clearAll && (
            <li>
              <button
                type="button"
                onClick={() => {
                  setChosen([]);
                  setMessage("All removed. 0 selected.");
                }}
                className={`inline-flex min-h-8 cursor-pointer items-center rounded-full px-3 py-1 text-sm underline ${focus}`}
              >
                Clear all
              </button>
            </li>
          )}
        </ul>
      )}

      <div className="mt-2">
        <input
          ref={inputRef}
          id="multi-select-input"
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls="multi-select-list"
          aria-autocomplete="list"
          aria-activedescendant={open && matches[active] ? `multi-select-option-${active}` : undefined}
          aria-describedby={config.hint.trim() !== "" ? "multi-select-hint" : undefined}
          placeholder={config.placeholder}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className={`w-full rounded-(--ms-radius) border border-(--ms-line) bg-(--ms-surface) px-3 py-2 ${focus}`}
        />
      </div>

      {/* Two things worth saying: how many match what you typed, and what just changed. */}
      <p aria-live="polite" className="sr-only">
        {open ? `${matches.length} option${matches.length === 1 ? "" : "s"} available. ` : ""}
        {message}
      </p>

      <ul
        id="multi-select-list"
        role="listbox"
        aria-label={config.label}
        aria-multiselectable="true"
        hidden={!open}
        className="absolute z-20 mt-1 max-h-60 w-full list-none overflow-y-auto rounded-(--ms-radius) border border-(--ms-line) bg-(--ms-surface) p-1 shadow-lg"
      >
        {matches.length === 0 && (
          <li className="px-3 py-2 text-(--ms-muted)">No matches for “{query}”.</li>
        )}
        {matches.map((label, index) => {
          const selected = chosen.includes(label);
          return (
            <li
              key={label}
              id={`multi-select-option-${index}`}
              role="option"
              aria-selected={selected}
              onMouseDown={(event) => {
                // Keep the caret in the box: a mousedown elsewhere would take focus away.
                event.preventDefault();
                toggle(label);
              }}
              onMouseEnter={() => setActive(index)}
              className={`flex cursor-pointer items-center gap-2 rounded-[calc(var(--ms-radius)-4px)] px-3 py-2 ${
                index === active ? "bg-(--ms-hover)" : ""
              } ${full && !selected ? "opacity-50" : ""}`}
            >
              <span
                aria-hidden="true"
                className={`grid size-5 shrink-0 place-items-center rounded border ${
                  selected ? "border-(--ms-accent) bg-(--ms-accent) text-(--ms-on-accent)" : "border-(--ms-line)"
                }`}
              >
                {selected && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="size-3">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </span>
              {label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
