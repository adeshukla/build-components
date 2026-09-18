"use client";

import { useSyncExternalStore, type CSSProperties } from "react";

export type FooterConfig = {
  brandText: string;
  tagline: string;
  links: { label: string; href: string }[];
  navLabel: string;
  legalText: string;
  layout: "split" | "stacked";
  social: boolean;
  socialLinks: { label: string; href: string }[];
  backToTop: boolean;
  backToTopText: string;
  theme: "light" | "dark" | "system";
  accentColor: string;
  spacing: "compact" | "regular" | "spacious";
  topBorder: boolean;
};

// @config-start
const defaultConfig: FooterConfig = {
  brandText: "Northwind",
  tagline: "Design and build for teams that ship.",
  links: [
    { label: "Work", href: "/work" },
    { label: "Services", href: "/services" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
  navLabel: "Footer",
  legalText: "© Northwind Ltd. All rights reserved.",
  layout: "split",
  social: false,
  socialLinks: [
    { label: "GitHub", href: "https://github.com" },
    { label: "LinkedIn", href: "https://linkedin.com" },
  ],
  backToTop: false,
  backToTopText: "Back to top",
  theme: "light",
  accentColor: "#2563eb",
  spacing: "regular",
  topBorder: true,
};
// @config-end

const palettes = {
  light: { surface: "#f7f7fb", text: "#16121f", muted: "#4d4a57", line: "#d9d5e4" },
  dark: { surface: "#141019", text: "#f6f5fa", muted: "#b6b3c2", line: "#3a3448" },
};

const spacings = {
  compact: "px-6 py-8",
  regular: "px-6 py-12",
  spacious: "px-6 py-16 sm:py-20",
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

export function SiteFooter({ config = defaultConfig }: { config?: FooterConfig }) {
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const stacked = config.layout === "stacked";
  const links = config.links.filter((link) => link.label.trim() !== "");
  const social = config.socialLinks.filter((link) => link.label.trim() !== "");

  const style = {
    "--ft-accent": readableAccent(config.accentColor, dark),
    "--ft-surface": palette.surface,
    "--ft-text": palette.text,
    "--ft-muted": palette.muted,
    "--ft-line": palette.line,
  } as CSSProperties;
  const link =
    "text-(--ft-muted) no-underline hover:text-(--ft-accent) hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ft-accent)";

  return (
    <footer
      style={style}
      className={`bg-(--ft-surface) text-(--ft-text) ${spacings[config.spacing]} ${config.topBorder ? "border-t border-(--ft-line)" : ""}`}
    >
      <div className={`mx-auto max-w-6xl ${stacked ? "text-center" : ""}`}>
        <div
          className={`flex flex-col gap-8 ${stacked ? "items-center" : "sm:flex-row sm:items-start sm:justify-between"}`}
        >
          <div className={stacked ? "" : "max-w-sm"}>
            <p className="text-lg font-semibold">{config.brandText}</p>
            {config.tagline !== "" && <p className="mt-2 text-pretty text-(--ft-muted)">{config.tagline}</p>}
          </div>

          {links.length > 0 && (
            <nav aria-label={config.navLabel}>
              <ul
                className={`flex list-none flex-wrap gap-x-6 gap-y-2 p-0 ${stacked ? "justify-center" : "sm:flex-col sm:gap-y-3"}`}
              >
                {links.map((item, index) => (
                  <li key={index}>
                    <a href={safeHref(item.href)} className={link}>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>

        {config.social && social.length > 0 && (
          <ul className={`mt-8 flex list-none flex-wrap gap-x-6 gap-y-2 p-0 ${stacked ? "justify-center" : ""}`}>
            {social.map((item, index) => (
              <li key={index}>
                {/* The link text names the service, so it makes sense out of context. */}
                <a href={safeHref(item.href)} className={link}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        )}

        <div
          className={`mt-10 flex flex-col gap-3 border-t border-(--ft-line) pt-6 text-sm ${
            stacked ? "items-center" : "sm:flex-row sm:items-center sm:justify-between"
          }`}
        >
          {config.legalText !== "" && <p className="text-(--ft-muted)">{config.legalText}</p>}
          {config.backToTop && (
            <a href="#top" className={link}>
              {config.backToTopText}
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
