"use client";

import { useId, useSyncExternalStore, type CSSProperties } from "react";

export type ImageGalleryConfig = {
  heading: string;
  items: { src: string; alt: string; caption: string }[];
  columns: number;
  aspect: "4-3" | "1-1" | "16-9";
  showCaptions: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: ImageGalleryConfig = {
  heading: "Workshop, September",
  items: [
    { src: "", alt: "A bench covered in stripped-down keyboards, mid-repair.", caption: "Twelve keyboards, four working." },
    { src: "", alt: "", caption: "The parts drawer, finally labelled." },
    { src: "", alt: "A whiteboard of arrows between six boxes, none of them labelled.", caption: "The plan, such as it was." },
    { src: "", alt: "", caption: "Solder station at the end of a long day." },
  ],
  columns: 2,
  aspect: "4-3",
  showCaptions: true,
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
function safeSrc(src: string) {
  if (src.startsWith("/")) return src;
  try {
    const url = new URL(src, "https://example.com");
    return url.protocol === "http:" || url.protocol === "https:" ? src : "";
  } catch {
    return "";
  }
}

export function ImageGallery({ config = defaultConfig }: { config?: ImageGalleryConfig }) {
  const id = useId();
  const headingId = `${id}-gal-heading`;
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--gal-accent": config.accentColor,
    "--gal-accent-text": readableAccent(config.accentColor, dark),
    "--gal-surface": `var(--bc-${dark ? "dark" : "light"}-surface, ${palette.surface})`,
    "--gal-sunk": `var(--bc-${dark ? "dark" : "light"}-sunk, ${palette.sunk})`,
    "--gal-text": `var(--bc-${dark ? "dark" : "light"}-text, ${palette.text})`,
    "--gal-muted": `var(--bc-${dark ? "dark" : "light"}-muted, ${palette.muted})`,
    "--gal-line": `var(--bc-${dark ? "dark" : "light"}-line, ${palette.line})`,
  } as CSSProperties;

  return (
    <div style={style} className="bg-(--gal-surface) p-1 text-(--gal-text)">
      <h2 id={headingId} className="text-xl font-semibold">
        {config.heading}
      </h2>

      {/* A list of figures, so a screen reader counts the pictures and can move between them. */}
      <ul
        aria-labelledby={headingId}
        className="mt-4 grid list-none gap-4 p-0"
        style={{ gridTemplateColumns: `repeat(${Math.max(config.columns, 1)}, minmax(0, 1fr))` }}
      >
        {config.items.map((item, index) => {
          const src = safeSrc(item.src);
          const described = item.alt.trim() !== "";
          return (
            <li key={`${item.caption}-${index}`}>
              <figure className="m-0">
                {src === "" ? (
                  // No image set. A drawn placeholder rather than a stock photograph, and it says so
                  // rather than pretending: set src to your own file.
                  <div
                    role={described ? "img" : undefined}
                    aria-label={described ? item.alt : undefined}
                    aria-hidden={described ? undefined : true}
                    className="grid w-full place-items-center rounded-[var(--bc-radius-md,0.5rem)] border border-(--gal-line) bg-(--gal-sunk) p-2 text-center font-mono text-xs text-(--gal-muted)"
                    style={{
                      aspectRatio: ratios[config.aspect],
                      backgroundImage:
                        "repeating-linear-gradient(135deg, color-mix(in oklab, var(--gal-accent) 18%, transparent) 0 12px, transparent 12px 24px)",
                    }}
                  >
                    [TODO: set src]
                  </div>
                ) : (
                  // The ratio is set in CSS so the space is reserved before the file arrives: no layout
                  // shift, and the caption does not jump down the page.
                  // eslint-disable-next-line @next/next/no-img-element -- this file is exported for any project, so it must not depend on next/image.
                  <img
                    src={src}
                    alt={item.alt}
                    loading="lazy"
                    decoding="async"
                    className="w-full rounded-[var(--bc-radius-md,0.5rem)] border border-(--gal-line) bg-(--gal-sunk) object-cover"
                    style={{ aspectRatio: ratios[config.aspect] }}
                  />
                )}
                {config.showCaptions && item.caption.trim() !== "" && (
                  // A caption is not alt text. It says something about the picture; alt says what the
                  // picture is, for someone who cannot see it.
                  <figcaption className="mt-2 text-sm text-(--gal-muted)">{item.caption}</figcaption>
                )}
              </figure>
            </li>
          );
        })}
      </ul>

      <p data-demo className="mt-4 text-xs text-(--gal-muted)">
        No pictures ship with this part. Set each item&apos;s src, and write alt for the ones that carry
        meaning — leave it empty for the ones that are decoration.
      </p>
    </div>
  );
}
