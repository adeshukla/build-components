"use client";

import { useId, useSyncExternalStore, type CSSProperties } from "react";

export type ProductItem = { name: string; price: string; href: string; image: string; alt: string; note: string };
export type ProductGridConfig = {
  heading: string;
  headingLevel: "h2" | "h3";
  intro: string;
  products: ProductItem[];
  columns: "2" | "3" | "4";
  shape: "square" | "portrait" | "landscape";
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: ProductGridConfig = {
  heading: "New in",
  headingLevel: "h2",
  intro: "",
  products: [
    { name: "Deck jacket", price: "£128", href: "/shop/deck-jacket", image: "", alt: "", note: "New" },
    { name: "Harbour jumper", price: "£86", href: "/shop/harbour-jumper", image: "", alt: "", note: "" },
    { name: "Canvas tote", price: "£34", href: "/shop/canvas-tote", image: "", alt: "", note: "" },
    { name: "Wool beanie", price: "£22", href: "/shop/wool-beanie", image: "", alt: "", note: "Last few" },
  ],
  columns: "4",
  shape: "square",
  theme: "light",
  accentColor: "#16303f",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#d9d5e4" },
  dark: { surface: "#141019", sunk: "#1c1726", text: "#f6f5fa", muted: "#b6b3c2", line: "#3a3448" },
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

/** A picture's address, if it is one a page can show: a web address or a path on the site. */
const pictureSrc = (value: string) => (/^(\/[^/]|https?:\/\/)/i.test(value.trim()) ? value.trim() : "");

const shapes = { square: "aspect-square", portrait: "aspect-[3/4]", landscape: "aspect-[4/3]" };
const columns = { "2": "sm:grid-cols-2", "3": "sm:grid-cols-2 lg:grid-cols-3", "4": "sm:grid-cols-2 lg:grid-cols-4" };

export function ProductGrid({ config = defaultConfig }: { config?: ProductGridConfig }) {
  const id = useId();
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const Heading = config.headingLevel;
  // Each product's name sits one level under the section's heading.
  const Name = config.headingLevel === "h2" ? "h3" : "h4";
  const products = config.products.filter((product) => product.name.trim() !== "");
  const style = {
    "--pg-accent-text": readableAccent(config.accentColor, dark),
    "--pg-surface": `var(--bc-${dark ? "dark" : "light"}-surface, ${palette.surface})`,
    "--pg-sunk": `var(--bc-${dark ? "dark" : "light"}-sunk, ${palette.sunk})`,
    "--pg-text": `var(--bc-${dark ? "dark" : "light"}-text, ${palette.text})`,
    "--pg-muted": `var(--bc-${dark ? "dark" : "light"}-muted, ${palette.muted})`,
    "--pg-line": `var(--bc-${dark ? "dark" : "light"}-line, ${palette.line})`,
  } as CSSProperties;

  return (
    <section aria-labelledby={`${id}-heading`} style={style} className="bg-(--pg-surface) text-(--pg-text)">
      <Heading id={`${id}-heading`} className="text-3xl font-bold tracking-tight text-balance">
        {config.heading}
      </Heading>
      {config.intro.trim() !== "" && <p className="mt-3 max-w-2xl text-lg text-(--pg-muted)">{config.intro}</p>}
      <ul className={`mt-8 grid list-none gap-x-4 gap-y-8 p-0 ${columns[config.columns]}`}>
        {products.map((product, index) => {
          const src = pictureSrc(product.image);
          return (
            <li key={index} className="min-w-0">
              {/* The name comes first for a screen reader; the picture is drawn above it. */}
              <article className="relative flex h-full flex-col">
                <Name className="m-0 mt-3 text-lg leading-snug font-semibold text-pretty">
                  {/* The whole card is the link's target, through a stretched ::after; the name is its name. */}
                  <a
                    href={safeHref(product.href)}
                    className="text-(--pg-text) no-underline after:absolute after:inset-0 hover:text-(--pg-accent-text) hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--pg-accent-text)"
                  >
                    {product.name}
                  </a>
                </Name>
                <p className="m-0 mt-1 flex flex-wrap items-center gap-2">
                  <span className="font-medium">{product.price}</span>
                  {product.note.trim() !== "" && (
                    <>
                      {" "}
                      <span className="rounded-full border border-current px-2 text-xs font-semibold text-(--pg-accent-text)">{product.note}</span>
                    </>
                  )}
                </p>
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element -- a plain image works in any React app, not only Next.js.
                  <img
                    src={src}
                    alt={product.alt}
                    loading="lazy"
                    decoding="async"
                    className={`order-first w-full rounded-[var(--bc-radius-lg,0.75rem)] bg-(--pg-sunk) object-cover ${shapes[config.shape]}`}
                  />
                ) : (
                  <div aria-hidden="true" className={`order-first w-full rounded-[var(--bc-radius-lg,0.75rem)] border border-(--pg-line) bg-(--pg-sunk) ${shapes[config.shape]}`} />
                )}
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
