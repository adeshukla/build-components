"use client";

import { useState, useSyncExternalStore, type CSSProperties } from "react";

export type PaginationConfig = {
  label: string;
  totalPages: number;
  startPage: number;
  siblings: number;
  hrefPattern: string;
  look: "numbers" | "compact";
  prevText: string;
  nextText: string;
  firstLast: boolean;
  summary: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
  radius: number;
};

// @config-start
const defaultConfig: PaginationConfig = {
  label: "Orders",
  totalPages: 12,
  startPage: 4,
  siblings: 1,
  hrefPattern: "",
  look: "numbers",
  prevText: "Previous",
  nextText: "Next",
  firstLast: true,
  summary: true,
  theme: "light",
  accentColor: "#2563eb",
  radius: 8,
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", muted: "#4d4a57", line: "#d9d5e4", hover: "#f4f3f8" },
  dark: { surface: "#141019", text: "#f6f5fa", muted: "#b6b3c2", line: "#3a3448", hover: "#221d2e" },
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

/**
 * The pages to show: the first, the last, the current one and its neighbours, with gaps in
 * between. A gap is a real gap, never a page you can press.
 */
export function pagesFor(current: number, total: number, siblings: number) {
  const pages: (number | "gap")[] = [];
  for (let page = 1; page <= total; page++) {
    const near = Math.abs(page - current) <= siblings;
    if (page === 1 || page === total || near) pages.push(page);
    else if (pages[pages.length - 1] !== "gap") pages.push("gap");
  }
  return pages;
}

export function Pagination({
  config = defaultConfig,
  onPage,
}: {
  config?: PaginationConfig;
  /** Called with the new page number, so the page around it can fetch and re-render. */
  onPage?: (page: number) => void;
}) {
  const total = Math.max(1, Math.round(config.totalPages));
  const [current, setCurrent] = useState(Math.min(total, Math.max(1, Math.round(config.startPage))));
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const accentLuminance = luminance(config.accentColor);

  function go(page: number) {
    const next = Math.min(total, Math.max(1, page));
    setCurrent(next);
    onPage?.(next);
  }

  const style = {
    "--pg-accent": config.accentColor,
    "--pg-accent-text": readableAccent(config.accentColor, dark),
    "--pg-on-accent": accentLuminance > 0.179 ? "#000000" : "#ffffff",
    "--pg-radius": `${config.radius}px`,
    "--pg-surface": palette.surface,
    "--pg-text": palette.text,
    "--pg-muted": palette.muted,
    "--pg-line": palette.line,
    "--pg-hover": palette.hover,
  } as CSSProperties;
  const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--pg-accent-text)";
  const step = `inline-flex min-h-10 min-w-10 cursor-pointer items-center justify-center gap-1 rounded-(--pg-radius) border border-(--pg-line) px-3 font-medium text-(--pg-text) no-underline hover:bg-(--pg-hover) disabled:cursor-not-allowed disabled:opacity-40 ${focus}`;
  const href = (page: number) => (config.hrefPattern.trim() === "" ? undefined : config.hrefPattern.replace("{page}", String(page)));

  /** A page is a link when you give a link pattern, and a button when you do not. */
  function Page({ page }: { page: number }) {
    const isCurrent = page === current;
    const className = `${step} ${isCurrent ? "border-(--pg-accent) bg-(--pg-accent) text-(--pg-on-accent) hover:bg-(--pg-accent)" : ""}`;
    const target = href(page);
    return target ? (
      <a href={target} aria-current={isCurrent ? "page" : undefined} aria-label={`Page ${page}`} className={className}>
        {page}
      </a>
    ) : (
      <button
        type="button"
        onClick={() => go(page)}
        aria-current={isCurrent ? "page" : undefined}
        aria-label={`Page ${page}`}
        className={className}
      >
        {page}
      </button>
    );
  }

  const arrow = (direction: "previous" | "next") => {
    const page = direction === "previous" ? current - 1 : current + 1;
    const disabled = direction === "previous" ? current === 1 : current === total;
    const text = direction === "previous" ? config.prevText : config.nextText;
    const icon = (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4">
        <path d={direction === "previous" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
      </svg>
    );
    const target = href(page);
    if (target && !disabled) {
      return (
        <a href={target} rel={direction} className={step}>
          {direction === "previous" ? icon : null}
          {text}
          {direction === "next" ? icon : null}
        </a>
      );
    }
    return (
      <button type="button" onClick={() => go(page)} disabled={disabled} className={step}>
        {direction === "previous" ? icon : null}
        {text}
        {direction === "next" ? icon : null}
      </button>
    );
  };

  return (
    <nav aria-label={config.label} style={style} className="bg-(--pg-surface) text-(--pg-text)">
      <div className="flex flex-wrap items-center gap-3">
        <ul className="flex list-none flex-wrap items-center gap-1 p-0">
          <li>{arrow("previous")}</li>

          {config.look === "numbers" &&
            pagesFor(current, total, Math.max(0, Math.round(config.siblings))).map((page, index) =>
              page === "gap" ? (
                <li key={`gap-${index}`} aria-hidden="true" className="px-1 text-(--pg-muted)">
                  …
                </li>
              ) : (
                <li key={page}>
                  <Page page={page} />
                </li>
              ),
            )}

          <li>{arrow("next")}</li>
        </ul>

        {config.summary && (
          <p aria-live="polite" className="text-sm text-(--pg-muted)">
            Page {current} of {total}
          </p>
        )}

        {config.firstLast && config.look === "numbers" && (
          <div className="flex gap-1">
            <button type="button" onClick={() => go(1)} disabled={current === 1} className={step}>
              First
            </button>
            <button type="button" onClick={() => go(total)} disabled={current === total} className={step}>
              Last
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
