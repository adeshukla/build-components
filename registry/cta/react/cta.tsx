"use client";

import { useSyncExternalStore, type CSSProperties } from "react";

export type CtaConfig = {
  eyebrow: string;
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
  layout: "centered" | "left" | "split";
  look: "plain" | "card" | "bold";
  theme: "light" | "dark" | "system";
  accentColor: string;
  radius: number;
  spacing: "compact" | "regular" | "spacious";
};

// @config-start
const defaultConfig: CtaConfig = {
  eyebrow: "Ready when you are",
  heading: "Build it once. Take the code with you.",
  body: "Set the options, test the exact files you will export, then drop them into your project. No library, no lock-in.",
  primaryText: "Get in touch",
  primaryHref: "/contact",
  secondaryButton: true,
  secondaryText: "See our work",
  secondaryHref: "/work",
  note: true,
  noteText: "No commitment. We reply to every message within two working days.",
  headingLevel: "h2",
  layout: "centered",
  look: "bold",
  theme: "light",
  accentColor: "#2563eb",
  radius: 14,
  spacing: "regular",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", border: "#d9d5e4" },
  dark: { surface: "#141019", sunk: "#1c1726", text: "#f6f5fa", muted: "#b6b3c2", border: "#3a3448" },
};

const spacings = {
  compact: "px-6 py-10 sm:px-10 sm:py-12",
  regular: "px-6 py-16 sm:px-12 sm:py-20",
  spacious: "px-6 py-24 sm:px-16 sm:py-28",
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

/** A darker shade of the accent, for the far end of the gradient on the bold look. */
function deepen(hex: string) {
  const channels = [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * 0.72));
  return `#${channels.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
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
  const onAccent = accentLuminance > 0.179 ? "#000000" : "#ffffff";
  const bold = config.look === "bold";
  const centered = config.layout === "centered";
  const split = config.layout === "split";
  const Heading = config.headingLevel;

  // On the bold look everything sits on the accent, so the text colours come from it instead.
  const style = {
    "--cta-accent": config.accentColor,
    "--cta-on-accent": onAccent,
    "--cta-accent-text": readableAccent(config.accentColor, dark),
    "--cta-deep": deepen(config.accentColor),
    "--cta-radius": `${config.radius}px`,
    "--cta-surface": bold ? config.accentColor : config.look === "card" ? palette.surface : palette.surface,
    "--cta-text": bold ? onAccent : palette.text,
    "--cta-muted": bold ? onAccent : palette.muted,
    "--cta-border": bold ? onAccent : palette.border,
    "--cta-outer": config.look === "card" ? palette.sunk : "transparent",
  } as CSSProperties;

  const button =
    "inline-flex items-center justify-center gap-2 rounded-(--cta-radius) px-6 py-3 font-semibold no-underline transition-[transform,box-shadow,background-color] duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2";

  return (
    <section
      aria-labelledby="cta-heading"
      style={style}
      className={`bg-(--cta-outer) ${config.look === "card" ? "p-4 sm:p-6" : ""}`}
    >
      <div
        className={`relative isolate overflow-hidden bg-(--cta-surface) text-(--cta-text) ${spacings[config.spacing]} ${
          config.look === "plain" ? "" : "rounded-(--cta-radius)"
        } ${bold ? "shadow-[0_24px_60px_-32px_rgb(0_0_0/0.65)]" : config.look === "card" ? "border border-(--cta-border)" : ""}`}
      >
        {bold && (
          <>
            {/* Depth without an image: a diagonal wash and one soft light behind the text. */}
            <span
              aria-hidden="true"
              className="absolute inset-0 -z-10"
              style={{ background: `linear-gradient(135deg, ${config.accentColor} 0%, ${deepen(config.accentColor)} 100%)` }}
            />
            <span
              aria-hidden="true"
              className="absolute -top-24 -right-16 -z-10 size-72 rounded-full opacity-25 blur-3xl"
              style={{ background: onAccent }}
            />
          </>
        )}

        <div
          className={`mx-auto flex w-full max-w-5xl gap-8 ${
            split ? "flex-col items-start lg:flex-row lg:items-center lg:justify-between" : "flex-col"
          } ${centered ? "items-center text-center" : "items-start"}`}
        >
          <div className={`max-w-2xl ${centered ? "mx-auto" : ""}`}>
            {config.eyebrow.trim() !== "" && (
              <p
                // Plain text, not a tinted pill: a tint under small text costs the contrast the
                // accent was corrected for, and this label is only 12px.
                className={`mb-3 flex items-center gap-2 text-xs font-semibold tracking-[0.12em] uppercase ${
                  bold ? "text-(--cta-on-accent)" : "text-(--cta-accent-text)"
                } ${centered ? "justify-center" : ""}`}
              >
                <span aria-hidden="true" className="inline-block h-px w-6 bg-current opacity-60" />
                {config.eyebrow}
              </p>
            )}
            <Heading
              id="cta-heading"
              className="text-3xl leading-[1.08] font-bold tracking-[-0.02em] text-balance sm:text-4xl lg:text-5xl"
            >
              {config.heading}
            </Heading>
            {config.body !== "" && (
              <p className={`mt-4 text-lg text-pretty ${bold ? "opacity-90" : "text-(--cta-muted)"}`}>{config.body}</p>
            )}
          </div>

          <div className={`flex flex-col gap-3 ${centered ? "items-center" : "items-start"} ${split ? "shrink-0" : ""}`}>
            <div className={`flex flex-wrap gap-3 ${centered ? "justify-center" : ""}`}>
              <a
                href={safeHref(config.primaryHref)}
                className={`${button} ${
                  bold
                    ? "bg-(--cta-on-accent) text-(--cta-accent) shadow-[0_10px_24px_-12px_rgb(0_0_0/0.6)] focus-visible:outline-(--cta-on-accent)"
                    : "bg-(--cta-accent) text-(--cta-on-accent) shadow-[0_10px_24px_-14px_var(--cta-accent)] focus-visible:outline-(--cta-accent-text)"
                }`}
              >
                {config.primaryText}
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </a>
              {config.secondaryButton && (
                <a
                  href={safeHref(config.secondaryHref)}
                  className={`${button} border border-(--cta-border) text-(--cta-text) ${
                    bold ? "hover:bg-(--cta-on-accent)/10 focus-visible:outline-(--cta-on-accent)" : "hover:bg-(--cta-accent)/5 focus-visible:outline-(--cta-accent-text)"
                  }`}
                >
                  {config.secondaryText}
                </a>
              )}
            </div>
            {config.note && config.noteText !== "" && (
              <p className={`text-sm ${bold ? "opacity-80" : "text-(--cta-muted)"}`}>{config.noteText}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
