"use client";

import { useSyncExternalStore, type CSSProperties } from "react";

export type CtaConfig = {
  heading: string;
  body: string;
  primaryText: string;
  primaryHref: string;
  secondaryButton: boolean;
  secondaryText: string;
  secondaryHref: string;
  note: boolean;
  noteText: string;
  headingLevel: "h2" | "h3";
  layout: "centered" | "left";
  theme: "light" | "dark" | "system";
  accentColor: string;
  radius: number;
  spacing: "compact" | "regular" | "spacious";
};

// @config-start
const defaultConfig: CtaConfig = {
  heading: "Ready to start your project?",
  body: "Tell us what you need and we will come back to you within two working days.",
  primaryText: "Get in touch",
  primaryHref: "/contact",
  secondaryButton: true,
  secondaryText: "See our work",
  secondaryHref: "/work",
  note: false,
  noteText: "No commitment. We reply to every message.",
  headingLevel: "h2",
  layout: "centered",
  theme: "light",
  accentColor: "#2563eb",
  radius: 8,
  spacing: "regular",
};
// @config-end

const palettes = {
  light: { surface: "#f7f7fb", text: "#16121f", muted: "#4d4a57", border: "#6f6b7a" },
  dark: { surface: "#16161c", text: "#f6f5fa", muted: "#b6b3c2", border: "#8d8a99" },
};

const spacings = {
  compact: "px-6 py-10 sm:py-12",
  regular: "px-6 py-16 sm:py-20",
  spacious: "px-6 py-24 sm:py-32",
};

const darkMedia = {
  subscribe: (onChange: () => void) => {
    const list = window.matchMedia("(prefers-color-scheme: dark)");
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  },
  get: () => window.matchMedia("(prefers-color-scheme: dark)").matches,
};

// WCAG relative luminance, used to keep button text readable on any accent colour.
function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Relative, fragment, http(s), mailto and tel links only. */
function safeHref(value: string) {
  return /^(\/|#|https?:\/\/|mailto:|tel:)/i.test(value.trim()) ? value.trim() : "#";
}

export function Cta({ config = defaultConfig }: { config?: CtaConfig }) {
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const accentLuminance = luminance(config.accentColor);
  const centered = config.layout === "centered";
  const Heading = config.headingLevel;
  const style = {
    "--cta-accent": config.accentColor,
    "--cta-on-accent": accentLuminance > 0.179 ? "#000000" : "#ffffff",
    "--cta-ring": accentLuminance <= 0.35 || dark ? config.accentColor : palette.text,
    "--cta-radius": `${config.radius}px`,
    "--cta-surface": palette.surface,
    "--cta-text": palette.text,
    "--cta-muted": palette.muted,
    "--cta-border": palette.border,
  } as CSSProperties;
  const button =
    "inline-flex items-center justify-center rounded-(--cta-radius) px-5 py-3 font-semibold no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--cta-ring)";

  return (
    <section
      aria-labelledby="cta-heading"
      style={style}
      className={`bg-(--cta-surface) text-(--cta-text) ${spacings[config.spacing]}`}
    >
      <div className={`mx-auto max-w-3xl ${centered ? "text-center" : ""}`}>
        <Heading id="cta-heading" className="text-3xl font-bold text-balance sm:text-4xl">
          {config.heading}
        </Heading>
        {config.body !== "" && (
          <p className={`mt-4 text-lg text-pretty text-(--cta-muted) ${centered ? "mx-auto max-w-2xl" : "max-w-2xl"}`}>
            {config.body}
          </p>
        )}
        <div className={`mt-8 flex flex-wrap gap-3 ${centered ? "justify-center" : ""}`}>
          <a href={safeHref(config.primaryHref)} className={`${button} bg-(--cta-accent) text-(--cta-on-accent)`}>
            {config.primaryText}
          </a>
          {config.secondaryButton && (
            <a
              href={safeHref(config.secondaryHref)}
              className={`${button} border border-(--cta-border) text-(--cta-text)`}
            >
              {config.secondaryText}
            </a>
          )}
        </div>
        {config.note && config.noteText !== "" && (
          <p className="mt-4 text-sm text-(--cta-muted)">{config.noteText}</p>
        )}
      </div>
    </section>
  );
}
