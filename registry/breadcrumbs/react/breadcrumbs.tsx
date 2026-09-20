"use client";

import { useSyncExternalStore, type CSSProperties } from "react";

export type BreadcrumbItem = { label: string; href: string };

export type BreadcrumbsConfig = {
  label: string;
  items: BreadcrumbItem[];
  separator: "chevron" | "slash" | "arrow";
  homeIcon: boolean;
  collapse: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: BreadcrumbsConfig = {
  label: "Breadcrumb",
  items: [
    { label: "Home", href: "/" },
    { label: "Catalogue", href: "/catalogue" },
    { label: "Navigation", href: "/catalogue/navigation" },
    { label: "Breadcrumbs", href: "" },
  ],
  separator: "chevron",
  homeIcon: true,
  collapse: true,
  theme: "light",
  accentColor: "#2563eb",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", muted: "#4d4a57" },
  dark: { surface: "#141019", text: "#f6f5fa", muted: "#b6b3c2" },
};

const darkMedia = {
  subscribe: (onChange: () => void) => {
    const list = window.matchMedia("(prefers-color-scheme: dark)");
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  },
  get: () => window.matchMedia("(prefers-color-scheme: dark)").matches,
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

const separators = { chevron: "›", slash: "/", arrow: "→" };

export function Breadcrumbs({ config = defaultConfig }: { config?: BreadcrumbsConfig }) {
  const items = config.items.filter((item) => item.label.trim() !== "");
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;

  const style = {
    "--bc-accent-text": readableAccent(config.accentColor, dark),
    "--bc-surface": palette.surface,
    "--bc-text": palette.text,
    "--bc-muted": palette.muted,
  } as CSSProperties;
  const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bc-accent-text)";

  if (items.length === 0) return null;

  return (
    <nav aria-label={config.label} style={style} className="bg-(--bc-surface) text-(--bc-text)">
      <ol className="flex list-none flex-wrap items-center gap-x-1 gap-y-1 p-0 text-sm">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          const collapses = config.collapse && items.length > 2;
          // On a phone only the first and last steps are shown: the ones between are the ones
          // nobody taps, and they push the current page off the screen.
          const hidden = collapses && !last && index !== 0;
          return (
            <li key={index} className={`flex items-center gap-1 ${hidden ? "hidden sm:flex" : "flex"}`}>
              {index > 0 && (
                <span aria-hidden="true" className="px-1 text-(--bc-muted)">
                  {separators[config.separator]}
                </span>
              )}
              {last ? (
                <span aria-current="page" className="inline-flex min-h-6 items-center font-medium">
                  {item.label}
                </span>
              ) : (
                <a
                  href={safeHref(item.href)}
                  className={`inline-flex min-h-6 items-center gap-1 py-0.5 text-(--bc-muted) underline hover:text-(--bc-accent-text) ${focus}`}
                >
                  {index === 0 && config.homeIcon && (
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4">
                      <path d="M4 11 12 4l8 7M6 10v9h12v-9" />
                    </svg>
                  )}
                  {item.label}
                </a>
              )}
              {/* The gap stands in for the steps between, and only on a phone. */}
              {collapses && index === 0 && (
                <span aria-hidden="true" className="pl-2 text-(--bc-muted) sm:hidden">
                  › …
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
