"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
} from "react";

export type FeedConfig = {
  label: string;
  items: { title: string; summary: string }[];
  pageSize: number;
  mode: "button" | "scroll";
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: FeedConfig = {
  label: "Latest updates",
  items: [
    { title: "Search now finds partial words", summary: "Typing “acc” finds accordion and accessibility." },
    { title: "Dark mode follows your device", summary: "Every part can switch with the operating system." },
    { title: "New: time picker", summary: "Type a time any common way, or pick from a list." },
    { title: "Drawers close with a swipe", summary: "On touch screens, swipe toward the edge to close." },
    { title: "Cookie banner added", summary: "Accept and reject are equals, and nothing is ticked in advance." },
    { title: "Tables stack on phones", summary: "Each row becomes a card with its labels kept." },
    { title: "Sortable lists without dragging", summary: "Move buttons and the keyboard reorder too." },
    { title: "Faster first load", summary: "Fonts and scripts load only where they are used." },
    { title: "Tree view added", summary: "Folders as deep as you like, with type-ahead." },
    { title: "Carousel pauses on focus", summary: "Rotation stops the moment you reach it with a key." },
  ],
  pageSize: 4,
  mode: "button",
  theme: "light",
  accentColor: "#2563eb",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", raised: "#ffffff", text: "#16121f", muted: "#4d4a57", line: "#d9d5e4", border: "#737373", hover: "#eeecf5" },
  dark: { surface: "#141019", raised: "#1f1a29", text: "#f6f5fa", muted: "#b6b3c2", line: "#3a3448", border: "#8e8a99", hover: "#2a2438" },
};
/** Stands in for a network request in this demo; replace loadMore's body with your fetch. */
const DEMO_DELAY = 500;

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

export function Feed({ config = defaultConfig }: { config?: FeedConfig }) {
  const id = useId();
  const all = config.items.filter((item) => item.title.trim() !== "");
  const pageSize = Math.max(1, config.pageSize);
  const [count, setCount] = useState(Math.min(pageSize, all.length));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const articles = useRef(new Map<number, HTMLElement>());
  const sentinel = useRef<HTMLDivElement>(null);
  const focusAfterLoad = useRef<number | null>(null);
  const done = count >= all.length;

  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const accentLuminance = luminance(config.accentColor);
  const style = {
    "--fd-accent": config.accentColor,
    "--fd-accent-text": readableAccent(config.accentColor, dark),
    "--fd-on-accent": accentLuminance > 0.179 ? "#000000" : "#ffffff",
    "--fd-surface": palette.surface,
    "--fd-raised": palette.raised,
    "--fd-text": palette.text,
    "--fd-muted": palette.muted,
    "--fd-line": palette.line,
    "--fd-border": palette.border,
    "--fd-hover": palette.hover,
  } as CSSProperties;

  function loadMore(moveFocus: boolean) {
    if (busy || done) return;
    setBusy(true);
    window.setTimeout(() => {
      const next = Math.min(count + pageSize, all.length);
      // Someone who pressed the button goes on reading from the first new item; scrolling
      // never moves focus.
      focusAfterLoad.current = moveFocus ? count : null;
      setCount(next);
      setBusy(false);
      setMessage(`${next - count} more loaded. Showing ${next} of ${all.length}.`);
    }, DEMO_DELAY);
  }

  useEffect(() => {
    if (focusAfterLoad.current === null) return;
    articles.current.get(focusAfterLoad.current)?.focus();
    focusAfterLoad.current = null;
  }, [count]);

  // Scroll mode: load when the end of the list comes into view.
  useEffect(() => {
    if (config.mode !== "scroll" || done || !sentinel.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) loadMore(false);
    });
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  });

  // APG feed: Page Down and Page Up move between articles.
  function onKeyDown(event: KeyboardEvent<HTMLElement>, index: number) {
    if (event.target !== event.currentTarget) return;
    const target = event.key === "PageDown" ? index + 1 : event.key === "PageUp" ? index - 1 : -1;
    if (target < 0 || target >= count) return;
    event.preventDefault();
    articles.current.get(target)?.focus();
  }

  return (
    <div style={style} className="max-w-xl bg-(--fd-surface) text-(--fd-text)">
      <p id={`${id}-label`} className="font-medium">
        {config.label}
      </p>
      <div role="feed" aria-labelledby={`${id}-label`} aria-busy={busy} className="mt-3 space-y-2">
        {all.slice(0, count).map((item, index) => (
          <article
            key={index}
            ref={(element) => {
              if (element) articles.current.set(index, element);
              else articles.current.delete(index);
            }}
            tabIndex={0}
            aria-labelledby={`${id}-title-${index}`}
            aria-describedby={item.summary.trim() ? `${id}-summary-${index}` : undefined}
            aria-posinset={index + 1}
            aria-setsize={all.length}
            onKeyDown={(event) => onKeyDown(event, index)}
            className="rounded-lg border border-(--fd-line) bg-(--fd-raised) p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--fd-accent-text)"
          >
            <p id={`${id}-title-${index}`} className="font-semibold">
              {item.title}
            </p>
            {item.summary.trim() !== "" && (
              <p id={`${id}-summary-${index}`} className="mt-1 text-sm text-(--fd-muted)">
                {item.summary}
              </p>
            )}
          </article>
        ))}
      </div>
      <div ref={sentinel} aria-hidden="true" data-sentinel className="h-px" />
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {done ? (
          <p className="text-sm text-(--fd-muted)">{`That's everything: ${all.length} of ${all.length}.`}</p>
        ) : (
          <>
            {/* Kept in scroll mode too, for keyboards and for when scrolling can't reach the end. */}
            <button
              type="button"
              onClick={() => loadMore(true)}
              aria-disabled={busy || undefined}
              className="min-h-10 cursor-pointer rounded-lg border border-(--fd-border) bg-(--fd-surface) px-4 font-medium hover:bg-(--fd-hover) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--fd-accent-text) aria-disabled:cursor-wait"
            >
              {busy ? "Loading…" : "Load more"}
            </button>
            <p className="text-sm text-(--fd-muted)">
              Showing {count} of {all.length}
            </p>
          </>
        )}
      </div>
      <p role="status" className="sr-only">
        {message}
      </p>
    </div>
  );
}
