"use client";

import { useId, useState, useSyncExternalStore, type CSSProperties } from "react";

export type NotificationListConfig = {
  heading: string;
  items: { title: string; meta: string; unread: string }[];
  unreadWord: string;
  markOneLabel: string;
  markAllLabel: string;
  allReadText: string;
  showCount: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: NotificationListConfig = {
  heading: "Notifications",
  items: [
    { title: "Priya assigned you “Rewrite the export job”", meta: "12 minutes ago", unread: "yes" },
    { title: "Build 4812 failed on main", meta: "1 hour ago", unread: "yes" },
    { title: "Your weekly summary is ready", meta: "Yesterday", unread: "yes" },
    { title: "Sam commented on “Invoice rounding”", meta: "2 days ago", unread: "no" },
    { title: "Storage is 80% full", meta: "Last week", unread: "no" },
  ],
  unreadWord: "Unread",
  markOneLabel: "Mark as read",
  markAllLabel: "Mark all as read",
  allReadText: "Nothing unread.",
  showCount: true,
  theme: "light",
  accentColor: "#1d4ed8",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
};

// Follows the system, unless the page has a light/dark choice of its own: <html data-bc-scheme> (D87).
const darkMedia = {
  subscribe: (onChange: () => void) => {
    const list = window.matchMedia("(prefers-color-scheme: dark)");
    const chosen = new MutationObserver(onChange);
    list.addEventListener("change", onChange);
    chosen.observe(document.documentElement, { attributes: true, attributeFilter: ["data-bc-scheme"] });
    return () => {
      list.removeEventListener("change", onChange);
      chosen.disconnect();
    };
  },
  get: () => {
    const chosen = document.documentElement.dataset.bcScheme;
    return chosen ? chosen === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  },
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

export function NotificationList({ config = defaultConfig }: { config?: NotificationListConfig }) {
  const id = useId();
  // Read state is kept by position in the list, not by title: two notifications can share a title.
  const [read, setRead] = useState<number[]>([]);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--ntf-accent": config.accentColor,
    "--ntf-accent-text": readableAccent(config.accentColor, dark),
    "--ntf-on-accent": luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff",
    "--ntf-surface": `var(--bc-${dark ? "dark" : "light"}-surface, ${palette.surface})`,
    "--ntf-sunk": `var(--bc-${dark ? "dark" : "light"}-sunk, ${palette.sunk})`,
    "--ntf-text": `var(--bc-${dark ? "dark" : "light"}-text, ${palette.text})`,
    "--ntf-muted": `var(--bc-${dark ? "dark" : "light"}-muted, ${palette.muted})`,
    "--ntf-line": `var(--bc-${dark ? "dark" : "light"}-line, ${palette.line})`,
  } as CSSProperties;

  const isUnread = (item: { unread: string }, index: number) => item.unread === "yes" && !read.includes(index);
  const unread = config.items.filter(isUnread).length;

  return (
    <div style={style} className="bg-(--ntf-surface) p-1 text-(--ntf-text)">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-(--ntf-line) pb-3">
        <h2 id={`${id}-heading`} className="m-0 text-xl font-semibold">
          {/* The count is part of the heading text, so the space is in the text and it never reads "Notifications(3)". */}
          {config.heading}
          {config.showCount && unread > 0 ? ` (${unread} unread)` : ""}
        </h2>
        {unread > 0 && (
          <button
            type="button"
            onClick={() => setRead(config.items.map((_, index) => index))}
            className="inline-flex min-h-11 items-center rounded-[var(--bc-radius-sm,0.375rem)] border border-(--ntf-line) bg-(--ntf-sunk) px-3 text-sm font-medium text-(--ntf-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ntf-accent-text)"
          >
            {config.markAllLabel}
          </button>
        )}
      </div>

      <ul aria-labelledby={`${id}-heading`} className="m-0 list-none p-0">
        {config.items.map((item, index) => {
          const fresh = isUnread(item, index);
          return (
            <li
              key={index}
              data-unread={fresh ? "true" : "false"}
              className={`flex min-h-16 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-(--ntf-line) py-3 ${
                fresh ? "border-l-4 border-l-(--ntf-accent) pl-3" : "pl-4"
              }`}
            >
              <div className="min-w-48 flex-1">
                <p className={`m-0 ${fresh ? "font-semibold" : ""}`}>
                  {item.title}
                  {/* Unread is a word as well as a bar, never colour or a dot alone. */}
                  {fresh && <span className="ml-2 text-xs font-bold tracking-wide text-(--ntf-accent-text) uppercase">{config.unreadWord}</span>}
                </p>
                <p className="mt-0.5 text-sm text-(--ntf-muted)">{item.meta}</p>
              </div>
              {fresh && (
                <button
                  type="button"
                  onClick={() => setRead([...read, index])}
                  // Named with the thing it acts on, so a list of buttons all called "Mark as read" is not
                  // what a screen reader hears.
                  aria-label={`${config.markOneLabel}: ${item.title}`}
                  className="inline-flex min-h-11 items-center rounded-[var(--bc-radius-sm,0.375rem)] px-2 text-sm font-medium text-(--ntf-accent-text) underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ntf-accent-text)"
                >
                  {config.markOneLabel}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <p role="status" className="mt-3 text-sm text-(--ntf-muted)">
        {unread === 0 ? config.allReadText : `${unread} unread`}
      </p>
    </div>
  );
}
