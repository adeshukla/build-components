"use client";

import { useId, useSyncExternalStore, type CSSProperties } from "react";

export type TestimonialItem = { quote: string; name: string; role: string };
export type TestimonialsConfig = {
  heading: string;
  headingLevel: "h2" | "h3";
  intro: string;
  items: TestimonialItem[];
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: TestimonialsConfig = {
  heading: "What people say",
  headingLevel: "h2",
  intro: "",
  // Nobody is invented: each quote is a place for a real one, used with permission.
  items: [
    { quote: "[TODO: a customer's own words, used with their permission]", name: "[TODO: their name]", role: "[TODO: their role and company]" },
    { quote: "[TODO: a second customer's words]", name: "[TODO: their name]", role: "[TODO: their role and company]" },
    { quote: "[TODO: a third customer's words]", name: "[TODO: their name]", role: "[TODO: their role and company]" },
  ],
  theme: "light",
  accentColor: "#2563eb",
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

export function Testimonials({ config = defaultConfig }: { config?: TestimonialsConfig }) {
  const id = useId();
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const Heading = config.headingLevel;
  const items = config.items.filter((item) => item.quote.trim() !== "");
  const style = {
    "--tm-accent-text": readableAccent(config.accentColor, dark),
    "--tm-surface": `var(--bc-${dark ? "dark" : "light"}-surface, ${palette.surface})`,
    "--tm-sunk": `var(--bc-${dark ? "dark" : "light"}-sunk, ${palette.sunk})`,
    "--tm-text": `var(--bc-${dark ? "dark" : "light"}-text, ${palette.text})`,
    "--tm-muted": `var(--bc-${dark ? "dark" : "light"}-muted, ${palette.muted})`,
    "--tm-line": `var(--bc-${dark ? "dark" : "light"}-line, ${palette.line})`,
  } as CSSProperties;

  return (
    <section aria-labelledby={`${id}-heading`} style={style} className="bg-(--tm-surface) text-(--tm-text)">
      <Heading id={`${id}-heading`} className="text-3xl font-bold tracking-tight text-balance">
        {config.heading}
      </Heading>
      {config.intro.trim() !== "" && <p className="mt-3 max-w-2xl text-lg text-(--tm-muted)">{config.intro}</p>}
      <ul className="mt-8 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <li key={index} className="min-w-0">
            <figure className="m-0 flex h-full flex-col rounded-[var(--bc-radius-lg,0.75rem)] border border-(--tm-line) bg-(--tm-sunk) p-6">
              {/* The opening mark is decoration: the blockquote already says it is a quotation. */}
              <span aria-hidden="true" className="font-serif text-5xl leading-none text-(--tm-accent-text)">
                “
              </span>
              <blockquote className="m-0 mt-2 flex-1 text-lg text-pretty">{item.quote}</blockquote>
              {(item.name.trim() !== "" || item.role.trim() !== "") && (
                <figcaption className="mt-5 text-sm">
                  {item.name.trim() !== "" && <span className="block font-semibold">{item.name}</span>}
                  {item.role.trim() !== "" && <span className="block text-(--tm-muted)">{item.role}</span>}
                </figcaption>
              )}
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
