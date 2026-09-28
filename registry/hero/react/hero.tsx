"use client";

import { useId, useSyncExternalStore, type CSSProperties } from "react";

export type HeroConfig = {
  eyebrow: string;
  heading: string;
  headingLevel: "h1" | "h2";
  copy: string;
  primaryText: string;
  primaryHref: string;
  secondaryText: string;
  secondaryHref: string;
  note: string;
  align: "left" | "centre";
  showPanel: boolean;
  panelLabel: string;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: HeroConfig = {
  eyebrow: "Refit yard, Falmouth",
  heading: "Get your boat ready before the season starts",
  headingLevel: "h1",
  copy: "Rigging, engines, hulls and electronics under one roof. Tell us what it needs and we will send a written quote within two working days.",
  primaryText: "Ask for a quote",
  primaryHref: "/quote",
  secondaryText: "See the yard",
  secondaryHref: "/yard",
  note: "No deposit until the work is agreed.",
  align: "left",
  showPanel: true,
  panelLabel: "Photograph of the yard goes here",
  theme: "light",
  accentColor: "#16303f",
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

export function Hero({ config = defaultConfig }: { config?: HeroConfig }) {
  const id = useId();
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--hr-accent": config.accentColor,
    "--hr-accent-text": readableAccent(config.accentColor, dark),
    "--hr-on-accent": luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff",
    "--hr-surface": palette.surface,
    "--hr-sunk": palette.sunk,
    "--hr-text": palette.text,
    "--hr-muted": palette.muted,
    "--hr-line": palette.line,
  } as CSSProperties;

  const Heading = config.headingLevel;
  const centred = config.align === "centre";

  return (
    <section
      style={style}
      aria-labelledby={`${id}-hero-heading`}
      className="bg-(--hr-surface) px-4 py-10 text-(--hr-text) sm:px-6 sm:py-14"
    >
      <div className={`mx-auto grid max-w-5xl items-center gap-8 ${config.showPanel && !centred ? "sm:grid-cols-2" : ""}`}>
        <div className={centred ? "mx-auto max-w-2xl text-center" : ""}>
          {config.eyebrow.trim() !== "" && (
            // Above the heading, but not a heading itself: a fake one would break the page outline.
            <p className="font-mono text-xs tracking-wide text-(--hr-muted) uppercase">{config.eyebrow}</p>
          )}
          <Heading id={`${id}-hero-heading`} className="mt-2 text-3xl leading-tight font-bold text-balance sm:text-4xl">
            {config.heading}
          </Heading>
          {config.copy.trim() !== "" && <p className="mt-3 max-w-prose text-pretty text-(--hr-muted)">{config.copy}</p>}

          <div className={`mt-6 flex flex-wrap gap-3 ${centred ? "justify-center" : ""}`}>
            {config.primaryText.trim() !== "" && (
              <a
                href={safeHref(config.primaryHref)}
                className="inline-flex min-h-11 items-center rounded-md bg-(--hr-accent) px-5 font-medium text-(--hr-on-accent) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--hr-accent-text)"
              >
                {config.primaryText}
              </a>
            )}
            {config.secondaryText.trim() !== "" && (
              <a
                href={safeHref(config.secondaryHref)}
                className="inline-flex min-h-11 items-center rounded-md border border-(--hr-line) px-5 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--hr-accent-text)"
              >
                {config.secondaryText}
              </a>
            )}
          </div>

          {config.note.trim() !== "" && <p className="mt-3 text-sm text-(--hr-muted)">{config.note}</p>}
        </div>

        {config.showPanel && !centred && (
          // A place for a picture, drawn rather than loaded: the exported file carries no image of ours.
          <div
            role="img"
            aria-label={config.panelLabel}
            className="aspect-[4/3] rounded-xl border border-(--hr-line) bg-(--hr-sunk) bg-[repeating-linear-gradient(135deg,transparent_0_18px,rgb(0_0_0/0.04)_18px_36px)]"
          />
        )}
      </div>
    </section>
  );
}
