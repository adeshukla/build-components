"use client";

import { useId, useSyncExternalStore, type CSSProperties } from "react";

export type SplitFeatureConfig = {
  heading: string;
  headingLevel: "h2" | "h3";
  body: string;
  points: { text: string }[];
  linkLabel: string;
  linkHref: string;
  mediaSide: "left" | "right";
  mediaSrc: string;
  mediaAlt: string;
  aspect: "4-3" | "1-1" | "16-9";
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: SplitFeatureConfig = {
  heading: "Test the file you are going to ship",
  headingLevel: "h2",
  body: "The preview runs the exported code, not a mock-up of it. Change an option and the thing you will copy changes with it.",
  points: [
    { text: "The same tests run on the React file and the plain HTML, CSS and JavaScript." },
    { text: "Keyboard paths and axe checks, with the component open and closed." },
    { text: "Chromium, WebKit and an emulated iPhone, every time." },
  ],
  linkLabel: "See how it is tested",
  linkHref: "https://build-components.devstash.me/accessibility",
  mediaSide: "right",
  mediaSrc: "",
  mediaAlt: "",
  aspect: "4-3",
  theme: "light",
  accentColor: "#0f766e",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#eceaf3", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#141019", sunk: "#272031", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
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

const ratios = { "4-3": "4 / 3", "1-1": "1 / 1", "16-9": "16 / 9" };

/** Only http(s) and same-site paths are let through: a config value must never become a javascript: URL. */
function safeUrl(value: string) {
  if (value.startsWith("/") || value.startsWith("#")) return value;
  try {
    const url = new URL(value, "https://example.com");
    return url.protocol === "http:" || url.protocol === "https:" ? value : "";
  } catch {
    return "";
  }
}

export function SplitFeature({ config = defaultConfig }: { config?: SplitFeatureConfig }) {
  const id = useId();
  const headingId = `${id}-spl-heading`;
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--spl-accent": config.accentColor,
    "--spl-accent-text": readableAccent(config.accentColor, dark),
    "--spl-surface": `var(--bc-${dark ? "dark" : "light"}-surface, ${palette.surface})`,
    "--spl-sunk": `var(--bc-${dark ? "dark" : "light"}-sunk, ${palette.sunk})`,
    "--spl-text": `var(--bc-${dark ? "dark" : "light"}-text, ${palette.text})`,
    "--spl-muted": `var(--bc-${dark ? "dark" : "light"}-muted, ${palette.muted})`,
    "--spl-line": `var(--bc-${dark ? "dark" : "light"}-line, ${palette.line})`,
  } as CSSProperties;

  const Heading = config.headingLevel;
  const src = safeUrl(config.mediaSrc);
  const described = config.mediaAlt.trim() !== "";
  const link = safeUrl(config.linkHref);

  return (
    <div style={style} className="bg-(--spl-surface) p-1 text-(--spl-text)">
      <section aria-labelledby={headingId} className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
        {/*
          The words come first in the source whichever side the picture is on. Only the column placement
          changes, so the reading order never depends on the layout.
        */}
        <div className={config.mediaSide === "left" ? "md:col-start-2 md:row-start-1" : ""}>
          <Heading id={headingId} className="text-2xl font-semibold text-balance sm:text-3xl">
            {config.heading}
          </Heading>
          <p className="mt-3 max-w-prose text-pretty text-(--spl-muted)">{config.body}</p>

          {config.points.length > 0 && (
            <ul className="mt-5 grid list-none gap-2 p-0">
              {config.points.map((point) => (
                <li key={point.text} className="flex gap-3">
                  {/* The tick is decoration: it is a list, and a screen reader says so. */}
                  <svg aria-hidden="true" viewBox="0 0 20 20" className="mt-1 size-4 shrink-0 fill-(--spl-accent-text)">
                    <path d="M7.6 14.2 3.4 10l1.4-1.4 2.8 2.8 7-7L16 5.8z" />
                  </svg>
                  <span>{point.text}</span>
                </li>
              ))}
            </ul>
          )}

          {config.linkLabel.trim() !== "" && link !== "" && (
            <p className="mt-6">
              <a
                href={link}
                className="inline-flex min-h-11 items-center font-medium text-(--spl-accent-text) underline decoration-2 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--spl-accent-text)"
              >
                {config.linkLabel}
              </a>
            </p>
          )}
        </div>

        <div className={config.mediaSide === "left" ? "md:col-start-1 md:row-start-1" : ""}>
          {src === "" ? (
            // No image ships with this part. A drawn panel, and it says so rather than pretending.
            <div
              role={described ? "img" : undefined}
              aria-label={described ? config.mediaAlt : undefined}
              aria-hidden={described ? undefined : true}
              data-media
              className="grid w-full place-items-center rounded-[var(--bc-radius-lg,0.75rem)] border border-(--spl-line) bg-(--spl-sunk) p-3 text-center font-mono text-xs text-(--spl-muted)"
              style={{
                aspectRatio: ratios[config.aspect],
                backgroundImage:
                  "repeating-linear-gradient(135deg, color-mix(in oklab, var(--spl-accent) 18%, transparent) 0 14px, transparent 14px 28px)",
              }}
            >
              [TODO: set mediaSrc]
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- this file is exported for any project, so it must not depend on next/image.
            <img
              src={src}
              alt={config.mediaAlt}
              loading="lazy"
              decoding="async"
              data-media
              className="w-full rounded-[var(--bc-radius-lg,0.75rem)] border border-(--spl-line) bg-(--spl-sunk) object-cover"
              style={{ aspectRatio: ratios[config.aspect] }}
            />
          )}
        </div>
      </section>
    </div>
  );
}
