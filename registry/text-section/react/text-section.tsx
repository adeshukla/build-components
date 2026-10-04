"use client";

import { useId, useSyncExternalStore, type CSSProperties } from "react";

export type TextSectionConfig = {
  eyebrow: string;
  heading: string;
  headingLevel: "h2" | "h3";
  body: string;
  linkText: string;
  linkHref: string;
  align: "left" | "centre";
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: TextSectionConfig = {
  eyebrow: "Why we built it",
  heading: "Every project in one place",
  headingLevel: "h2",
  body: "Small teams lose hours asking where things are. The latest file is in someone's inbox, the decision was in a meeting, and the task list lives in a spreadsheet nobody opens.\n\nNorthwind keeps the work, the files and the decisions together, so the answer is always one click away.",
  linkText: "Read how it works",
  linkHref: "/how-it-works",
  align: "left",
  theme: "light",
  accentColor: "#2563eb",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", muted: "#4d4a57" },
  dark: { surface: "#141019", text: "#f6f5fa", muted: "#b6b3c2" },
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

/** Relative, fragment, http(s), mailto and tel links only. */
function safeHref(value: string) {
  return /^(\/|#|https?:\/\/|mailto:|tel:)/i.test(value.trim()) ? value.trim() : "#";
}

/** Paragraphs are separated by a blank line; a single line break stays inside its paragraph. */
export function paragraphsOf(body: string) {
  return body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function TextSection({ config = defaultConfig }: { config?: TextSectionConfig }) {
  const id = useId();
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const Heading = config.headingLevel;
  const centred = config.align === "centre";
  const style = {
    "--tx-accent-text": readableAccent(config.accentColor, dark),
    "--tx-surface": `var(--bc-${dark ? "dark" : "light"}-surface, ${palette.surface})`,
    "--tx-text": `var(--bc-${dark ? "dark" : "light"}-text, ${palette.text})`,
    "--tx-muted": `var(--bc-${dark ? "dark" : "light"}-muted, ${palette.muted})`,
  } as CSSProperties;

  return (
    <section aria-labelledby={`${id}-heading`} style={style} className="bg-(--tx-surface) text-(--tx-text)">
      {/* A reading width: about 65 characters a line. */}
      <div className={`max-w-[65ch] ${centred ? "mx-auto text-center" : ""}`}>
        {config.eyebrow.trim() !== "" && (
          <p className="mb-3 text-sm font-semibold tracking-[0.08em] text-(--tx-accent-text) uppercase">{config.eyebrow}</p>
        )}
        <Heading id={`${id}-heading`} className="text-3xl leading-tight font-bold tracking-tight text-balance sm:text-4xl">
          {config.heading}
        </Heading>
        {paragraphsOf(config.body).map((paragraph, index) => (
          <p key={index} className="mt-4 text-lg leading-relaxed text-pretty whitespace-pre-line text-(--tx-muted)">
            {paragraph}
          </p>
        ))}
        {config.linkText.trim() !== "" && (
          <p className="mt-6">
            <a
              href={safeHref(config.linkHref)}
              className="inline-flex min-h-11 items-center font-semibold text-(--tx-accent-text) underline underline-offset-4 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--tx-accent-text)"
            >
              {config.linkText}
            </a>
          </p>
        )}
      </div>
    </section>
  );
}
