"use client";

import { useSyncExternalStore, type CSSProperties } from "react";

export type PageHeaderConfig = {
  title: string;
  lede: string;
  showTrail: boolean;
  crumbs: { label: string; href: string }[];
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  metaLabel: string;
  metaValue: string;
  align: "left" | "centre";
  theme: "light" | "dark" | "system";
  accentColor: string;
  breadcrumbLabel: string;
};

// @config-start
const defaultConfig: PageHeaderConfig = {
  title: "Accessibility statement",
  lede: "What this site does about access, what it has been tested with, and what to do if something here gets in your way.",
  showTrail: true,
  crumbs: [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
  ],
  primaryLabel: "Report a problem",
  primaryHref: "https://build-components.devstash.me/about",
  secondaryLabel: "How it is tested",
  secondaryHref: "https://build-components.devstash.me/accessibility",
  metaLabel: "Last reviewed",
  metaValue: "24 September 2026",
  align: "left",
  theme: "light",
  accentColor: "#1d4ed8",
  breadcrumbLabel: "Breadcrumb",
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

/** Only http(s) and same-site paths are let through: a config value must never become a javascript: URL. */
function safeHref(href: string) {
  if (href.startsWith("/") || href.startsWith("#")) return href;
  try {
    const url = new URL(href, "https://example.com");
    return url.protocol === "http:" || url.protocol === "https:" ? href : "#";
  } catch {
    return "#";
  }
}

export function PageHeader({ config = defaultConfig }: { config?: PageHeaderConfig }) {
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--pgh-accent": config.accentColor,
    "--pgh-accent-text": readableAccent(config.accentColor, dark),
    "--pgh-on-accent": luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff",
    "--pgh-surface": `var(--bc-${dark ? "dark" : "light"}-surface, ${palette.surface})`,
    "--pgh-sunk": `var(--bc-${dark ? "dark" : "light"}-sunk, ${palette.sunk})`,
    "--pgh-text": `var(--bc-${dark ? "dark" : "light"}-text, ${palette.text})`,
    "--pgh-muted": `var(--bc-${dark ? "dark" : "light"}-muted, ${palette.muted})`,
    "--pgh-line": `var(--bc-${dark ? "dark" : "light"}-line, ${palette.line})`,
  } as CSSProperties;

  const centred = config.align === "centre";

  return (
    <div style={style} className="bg-(--pgh-surface) text-(--pgh-text)">
      {/*
        A header element, so it is a landmark whichever page it is on — and it holds the page's one h1,
        which is the single most useful thing on it for anyone navigating by heading.
      */}
      <header
        data-page-header
        className={`border-b border-(--pgh-line) px-4 py-8 sm:px-6 sm:py-12 ${centred ? "text-center" : ""}`}
      >
        <div className={`mx-auto w-full max-w-4xl ${centred ? "" : "max-w-3xl"}`}>
          {config.showTrail && config.crumbs.length > 0 && (
            // The trail belongs in the header, and it is a nav of its own with its own name.
            <nav aria-label={config.breadcrumbLabel} className="mb-4">
              <ol className={`m-0 flex list-none flex-wrap items-center gap-x-2 p-0 text-sm ${centred ? "justify-center" : ""}`}>
                {config.crumbs.map((crumb) => (
                  <li key={crumb.href} className="flex items-center gap-x-2">
                    <a
                      href={safeHref(crumb.href)}
                      className="inline-flex min-h-11 items-center text-(--pgh-accent-text) underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--pgh-accent-text)"
                    >
                      {crumb.label}
                    </a>
                    <span aria-hidden="true" className="text-(--pgh-muted)">
                      /
                    </span>
                  </li>
                ))}
                {/* The current page is the last step and is not a link: there is nowhere for it to go. */}
                <li aria-current="page" className="text-(--pgh-muted)">
                  {config.title}
                </li>
              </ol>
            </nav>
          )}

          <h1 className="text-[clamp(2rem,5vw,3rem)] leading-[1.05] font-bold tracking-tight text-balance">
            {config.title}
          </h1>

          {config.lede.trim() !== "" && (
            <p className={`mt-4 max-w-2xl text-lg text-pretty text-(--pgh-muted) ${centred ? "mx-auto" : ""}`}>
              {config.lede}
            </p>
          )}

          {(config.primaryLabel.trim() !== "" || config.secondaryLabel.trim() !== "") && (
            <div className={`mt-6 flex flex-wrap gap-3 ${centred ? "justify-center" : ""}`}>
              {config.primaryLabel.trim() !== "" && (
                <a
                  href={safeHref(config.primaryHref)}
                  className="inline-flex min-h-11 items-center rounded-[var(--bc-radius-button,0.375rem)] bg-(--pgh-accent) px-5 font-medium text-(--pgh-on-accent) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--pgh-accent-text)"
                >
                  {config.primaryLabel}
                </a>
              )}
              {config.secondaryLabel.trim() !== "" && (
                <a
                  href={safeHref(config.secondaryHref)}
                  className="inline-flex min-h-11 items-center rounded-[var(--bc-radius-sm,0.375rem)] border border-(--pgh-line) bg-(--pgh-sunk) px-5 font-medium text-(--pgh-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--pgh-accent-text)"
                >
                  {config.secondaryLabel}
                </a>
              )}
            </div>
          )}

          {config.metaValue.trim() !== "" && (
            // A labelled pair, not a bare date: "24 September 2026" alone says nothing about what it is.
            <dl className={`mt-6 flex flex-wrap items-baseline gap-x-2 text-sm text-(--pgh-muted) ${centred ? "justify-center" : ""}`}>
              <dt>{config.metaLabel}</dt>
              <dd className="m-0 font-medium text-(--pgh-text)">{config.metaValue}</dd>
            </dl>
          )}
        </div>
      </header>
    </div>
  );
}
