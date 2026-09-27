"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export type HoverCardConfig = {
  triggerText: string;
  beforeText: string;
  afterText: string;
  cardTitle: string;
  cardMeta: string;
  cardBody: string;
  linkHref: string;
  openDelayMs: number;
  closeDelayMs: number;
  placement: "above" | "below";
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: HoverCardConfig = {
  triggerText: "the searchable select",
  beforeText: "Pair this with ",
  afterText: " when the list runs past about fifteen options.",
  cardTitle: "Searchable select",
  cardMeta: "APG Combobox · Inputs",
  cardBody: "Type to filter a long list, pick with the keyboard or the mouse, with the matched letters marked.",
  linkHref: "https://build-components.devstash.me/searchable-select",
  openDelayMs: 300,
  closeDelayMs: 400,
  placement: "below",
  theme: "light",
  accentColor: "#7c3aed",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#1b1624", sunk: "#272031", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
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

/** Only http(s) links are let through: a config value must never become a javascript: URL. */
function safeHref(href: string) {
  try {
    const url = new URL(href, "https://example.com");
    return url.protocol === "http:" || url.protocol === "https:" ? href : "#";
  } catch {
    return "#";
  }
}

export function HoverCard({ config = defaultConfig }: { config?: HoverCardConfig }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const root = useRef<HTMLSpanElement | null>(null);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--hc-accent": config.accentColor,
    "--hc-accent-text": readableAccent(config.accentColor, dark),
    "--hc-surface": palette.surface,
    "--hc-sunk": palette.sunk,
    "--hc-text": palette.text,
    "--hc-muted": palette.muted,
    "--hc-line": palette.line,
  } as CSSProperties;

  const later = (next: boolean, delay: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(next), delay);
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  // Dismissible without moving the pointer, which is the first of the three things WCAG 1.4.13 asks
  // for. Attached once rather than only while open, so nothing depends on the order two effects run in.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      clearTimeout(timer.current);
      setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div style={style} className="bg-(--hc-surface) p-4 text-(--hc-text)">
      <p className="max-w-prose">
        {config.beforeText}
        <span
          ref={root}
          className="relative inline-block"
          // The card stays while the pointer is anywhere over the trigger or the card itself, so it can
          // be reached rather than vanishing on the way (WCAG 1.4.13, hoverable).
          onMouseEnter={() => later(true, config.openDelayMs)}
          onMouseLeave={() => later(false, config.closeDelayMs)}
          onFocus={() => later(true, 0)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node)) later(false, 0);
          }}
        >
          {/*
            A real link, so the card is an extra rather than the only way to the information. Nothing
            inside the card is interactive: a tooltip must not hold controls, and a preview that needs
            its own buttons is a popover, not a hover card.
          */}
          <a
            href={safeHref(config.linkHref)}
            aria-describedby={open ? `${id}-card` : undefined}
            data-trigger
            className="rounded underline decoration-(--hc-accent) decoration-2 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--hc-accent-text)"
          >
            {config.triggerText}
          </a>

          <span
            id={`${id}-card`}
            role="tooltip"
            data-card
            hidden={!open}
            className={`absolute left-0 z-30 block w-72 rounded-lg border border-(--hc-line) bg-(--hc-surface) p-3 text-left shadow-xl ${
              config.placement === "above" ? "bottom-full mb-2" : "top-full mt-2"
            }`}
          >
            <span className="block font-semibold">{config.cardTitle}</span>
            <span className="mt-0.5 block font-mono text-xs text-(--hc-muted)">{config.cardMeta}</span>
            <span className="mt-2 block text-sm text-(--hc-muted)">{config.cardBody}</span>
          </span>
        </span>
        {config.afterText}
      </p>
    </div>
  );
}
