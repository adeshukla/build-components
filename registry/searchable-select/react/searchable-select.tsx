"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent } from "react";

export type SearchableSelectConfig = {
  label: string;
  placeholder: string;
  options: { label: string }[];
  noResultsText: string;
  name: string;
  filter: "contains" | "startsWith";
  maxVisible: number;
  clearButton: boolean;
  helperText: boolean;
  helperTextContent: string;
  theme: "light" | "dark" | "system";
  iosOnPhone: boolean;
  accentColor: string;
  radius: number;
  size: "sm" | "md" | "lg";
};

// @config-start
const defaultConfig: SearchableSelectConfig = {
  label: "Country",
  placeholder: "Start typing to search",
  options: [
    { label: "Australia" },
    { label: "Brazil" },
    { label: "Canada" },
    { label: "France" },
    { label: "Germany" },
    { label: "India" },
    { label: "Japan" },
    { label: "Kenya" },
    { label: "Mexico" },
    { label: "Netherlands" },
    { label: "New Zealand" },
    { label: "Spain" },
    { label: "United Kingdom" },
    { label: "United States" },
  ],
  noResultsText: "No matches. Try a different spelling.",
  name: "country",
  filter: "contains",
  maxVisible: 6,
  clearButton: false,
  helperText: false,
  helperTextContent: "Type to filter, then use the arrow keys or click to choose.",
  theme: "light",
  iosOnPhone: true,
  accentColor: "#2563eb",
  radius: 6,
  size: "md",
};
// @config-end

// Row heights (rem) match each size's option padding, so "visible options" is exact.
const sizes = {
  sm: { field: "h-8 text-sm", input: "px-2", button: "w-8", option: "px-2 py-1.5 text-sm", row: 2 },
  md: { field: "h-10 text-base", input: "px-3", button: "w-10", option: "px-3 py-2 text-sm", row: 2.25 },
  lg: { field: "h-12 text-lg", input: "px-4", button: "w-12", option: "px-4 py-2.5 text-base", row: 2.75 },
};

const IOS_FONT = '-apple-system, "SF Pro Text", "SF Pro Display", system-ui, sans-serif';
const IOS_BLUE = { light: "#007aff", dark: "#0a84ff" };
const iosSize = { field: "h-11 text-[17px]", input: "px-4", button: "w-11", option: "px-4 py-2.5 text-base", row: 2.75 };
const palettes = {
  light: { surface: "#ffffff", sunk: "#f2f2f7", text: "#171717", muted: "#535358", border: "#737373", line: "#d4d4d4", error: "#b3261e", hover: "#f2f2f7" },
  dark: { surface: "#1c1c1e", sunk: "#2c2c2e", text: "#f5f5f7", muted: "#b0b0b8", border: "#8e8e93", line: "#48484a", error: "#ff6b6b", hover: "#2c2c2e" },
};

const media = (query: string) => ({
  subscribe: (onChange: () => void) => {
    const list = window.matchMedia(query);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  },
  get: () => window.matchMedia(query).matches,
});
const darkMedia = media("(prefers-color-scheme: dark)");
const phoneMedia = media("(max-width: 480px)");
const isApplePhone = () =>
  /iP(hone|od|ad)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const iconButton =
  "grid shrink-0 cursor-pointer place-items-center text-(--ss-muted) hover:bg-(--ss-hover) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--ss-ring)";

// WCAG relative luminance, used to keep text and focus rings readable on any accent colour.
function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: number, b: number) {
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function shift(hex: string, factor: number) {
  const channels = [1, 3, 5].map((i) =>
    Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * factor))),
  );
  return `#${channels.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

/** The accent used as text: darkened (or lightened on dark) until it clears 4.5:1. */
function readableAccent(hex: string, surface: string, dark: boolean) {
  let color = hex;
  const surfaceLuminance = luminance(surface);
  for (let i = 0; i < 14 && contrast(luminance(color), surfaceLuminance) < 4.5; i++) {
    color = shift(color, dark ? 1.15 : 0.85);
  }
  return color;
}

function Highlight({ label, query }: { label: string; query: string }) {
  const at = query ? label.toLowerCase().indexOf(query) : -1;
  if (at < 0) return <>{label}</>;
  return (
    <>
      {label.slice(0, at)}
      <mark className="bg-transparent font-semibold text-inherit underline underline-offset-2">
        {label.slice(at, at + query.length)}
      </mark>
      {label.slice(at + query.length)}
    </>
  );
}

export function SearchableSelect({ config = defaultConfig }: { config?: SearchableSelectConfig }) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [text, setText] = useState("");
  const [selected, setSelected] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [error, setError] = useState("");

  // Theme and platform are read from the browser, so the exported file works anywhere.
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const onPhone = useSyncExternalStore(phoneMedia.subscribe, phoneMedia.get, () => false);
  const applePhone = useSyncExternalStore(phoneMedia.subscribe, () => onPhone && isApplePhone(), () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const ios = config.iosOnPhone && applePhone;
  const size = ios ? iosSize : sizes[config.size];
  const labels = config.options.map((option) => option.label.trim()).filter(Boolean);
  // The text of a chosen option lists every choice again; anything else filters.
  const filtering = text.trim() !== "" && text !== selected;
  const query = filtering ? text.trim().toLowerCase() : "";
  const matches = filtering
    ? labels.filter((label) =>
        config.filter === "startsWith" ? label.toLowerCase().startsWith(query) : label.toLowerCase().includes(query),
      )
    : labels;
  const expanded = open && matches.length > 0;
  const noResults = open && filtering && matches.length === 0;
  const showHelper = config.helperText && config.helperTextContent !== "";
  const describedBy = [showHelper && `${id}-help`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  const noun = config.label.trim().toLowerCase() || "option";
  const palette = dark ? palettes.dark : palettes.light;
  const accent =
    ios && config.accentColor === defaultConfig.accentColor ? IOS_BLUE[dark ? "dark" : "light"] : config.accentColor;
  const accentLuminance = luminance(accent);
  const style = {
    "--ss-accent": accent,
    "--ss-accent-text": readableAccent(accent, palette.surface, dark),
    "--ss-on-accent": accentLuminance > 0.179 ? "#000000" : "#ffffff",
    "--ss-ring": accentLuminance <= 0.35 || dark ? accent : "#000000",
    "--ss-radius": `${ios ? 12 : config.radius}px`,
    "--ss-surface": palette.surface,
    "--ss-sunk": palette.sunk,
    "--ss-text": palette.text,
    "--ss-muted": palette.muted,
    "--ss-border": ios ? palette.sunk : palette.border,
    "--ss-line": palette.line,
    "--ss-error": palette.error,
    "--ss-hover": palette.hover,
    ...(ios ? { fontFamily: IOS_FONT } : null),
  } as CSSProperties;

  useEffect(() => {
    if (active < 0) return;
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function choose(label: string) {
    setText(label);
    setSelected(label);
    setError("");
    setOpen(false);
    setActive(-1);
  }

  function close() {
    setOpen(false);
    setActive(-1);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      if (event.altKey || matches.length === 0) return;
      const count = matches.length;
      setActive((current) =>
        event.key === "ArrowDown" ? (current + 1) % count : current <= 0 ? count - 1 : current - 1,
      );
    } else if (event.key === "Enter") {
      if (expanded && active >= 0) {
        event.preventDefault();
        choose(matches[active]);
      }
    } else if (event.key === "Escape") {
      // First Escape closes the list; the next clears the field (APG combobox).
      if (expanded || noResults) {
        event.preventDefault();
        close();
      } else if (text) {
        event.preventDefault();
        setText("");
        setSelected("");
        setError("");
      }
    } else if (event.key === "Tab") {
      close();
    }
  }

  function onBlur() {
    close();
    // Read the live input: blur can arrive before React re-renders with the typed text.
    const typed = (inputRef.current?.value ?? text).trim();
    if (!typed) {
      setSelected("");
      setError("");
      return;
    }
    const match = labels.find((label) => label.toLowerCase() === typed.toLowerCase());
    if (match) {
      choose(match);
    } else {
      setSelected("");
      setError(`Choose ${/^[aeiou]/.test(noun) ? "an" : "a"} ${noun} from the list.`);
    }
  }

  return (
    <div className="flex flex-col gap-1.5 text-(--ss-text)" style={style}>
      <label id={`${id}-label`} htmlFor={`${id}-input`} className="font-medium">
        {config.label}
      </label>
      <div className="relative w-full max-w-xs">
        <div
          className={`flex items-stretch overflow-hidden rounded-(--ss-radius) border bg-(--ss-surface) text-(--ss-text) has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-(--ss-ring) ${error ? "border-(--ss-error)" : "border-(--ss-border)"} ${ios ? "bg-(--ss-sunk)" : ""} ${size.field}`}
        >
          <input
            ref={inputRef}
            id={`${id}-input`}
            type="text"
            role="combobox"
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={expanded}
            aria-controls={`${id}-listbox`}
            aria-activedescendant={expanded && active >= 0 ? `${id}-option-${active}` : undefined}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            placeholder={config.placeholder}
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setOpen(true);
              setActive(-1);
              setError("");
            }}
            onClick={() => setOpen(true)}
            onKeyDown={onKeyDown}
            onBlur={onBlur}
            className={`min-w-0 flex-1 bg-transparent outline-none placeholder:text-(--ss-muted) ${size.input}`}
          />
          {config.clearButton && text !== "" && (
            <button
              type="button"
              aria-label={`Clear ${noun}`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                setText("");
                setSelected("");
                setError("");
                inputRef.current?.focus();
              }}
              className={`${iconButton} ${size.button}`}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          )}
          <button
            type="button"
            tabIndex={-1}
            aria-label={`Show ${noun} options`}
            aria-expanded={expanded}
            aria-controls={`${id}-listbox`}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              if (open) close();
              else setOpen(true);
              inputRef.current?.focus();
            }}
            className={`${iconButton} ${size.button} ${ios ? "text-(--ss-accent-text)" : ""}`}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className={`size-4 transition-transform motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>

        <ul
          ref={listRef}
          id={`${id}-listbox`}
          role="listbox"
          aria-labelledby={`${id}-label`}
          hidden={!expanded}
          style={{ maxHeight: `${size.row * config.maxVisible + 0.5}rem` }}
          className="absolute z-10 mt-1 w-full overflow-y-auto rounded-(--ss-radius) border border-(--ss-line) bg-(--ss-surface) p-1 text-(--ss-text) shadow-lg"
        >
          {expanded &&
            matches.map((label, index) => (
              <li
                key={`${label}-${index}`}
                id={`${id}-option-${index}`}
                data-index={index}
                role="option"
                aria-selected={label === selected}
                onMouseDown={(event) => event.preventDefault()}
                onMouseMove={() => {
                  if (active !== index) setActive(index);
                }}
                onClick={() => choose(label)}
                className={`flex cursor-pointer items-center justify-between gap-2 rounded-(--ss-radius) ${size.option} ${index === active ? "bg-(--ss-accent) text-(--ss-on-accent)" : "hover:bg-(--ss-hover)"}`}
              >
                <span className="truncate">
                  <Highlight label={label} query={query} />
                </span>
                {label === selected && (
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="size-4 shrink-0">
                    <path d="m5 12 5 5L20 7" />
                  </svg>
                )}
              </li>
            ))}
        </ul>
        {noResults && (
          <p data-no-results className="absolute z-10 mt-1 w-full rounded-(--ss-radius) border border-(--ss-line) bg-(--ss-surface) px-3 py-2 text-sm text-(--ss-muted) shadow-lg">
            {config.noResultsText}
          </p>
        )}
      </div>
      {showHelper && (
        <p id={`${id}-help`} className="text-sm text-(--ss-muted)">
          {config.helperTextContent}
        </p>
      )}
      <p id={`${id}-error`} role="alert" className="text-sm text-(--ss-error) empty:hidden">
        {error}
      </p>
      <p aria-live="polite" className="sr-only">
        {open && filtering
          ? matches.length
            ? `${matches.length} ${matches.length === 1 ? "result" : "results"} available.`
            : config.noResultsText
          : ""}
      </p>
      {config.name !== "" && <input type="hidden" name={config.name} value={selected} />}
    </div>
  );
}
