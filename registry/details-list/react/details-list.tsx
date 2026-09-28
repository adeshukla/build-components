"use client";

import { useSyncExternalStore, type CSSProperties } from "react";

export type DetailsListConfig = {
  heading: string;
  rows: { term: string; detail: string; href: string }[];
  emptyText: string;
  editText: string;
  columns: "one" | "two";
  dividers: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: DetailsListConfig = {
  heading: "Order details",
  rows: [
    { term: "Order", detail: "BC-4821", href: "" },
    { term: "Placed", detail: "4 March 2026", href: "" },
    { term: "Delivery address", detail: "12 Harbour Road, Falmouth, TR11 2AB", href: "/account/addresses" },
    { term: "Payment", detail: "Visa ending 4417", href: "/account/payment" },
    { term: "Purchase order", detail: "", href: "" },
  ],
  emptyText: "Not given",
  editText: "Change",
  columns: "one",
  dividers: true,
  theme: "light",
  accentColor: "#1d4ed8",
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

/** Relative, fragment, http(s), mailto and tel links only; anything else becomes "#". */
function safeHref(value: string) {
  return /^(\/|#|https?:\/\/|mailto:|tel:)/i.test(value.trim()) ? value.trim() : "#";
}

export function DetailsList({ config = defaultConfig }: { config?: DetailsListConfig }) {
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--dl-accent": config.accentColor,
    "--dl-accent-text": readableAccent(config.accentColor, dark),
    "--dl-surface": palette.surface,
    "--dl-sunk": palette.sunk,
    "--dl-text": palette.text,
    "--dl-muted": palette.muted,
    "--dl-line": palette.line,
  } as CSSProperties;

  const rows = config.rows.filter((row) => row.term.trim() !== "");

  return (
    <div style={style} className="bg-(--dl-surface) text-(--dl-text)">
      {config.heading.trim() !== "" && <h2 className="text-lg font-semibold">{config.heading}</h2>}

      {/* A description list: the label is the term and the value its description, so the pairing
          survives without the two-column layout. */}
      <dl className={`mt-3 grid gap-x-8 ${config.columns === "two" ? "sm:grid-cols-2" : ""}`}>
        {rows.map((row) => (
          <div
            key={row.term}
            className={`flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2 ${
              config.dividers ? "border-b border-(--dl-line) last:border-0" : ""
            }`}
          >
            <dt className="text-sm text-(--dl-muted)">{row.term}</dt>
            <dd className="m-0 flex flex-wrap items-baseline gap-3 text-right sm:text-left">
              {/* An empty value says so, rather than leaving a gap nobody can read. */}
              <span className={row.detail.trim() === "" ? "text-(--dl-muted) italic" : "font-medium"}>
                {row.detail.trim() === "" ? config.emptyText : row.detail}
              </span>
              {row.href.trim() !== "" && (
                <a
                  href={safeHref(row.href)}
                  // A standalone action in a row, not a word in a sentence, so it needs a real 24px target.
                  className="inline-flex min-h-6 items-center rounded text-sm text-(--dl-accent-text) underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--dl-accent-text)"
                >
                  {config.editText}
                  {/* Five identical "Change" links are useless in a list of links: name the row. */}
                  <span className="sr-only">{` ${row.term.toLowerCase()}`}</span>
                </a>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
