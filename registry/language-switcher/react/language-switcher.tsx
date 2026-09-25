"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent } from "react";

export type LanguageSwitcherConfig = {
  label: string;
  languages: { name: string; code: string; url: string }[];
  currentCode: string;
  showCode: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: LanguageSwitcherConfig = {
  label: "Language",
  languages: [
    { name: "English", code: "en", url: "/en" },
    { name: "Français", code: "fr", url: "/fr" },
    { name: "Deutsch", code: "de", url: "/de" },
    { name: "Español", code: "es", url: "/es" },
    { name: "हिन्दी", code: "hi", url: "/hi" },
  ],
  currentCode: "en",
  showCode: true,
  theme: "light",
  accentColor: "#2563eb",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", hover: "#eeecf5", text: "#16121f", muted: "#4d4a57", border: "#737373", line: "#d9d5e4" },
  dark: { surface: "#1c1826", hover: "#2a2438", text: "#f6f5fa", muted: "#b6b3c2", border: "#8e8a99", line: "#3a3448" },
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

const safeHref = (value: string) => (/^(\/|#|https?:\/\/)/i.test(value.trim()) ? value.trim() : "#");

export function LanguageSwitcher({ config = defaultConfig }: { config?: LanguageSwitcherConfig }) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--ls-accent": config.accentColor,
    "--ls-accent-text": readableAccent(config.accentColor, dark),
    "--ls-surface": palette.surface,
    "--ls-hover": palette.hover,
    "--ls-text": palette.text,
    "--ls-muted": palette.muted,
    "--ls-border": palette.border,
    "--ls-line": palette.line,
  } as CSSProperties;
  const languages = config.languages.filter((language) => language.name.trim() !== "" && language.code.trim() !== "");
  const current = languages.find((language) => language.code === config.currentCode) ?? languages[0];

  // Escape and clicks outside close it. Listening on the document, because Safari does not focus
  // a button when it is clicked.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    }
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  function onListKey(event: KeyboardEvent<HTMLUListElement>) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const links = [...event.currentTarget.querySelectorAll<HTMLAnchorElement>("a")];
    const at = links.indexOf(document.activeElement as HTMLAnchorElement);
    const next = event.key === "ArrowDown" ? (at + 1) % links.length : at <= 0 ? links.length - 1 : at - 1;
    links[next]?.focus();
  }

  return (
    <div ref={rootRef} style={style} className="relative inline-block bg-(--ls-surface) text-(--ls-text)">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        onClick={() => setOpen(!open)}
        className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-(--ls-border) px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ls-accent-text)"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="size-5">
          <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 0c2.5 2.4 3.8 5.5 3.8 9s-1.3 6.6-3.8 9c-2.5-2.4-3.8-5.5-3.8-9S9.5 5.4 12 3ZM3.3 9h17.4M3.3 15h17.4" />
        </svg>
        <span className="sr-only">{config.label}: </span>
        <span lang={current?.code}>{current?.name}</span>
        {config.showCode && current && (
          <span aria-hidden="true" className="text-(--ls-muted) uppercase">
            {current.code}
          </span>
        )}
      </button>

      {/* Links, not buttons: changing language is going to another page, so it can be opened in a
          new tab, bookmarked or read by a search engine. */}
      <ul
        id={`${id}-list`}
        hidden={!open}
        onKeyDown={onListKey}
        className="absolute z-20 mt-1 min-w-48 rounded-lg border border-(--ls-line) bg-(--ls-surface) p-1 shadow-lg"
      >
        {languages.map((language) => {
          const here = language.code === current?.code;
          return (
            <li key={language.code}>
              <a
                href={safeHref(language.url)}
                lang={language.code}
                hrefLang={language.code}
                aria-current={here ? "true" : undefined}
                className={`flex min-h-10 items-center justify-between gap-3 rounded px-3 no-underline hover:bg-(--ls-hover) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--ls-accent-text) ${here ? "font-semibold" : ""}`}
              >
                {language.name}
                {here ? (
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="size-4">
                    <path d="m5 12 5 5L20 7" />
                  </svg>
                ) : (
                  config.showCode && (
                    <span aria-hidden="true" className="text-sm text-(--ls-muted) uppercase">
                      {language.code}
                    </span>
                  )
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
