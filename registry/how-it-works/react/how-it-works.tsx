"use client";

import { useId, useSyncExternalStore, type CSSProperties } from "react";

export type HowItWorksConfig = {
  heading: string;
  intro: string;
  steps: { title: string; text: string; meta: string }[];
  layout: "across" | "down";
  showNumbers: boolean;
  showConnector: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: HowItWorksConfig = {
  heading: "How a refit works",
  intro: "Four steps, and you hear from us at each one.",
  steps: [
    { title: "Tell us what it needs", text: "A short form, or a phone call if that is easier. Photographs help.", meta: "10 minutes" },
    { title: "We look it over", text: "One of our engineers goes through it and asks anything that is unclear.", meta: "Two working days" },
    { title: "You get a written quote", text: "Itemised, with the parts we would use and what each stage costs.", meta: "By email" },
    { title: "Work starts when you say", text: "We book the berth and keep you posted every week until it is done.", meta: "Your call" },
  ],
  layout: "across",
  showNumbers: true,
  showConnector: true,
  theme: "light",
  accentColor: "#16303f",
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

export function HowItWorks({ config = defaultConfig }: { config?: HowItWorksConfig }) {
  const id = useId();
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--hw-accent": config.accentColor,
    "--hw-accent-text": readableAccent(config.accentColor, dark),
    "--hw-on-accent": luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff",
    "--hw-surface": `var(--bc-${dark ? "dark" : "light"}-surface, ${palette.surface})`,
    "--hw-sunk": `var(--bc-${dark ? "dark" : "light"}-sunk, ${palette.sunk})`,
    "--hw-text": `var(--bc-${dark ? "dark" : "light"}-text, ${palette.text})`,
    "--hw-muted": `var(--bc-${dark ? "dark" : "light"}-muted, ${palette.muted})`,
    "--hw-line": `var(--bc-${dark ? "dark" : "light"}-line, ${palette.line})`,
  } as CSSProperties;

  const steps = config.steps.filter((step) => step.title.trim() !== "");
  const across = config.layout === "across";

  return (
    <section style={style} aria-labelledby={`${id}-how-heading`} className="bg-(--hw-surface) text-(--hw-text)">
      <h2 id={`${id}-how-heading`} className="text-xl font-semibold">
        {config.heading}
      </h2>
      {config.intro.trim() !== "" && <p className="mt-1 max-w-prose text-(--hw-muted)">{config.intro}</p>}

      {/* An ordered list: the order is the whole point, so it lives in the markup, not in the numbers. */}
      <ol
        className={`mt-5 grid list-none gap-6 p-0 ${across ? "sm:grid-cols-2 lg:grid-cols-4" : ""}`}
      >
        {steps.map((step, index) => (
          <li key={step.title} className={across ? "" : "grid grid-cols-[auto_1fr] gap-x-4"}>
            <div className={across ? "flex items-center gap-3" : "flex flex-col items-center"}>
              {config.showNumbers && (
                // The number repeats what the list already says, for people reading it as a picture.
                <span
                  aria-hidden="true"
                  className="grid size-8 shrink-0 place-items-center rounded-full bg-(--hw-accent) text-sm font-semibold text-(--hw-on-accent)"
                >
                  {index + 1}
                </span>
              )}
              {config.showConnector && (
                <span
                  aria-hidden="true"
                  className={across ? "hidden h-px flex-1 bg-(--hw-line) sm:block" : "mt-1 w-px flex-1 bg-(--hw-line)"}
                />
              )}
            </div>
            <div className={across ? "mt-3" : "pb-2"}>
              <h3 className="font-medium">{step.title}</h3>
              <p className="mt-1 text-sm text-pretty text-(--hw-muted)">{step.text}</p>
              {step.meta.trim() !== "" && <p className="mt-1 font-mono text-xs text-(--hw-muted)">{step.meta}</p>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
