"use client";

import { useSyncExternalStore, type CSSProperties } from "react";

export type EmptyStateConfig = {
  icon: "box" | "search" | "inbox" | "warning";
  title: string;
  body: string;
  actionText: string;
  actionUrl: string;
  secondaryText: string;
  secondaryUrl: string;
  headingLevel: "h2" | "h3";
  align: "center" | "left";
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: EmptyStateConfig = {
  icon: "search",
  title: "No results for that search",
  body: "Check the spelling, or try a shorter word. You can also clear the filters and start again.",
  actionText: "Clear filters",
  actionUrl: "/search",
  secondaryText: "Browse everything",
  secondaryUrl: "/all",
  headingLevel: "h2",
  align: "center",
  theme: "light",
  accentColor: "#2563eb",
};
// @config-end

const icons = {
  box: "M3 8 12 3l9 5v8l-9 5-9-5V8Zm0 0 9 5m0 0 9-5m-9 5v8",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm5.5-1.5L21 21",
  inbox: "M4 13h4l1.5 3h5L16 13h4M4 13V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7m-16 0v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5",
  warning: "M12 9v5M12 17h.01M10.3 3.9 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
};
const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", border: "#737373" },
  dark: { surface: "#141019", sunk: "#1f1a29", text: "#f6f5fa", muted: "#b6b3c2", border: "#8e8a99" },
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

const safeHref = (value: string) => (/^(\/|#|https?:\/\/|mailto:|tel:)/i.test(value.trim()) ? value.trim() : "#");

export function EmptyState({ config = defaultConfig }: { config?: EmptyStateConfig }) {
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const accentLuminance = luminance(config.accentColor);
  const style = {
    "--es-accent": config.accentColor,
    "--es-accent-text": readableAccent(config.accentColor, dark),
    "--es-on-accent": accentLuminance > 0.179 ? "#000000" : "#ffffff",
    "--es-surface": palette.surface,
    "--es-sunk": palette.sunk,
    "--es-text": palette.text,
    "--es-muted": palette.muted,
    "--es-border": palette.border,
  } as CSSProperties;
  const Heading = config.headingLevel;
  const centred = config.align === "center";
  const button = "inline-flex min-h-10 cursor-pointer items-center rounded-lg px-4 font-medium no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--es-accent-text)";

  return (
    <div
      style={style}
      className={`rounded-xl border border-dashed border-(--es-border) bg-(--es-surface) px-6 py-10 text-(--es-text) ${centred ? "text-center" : ""}`}
    >
      <div className={`mx-auto flex max-w-md flex-col gap-3 ${centred ? "items-center" : "items-start"}`}>
        <span aria-hidden="true" className="grid size-12 place-items-center rounded-full bg-(--es-sunk) text-(--es-muted)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="size-6">
            <path d={icons[config.icon]} />
          </svg>
        </span>
        <Heading className="text-lg font-semibold">{config.title}</Heading>
        {config.body.trim() !== "" && <p className="text-pretty text-(--es-muted)">{config.body}</p>}
        {(config.actionText.trim() !== "" || config.secondaryText.trim() !== "") && (
          <div className={`mt-2 flex flex-wrap gap-3 ${centred ? "justify-center" : ""}`}>
            {config.actionText.trim() !== "" && (
              <a href={safeHref(config.actionUrl)} className={`${button} bg-(--es-accent) text-(--es-on-accent)`}>
                {config.actionText}
              </a>
            )}
            {config.secondaryText.trim() !== "" && (
              <a href={safeHref(config.secondaryUrl)} className={`${button} border border-(--es-border) text-(--es-text)`}>
                {config.secondaryText}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
