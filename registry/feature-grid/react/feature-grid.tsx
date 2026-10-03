"use client";

import { useId, useSyncExternalStore, type CSSProperties } from "react";

export type FeatureGridConfig = {
  heading: string;
  intro: string;
  items: { title: string; text: string; glyph: string; href: string }[];
  columns: "two" | "three" | "four";
  linkText: string;
  showRule: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: FeatureGridConfig = {
  heading: "What you get",
  intro: "Every part is tested the same way before it goes in the catalogue.",
  items: [
    { title: "Two outputs", text: "React with Tailwind, or plain HTML, CSS and JavaScript. Both tested, neither a wrapper around the other.", glyph: "❏", href: "" },
    { title: "No dependency", text: "You copy the files. There is no package to install and nothing to keep up to date.", glyph: "✦", href: "" },
    { title: "Accessible first", text: "Keyboard paths, screen-reader wording and colour contrast are part of the definition of done.", glyph: "☼", href: "/accessibility" },
    { title: "Configured visually", text: "Set the options on the page, watch the real component change, then take the file.", glyph: "◈", href: "" },
    { title: "Dark mode included", text: "Light, dark or the visitor's own setting, in the exported file rather than a separate sheet.", glyph: "◐", href: "" },
    { title: "Yours afterwards", text: "Rename it, cut the options you do not need, fold it into your own components.", glyph: "✎", href: "" },
  ],
  columns: "three",
  linkText: "Read more",
  showRule: true,
  theme: "light",
  accentColor: "#0f766e",
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

/** Relative, fragment, http(s), mailto and tel links only; anything else becomes "#". */
function safeHref(value: string) {
  return /^(\/|#|https?:\/\/|mailto:|tel:)/i.test(value.trim()) ? value.trim() : "#";
}

export function FeatureGrid({ config = defaultConfig }: { config?: FeatureGridConfig }) {
  const id = useId();
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--fg-accent": config.accentColor,
    "--fg-accent-text": readableAccent(config.accentColor, dark),
    "--fg-surface": `var(--bc-${dark ? "dark" : "light"}-surface, ${palette.surface})`,
    "--fg-sunk": `var(--bc-${dark ? "dark" : "light"}-sunk, ${palette.sunk})`,
    "--fg-text": `var(--bc-${dark ? "dark" : "light"}-text, ${palette.text})`,
    "--fg-muted": `var(--bc-${dark ? "dark" : "light"}-muted, ${palette.muted})`,
    "--fg-line": `var(--bc-${dark ? "dark" : "light"}-line, ${palette.line})`,
  } as CSSProperties;

  const items = config.items.filter((item) => item.title.trim() !== "");
  const columns =
    config.columns === "four" ? "sm:grid-cols-2 lg:grid-cols-4" : config.columns === "three" ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2";

  return (
    <section style={style} aria-labelledby={`${id}-features-heading`} className="bg-(--fg-surface) text-(--fg-text)">
      <h2 id={`${id}-features-heading`} className="text-xl font-semibold">
        {config.heading}
      </h2>
      {config.intro.trim() !== "" && <p className="mt-1 max-w-prose text-(--fg-muted)">{config.intro}</p>}

      {/* A list, so a screen reader says how many features there are before reading them. */}
      <ul className={`mt-5 grid list-none gap-5 p-0 ${columns}`}>
        {items.map((item) => (
          <li key={item.title} className={config.showRule ? "border-t border-(--fg-line) pt-4" : ""}>
            {item.glyph.trim() !== "" && (
              // Decoration: the heading next to it carries the meaning.
              <p aria-hidden="true" className="text-lg text-(--fg-accent-text)">
                {item.glyph}
              </p>
            )}
            <h3 className="mt-1 font-medium">{item.title}</h3>
            <p className="mt-1 text-sm text-pretty text-(--fg-muted)">{item.text}</p>
            {item.href.trim() !== "" && (
              <a
                href={safeHref(item.href)}
                className="mt-2 inline-flex min-h-11 items-center rounded-[var(--bc-radius-xs,0.25rem)] text-sm font-medium text-(--fg-accent-text) underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--fg-accent-text)"
              >
                {config.linkText}
                {/* Six "Read more" links are useless in a list of links: name the feature. */}
                <span className="sr-only">{` about ${item.title.toLowerCase()}`}</span>
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
