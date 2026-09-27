"use client";

import { useCallback, useState, useSyncExternalStore, type CSSProperties } from "react";

export type MaintenanceNoticeConfig = {
  heading: string;
  message: string;
  startsAt: string;
  endsAt: string;
  tone: "planned" | "warning";
  linkLabel: string;
  linkHref: string;
  dismissLabel: string;
  dismissible: boolean;
  remember: boolean;
  storageKey: string;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: MaintenanceNoticeConfig = {
  heading: "Planned maintenance",
  message: "Saving will be turned off while we move the database. Anything already saved stays safe.",
  startsAt: "2026-10-04T22:00",
  endsAt: "2026-10-05T02:00",
  tone: "planned",
  linkLabel: "What this affects",
  linkHref: "https://build-components.devstash.me/accessibility",
  dismissLabel: "Dismiss this notice",
  dismissible: true,
  remember: true,
  storageKey: "maintenance-2026-10-04",
  theme: "light",
  accentColor: "#e6b24a",
};
// @config-end

const palettes = {
  light: { surface: "#fffaf0", text: "#16121f", muted: "#4d4a57", line: "#e8d9b5" },
  dark: { surface: "#211b10", text: "#f6f5fa", muted: "#c8c0ad", line: "#5a4a28" },
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

/** Storage throws in a sandboxed frame and in private mode, so the answer falls back to memory. */
const remembered = new Set<string>();
function readDismissed(key: string) {
  try {
    return window.localStorage.getItem(`bc-${key}`) === "yes";
  } catch {
    return remembered.has(key);
  }
}
function writeDismissed(key: string) {
  remembered.add(key);
  try {
    window.localStorage.setItem(`bc-${key}`, "yes");
  } catch {
    // Memory is the fallback; nothing else to do.
  }
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/**
 * Written out by hand. Intl gives the server and the browser different strings, and "22:00–02:00" with
 * no date is the kind of window nobody can plan around.
 */
export function sayWindow(startsAt: string, endsAt: string) {
  const parse = (value: string) => {
    const [date, time] = value.split("T");
    const [year, month, day] = (date ?? "").split("-").map(Number);
    return { year, month, day, time: (time ?? "").slice(0, 5) };
  };
  const from = parse(startsAt);
  const to = parse(endsAt);
  if (!from.year || !to.year) return "";
  const sameDay = from.year === to.year && from.month === to.month && from.day === to.day;
  const start = `${from.day} ${MONTHS[from.month - 1]} at ${from.time}`;
  const end = sameDay ? to.time : `${to.day} ${MONTHS[to.month - 1]} at ${to.time}`;
  return `${start} until ${end}`;
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

export function MaintenanceNotice({ config = defaultConfig }: { config?: MaintenanceNoticeConfig }) {
  const [justGone, setJustGone] = useState(false);
  const key = config.storageKey;
  const subscribe = useCallback((onChange: () => void) => {
    window.addEventListener("storage", onChange);
    return () => window.removeEventListener("storage", onChange);
  }, []);
  const getSnapshot = useCallback(() => readDismissed(key), [key]);
  const stored = useSyncExternalStore(subscribe, getSnapshot, () => false);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--mnt-accent": config.accentColor,
    "--mnt-accent-text": readableAccent(config.accentColor, dark),
    "--mnt-surface": palette.surface,
    "--mnt-text": palette.text,
    "--mnt-muted": palette.muted,
    "--mnt-line": palette.line,
  } as CSSProperties;

  const gone = justGone || (config.remember && stored);
  const when = sayWindow(config.startsAt, config.endsAt);

  return (
    <div style={style}>
      {/*
        A region landmark, not a live region. The notice is already there when the page loads, so a live
        region would announce nothing; a landmark is findable at any point afterwards. It is sticky
        rather than fixed, so it keeps its own space instead of covering the page on a phone.
      */}
      {!gone && (
      <section
        data-notice
        aria-labelledby="mnt-heading"
        className="sticky top-0 z-30 border-b-4 border-(--mnt-accent) bg-(--mnt-surface) text-(--mnt-text)"
      >
        <div className="flex flex-wrap items-start gap-x-4 gap-y-2 px-4 py-3">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="mt-1 size-5 shrink-0 fill-(--mnt-accent-text)">
            {config.tone === "warning" ? (
              <path d="M12 2 1.5 20.5h21L12 2Zm0 5.5 1 7h-2l1-7Zm0 9.25a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3Z" />
            ) : (
              <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1 5h2v2h-2V7Zm0 4h2v6h-2v-6Z" />
            )}
          </svg>
          <div className="min-w-48 flex-1">
            <p id="mnt-heading" className="m-0 font-semibold">
              {config.heading}
            </p>
            {when !== "" && (
              // A real time element with a machine-readable window, not a vague "later tonight".
              <p className="mt-0.5 text-sm">
                <time dateTime={config.startsAt}>{when}</time>
              </p>
            )}
            <p className="mt-1 text-sm text-(--mnt-muted)">{config.message}</p>
            {config.linkLabel.trim() !== "" && (
              <p className="mt-1">
                <a
                  href={safeHref(config.linkHref)}
                  className="inline-flex min-h-11 items-center text-sm font-medium text-(--mnt-accent-text) underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--mnt-accent-text)"
                >
                  {config.linkLabel}
                </a>
              </p>
            )}
          </div>
          {config.dismissible && (
            <button
              type="button"
              onClick={() => {
                if (config.remember) writeDismissed(key);
                setJustGone(true);
              }}
              aria-label={config.dismissLabel}
              className="ml-auto inline-flex size-11 shrink-0 items-center justify-center rounded-md text-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--mnt-accent-text)"
            >
              <span aria-hidden="true">×</span>
            </button>
          )}
        </div>
      </section>
      )}

      {/* Something under the notice, so its stickiness can be seen. Delete it in your own page. */}
      <div className="grid gap-3 p-4">
        <p role="status" data-said className="text-sm text-(--mnt-muted)">
          {gone ? (config.remember ? "Notice dismissed. It will not come back on this browser." : "Notice dismissed.") : ""}
        </p>
        {[0, 1, 2, 3, 4, 5].map((row) => (
          <div key={row} aria-hidden="true" className="h-4 rounded bg-(--mnt-line)" style={{ width: `${92 - row * 9}%` }} />
        ))}
      </div>
    </div>
  );
}
