"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";

export type SearchConfig = {
  label: string;
  placeholder: string;
  data: string;
  titleKey: string;
  fields: string;
  layout: "dialog" | "inline";
  shortcut: boolean;
  maxResults: number;
  groups: boolean;
  highlight: boolean;
  emptyText: string;
  theme: "light" | "dark" | "system";
  accentColor: string;
  radius: number;
};

// @config-start
const defaultConfig: SearchConfig = {
  label: "Search the site",
  placeholder: "Search pages, guides and people",
  data: JSON.stringify([
    {
      title: "Guides",
      children: [
        { title: "Getting started", description: "Install, configure and ship your first part", url: "/guides/start", tags: ["install", "setup"] },
        { title: "Theming", description: "Colours, dark mode and your own tokens", url: "/guides/theming", tags: ["dark mode", "colour"] },
        {
          title: "Accessibility",
          description: "How every part is tested",
          url: "/guides/accessibility",
          children: [
            { title: "Keyboard support", description: "Every key each part answers to", url: "/guides/accessibility/keyboard", tags: ["focus", "shortcuts"] },
            { title: "Screen readers", description: "What gets announced, and when", url: "/guides/accessibility/screen-readers", tags: ["aria", "voiceover", "nvda"] },
          ],
        },
      ],
    },
    {
      title: "Components",
      children: [
        { title: "Date picker", description: "One date or a range", url: "/date-picker", tags: ["calendar", "form"] },
        { title: "Data table", description: "Sortable rows that stack on a phone", url: "/table", tags: ["grid", "sort"] },
        { title: "Modal", description: "A dialog that keeps focus inside", url: "/modal", tags: ["dialog", "overlay"] },
      ],
    },
    {
      title: "People",
      children: [
        { title: "Alex Fisher", description: "Design systems lead", url: "/people/alex", tags: ["design"] },
        { title: "Sam Okafor", description: "Accessibility specialist", url: "/people/sam", tags: ["accessibility", "audit"] },
      ],
    },
  ]),
  titleKey: "title",
  fields: "title,description,tags",
  layout: "dialog",
  shortcut: true,
  maxResults: 8,
  groups: true,
  highlight: true,
  emptyText: "Nothing matches that. Try a shorter word.",
  theme: "light",
  accentColor: "#2563eb",
  radius: 12,
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#d9d5e4", hover: "#eeecf5" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#3a3448", hover: "#2a2438" },
};

const darkMedia = {
  subscribe: (onChange: () => void) => {
    const list = window.matchMedia("(prefers-color-scheme: dark)");
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  },
  get: () => window.matchMedia("(prefers-color-scheme: dark)").matches,
};

/** Whether this device labels its shortcuts with ⌘ rather than Ctrl. */
const appleMedia = {
  subscribe: () => () => {},
  get: () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent),
};

// WCAG relative luminance, used to keep the accent readable as text.
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

/** Relative, fragment, http(s), mailto and tel links only. */
function safeHref(value: string) {
  return /^(\/|#|https?:\/\/|mailto:|tel:)/i.test(value.trim()) ? value.trim() : "#";
}

export type SearchEntry = { title: string; description: string; url: string; path: string[]; text: string };

/**
 * Walks any data — an array, an object, nested as deep as you like — and turns every object
 * with a title into one entry. The titles of the objects above it become its breadcrumb, so
 * nothing about the shape has to be declared up front.
 */
export function flatten(data: unknown, titleKey: string, fields: string[]): SearchEntry[] {
  const entries: SearchEntry[] = [];
  const words = (value: unknown): string =>
    typeof value === "string" || typeof value === "number"
      ? String(value)
      : Array.isArray(value)
        ? value.filter((part) => typeof part === "string" || typeof part === "number").join(" ")
        : "";

  function walk(node: unknown, path: string[]) {
    if (Array.isArray(node)) {
      node.forEach((child) => walk(child, path));
      return;
    }
    if (node === null || typeof node !== "object") return;
    const record = node as Record<string, unknown>;
    const title = typeof record[titleKey] === "string" ? (record[titleKey] as string) : "";
    if (title !== "") {
      // No fields named means every plain value on the object counts.
      const keys = fields.length > 0 ? fields : Object.keys(record);
      entries.push({
        title,
        description: typeof record.description === "string" ? record.description : "",
        url: typeof record.url === "string" ? record.url : "",
        path,
        text: [...keys.map((key) => words(record[key])), ...path].join(" ").toLowerCase(),
      });
    }
    const below = title !== "" ? [...path, title] : path;
    Object.values(record).forEach((value) => {
      if (value !== null && typeof value === "object") walk(value, below);
    });
  }

  walk(data, []);
  return entries;
}

/**
 * Every word you type has to appear somewhere in the entry. A title that starts with what you
 * typed ranks above one that merely contains it, and both rank above a match elsewhere.
 */
export function searchEntries(entries: SearchEntry[], query: string, limit: number) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const rank = (entry: SearchEntry) => {
    const title = entry.title.toLowerCase();
    if (title.startsWith(words[0])) return 0;
    if (words.every((word) => title.includes(word))) return 1;
    return 2;
  };
  return entries
    .filter((entry) => words.every((word) => entry.text.includes(word)))
    .sort((a, b) => rank(a) - rank(b))
    .slice(0, Math.max(1, limit));
}

function parse(data: string): unknown {
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function Search({ config = defaultConfig }: { config?: SearchConfig }) {
  const fields = config.fields
    .split(",")
    .map((field) => field.trim())
    .filter(Boolean);
  const entries = flatten(parse(config.data), config.titleKey.trim() || "title", fields);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const apple = useSyncExternalStore(appleMedia.subscribe, appleMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const results = searchEntries(entries, query, config.maxResults);
  const dialog = config.layout === "dialog";

  // A native dialog gives the palette its top layer, its Escape and an inert page behind it.
  useEffect(() => {
    const node = dialogRef.current;
    if (!node) return;
    if (open && !node.open) {
      node.showModal();
      inputRef.current?.focus();
    }
    if (!open && node.open) node.close();
  }, [open]);

  // ⌘K or Ctrl+K from anywhere on the page, which is what people reach for first.
  useEffect(() => {
    if (!config.shortcut || !dialog) return;
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen(true);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [config.shortcut, dialog]);

  function go(entry: SearchEntry) {
    window.location.assign(safeHref(entry.url));
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((current) => (current + step + results.length) % Math.max(1, results.length));
    }
    if (event.key === "Enter" && results[active]) {
      event.preventDefault();
      go(results[active]);
    }
  }

  function highlight(title: string): ReactNode {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!config.highlight || words.length === 0) return title;
    const lower = title.toLowerCase();
    const at = words.map((word) => ({ word, index: lower.indexOf(word) })).find((hit) => hit.index !== -1);
    if (!at) return title;
    return (
      <>
        {title.slice(0, at.index)}
        {/* Weight and an underline, in the text colour: an accent colour would have to clear
            4.5:1 on the highlighted row as well as on white. */}
        <mark className="bg-transparent font-bold text-inherit underline decoration-(--se-accent) decoration-2 underline-offset-2">
          {title.slice(at.index, at.index + at.word.length)}
        </mark>
        {title.slice(at.index + at.word.length)}
      </>
    );
  }

  const style = {
    "--se-accent": config.accentColor,
    "--se-accent-text": readableAccent(config.accentColor, dark),
    "--se-radius": `${config.radius}px`,
    "--se-surface": palette.surface,
    "--se-sunk": palette.sunk,
    "--se-text": palette.text,
    "--se-muted": palette.muted,
    "--se-line": palette.line,
    "--se-hover": palette.hover,
  } as CSSProperties;
  const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--se-accent-text)";

  // Results in the order they are shown, grouped under the top of their breadcrumb.
  const grouped = config.groups
    ? results.reduce<{ name: string; items: SearchEntry[] }[]>((groups, entry) => {
        const name = entry.path[0] ?? "Results";
        const group = groups.find((existing) => existing.name === name);
        if (group) group.items.push(entry);
        else groups.push({ name, items: [entry] });
        return groups;
      }, [])
    : [{ name: "", items: results }];
  const order = grouped.flatMap((group) => group.items);

  const panel = (
    <div className="flex flex-col gap-2">
      <label htmlFor="search-input" className={dialog ? "sr-only" : "font-medium"}>
        {config.label}
      </label>
      <div className="relative">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-(--se-muted)"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          ref={inputRef}
          id="search-input"
          type="search"
          role="combobox"
          aria-expanded={query.trim() !== ""}
          aria-controls="search-results"
          aria-autocomplete="list"
          aria-activedescendant={order[active] ? `search-result-${active}` : undefined}
          placeholder={config.placeholder}
          value={query}
          autoComplete="off"
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          className={`w-full rounded-(--se-radius) border border-(--se-line) bg-(--se-surface) py-3 pr-3 pl-10 text-base ${focus}`}
        />
      </div>

      <p aria-live="polite" className="sr-only">
        {query.trim() === "" ? "" : results.length === 0 ? config.emptyText : `${results.length} results.`}
      </p>

      {query.trim() !== "" && results.length === 0 && (
        <p className="px-1 py-4 text-center text-(--se-muted)">{config.emptyText}</p>
      )}

      <div
        id="search-results"
        role="listbox"
        aria-label={`${config.label}, results`}
        hidden={results.length === 0}
        className="max-h-96 overflow-y-auto"
      >
        {grouped.map((group) => (
          <div key={group.name || "all"} role={group.name ? "group" : undefined} aria-label={group.name || undefined}>
            {group.name && (
              <p aria-hidden="true" className="px-3 pt-3 pb-1 text-xs font-semibold tracking-wide text-(--se-muted) uppercase">
                {group.name}
              </p>
            )}
            {group.items.map((entry) => {
              const index = order.indexOf(entry);
              return (
                <div
                  key={`${entry.path.join("/")}/${entry.title}`}
                  id={`search-result-${index}`}
                  role="option"
                  aria-selected={index === active}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    go(entry);
                  }}
                  onMouseEnter={() => setActive(index)}
                  className={`cursor-pointer rounded-[calc(var(--se-radius)-4px)] px-3 py-2 ${
                    index === active ? "bg-(--se-hover)" : ""
                  }`}
                >
                  <span className="block font-medium">{highlight(entry.title)}</span>
                  {/* With groups on, the top of the trail is the group heading; with them off it
                      has to stay in the trail, or it is lost. */}
                  {(() => {
                    const trail = config.groups ? entry.path.slice(1) : entry.path;
                    return (entry.description !== "" || trail.length > 0) && (
                      <span className="block text-sm text-(--se-muted)">
                        {trail.length > 0 && <span>{trail.join(" › ")} · </span>}
                        {entry.description}
                      </span>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );

  if (!dialog) {
    return (
      <div style={style} className="bg-(--se-surface) text-(--se-text)">
        {panel}
      </div>
    );
  }

  return (
    <div style={style} className="bg-(--se-surface) text-(--se-text)">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className={`flex min-h-10 w-full max-w-sm cursor-pointer items-center gap-2 rounded-(--se-radius) border border-(--se-line) px-3 text-(--se-muted) ${focus}`}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-5">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <span className="flex-1 text-left">{config.label}</span>
        {config.shortcut && (
          <kbd className="rounded border border-(--se-line) px-1.5 text-xs">{apple ? "⌘K" : "Ctrl K"}</kbd>
        )}
      </button>

      <dialog
        ref={dialogRef}
        aria-label={config.label}
        onClose={() => {
          setOpen(false);
          triggerRef.current?.focus();
        }}
        onMouseDown={(event) => {
          if (event.target === dialogRef.current) setOpen(false);
        }}
        // Tailwind's reset zeroes the margins a dialog centres itself with, so it sets its own.
        className="mx-auto mt-[12vh] w-[min(40rem,calc(100vw-2rem))] rounded-(--se-radius) border border-(--se-line) bg-(--se-surface) p-3 text-(--se-text) shadow-2xl backdrop:bg-black/40"
      >
        {panel}
      </dialog>
    </div>
  );
}
