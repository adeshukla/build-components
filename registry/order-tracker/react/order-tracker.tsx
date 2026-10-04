"use client";

import { useSyncExternalStore, type CSSProperties } from "react";

export type OrderTrackerConfig = {
  heading: string;
  reference: string;
  steps: { label: string; detail: string; date: string }[];
  currentStep: number;
  doneWord: string;
  currentWord: string;
  todoWord: string;
  layout: "vertical" | "horizontal";
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: OrderTrackerConfig = {
  heading: "Where your order is",
  reference: "Order 4812-A",
  steps: [
    { label: "Ordered", detail: "Payment taken in full.", date: "2026-09-24" },
    { label: "Packed", detail: "Two parcels, packed together.", date: "2026-09-25" },
    { label: "With the courier", detail: "Picked up from the warehouse in Reading.", date: "2026-09-26" },
    { label: "Out for delivery", detail: "Expected between 09:00 and 13:00.", date: "2026-09-28" },
    { label: "Delivered", detail: "Signature needed at the door.", date: "" },
  ],
  currentStep: 4,
  doneWord: "Done",
  currentWord: "Happening now",
  todoWord: "Still to come",
  layout: "vertical",
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

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Written out by hand: Intl gives the server and the browser different strings. */
export function sayDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return "";
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

export function OrderTracker({ config = defaultConfig }: { config?: OrderTrackerConfig }) {
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--ord-accent": config.accentColor,
    "--ord-accent-text": readableAccent(config.accentColor, dark),
    "--ord-on-accent": luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff",
    "--ord-surface": `var(--bc-${dark ? "dark" : "light"}-surface, ${palette.surface})`,
    "--ord-sunk": `var(--bc-${dark ? "dark" : "light"}-sunk, ${palette.sunk})`,
    "--ord-text": `var(--bc-${dark ? "dark" : "light"}-text, ${palette.text})`,
    "--ord-muted": `var(--bc-${dark ? "dark" : "light"}-muted, ${palette.muted})`,
    "--ord-line": `var(--bc-${dark ? "dark" : "light"}-line, ${palette.line})`,
  } as CSSProperties;

  const at = Math.min(Math.max(config.currentStep, 1), config.steps.length);
  const now = config.steps[at - 1];

  return (
    <div style={style} className="bg-(--ord-surface) p-1 text-(--ord-text)">
      <h2 className="text-xl font-semibold">{config.heading}</h2>
      <p className="mt-0.5 font-mono text-sm text-(--ord-muted)">{config.reference}</p>

      {/*
        Where the order is, in one sentence, before the list. It is the answer most people came for, and
        it is the only part a screen reader has to hear to get it.
      */}
      <p className="mt-3 font-medium">
        {now === undefined ? "" : `${config.currentWord}: ${now.label}.`}
        {now?.detail === undefined || now.detail === "" ? "" : ` ${now.detail}`}
      </p>

      <ol
        data-layout={config.layout}
        className={`mt-5 list-none p-0 ${
          config.layout === "horizontal" ? "flex flex-wrap gap-y-6" : ""
        }`}
      >
        {config.steps.map((step, index) => {
          const state = index + 1 < at ? "done" : index + 1 === at ? "current" : "todo";
          const word = state === "done" ? config.doneWord : state === "current" ? config.currentWord : config.todoWord;
          return (
            <li
              key={step.label}
              data-state={state}
              // aria-current="step" is the one the APG uses for a position in a sequence.
              aria-current={state === "current" ? "step" : undefined}
              className={`relative ${
                config.layout === "horizontal"
                  ? "min-w-40 flex-1 pe-4"
                  : "border-s-2 pb-6 ps-6 last:border-s-0 last:pb-0"
              } ${state === "todo" ? "border-(--ord-line)" : "border-(--ord-accent)"}`}
            >
              {/* The marker is a picture of the state the words already give, so it is hidden. */}
              <span
                aria-hidden="true"
                className={`absolute grid size-5 place-items-center rounded-full border-2 text-[0.6rem] font-bold ${
                  config.layout === "horizontal" ? "top-0 start-0" : "top-0 -start-[0.7rem]"
                } ${
                  state === "todo"
                    ? "border-(--ord-line) bg-(--ord-surface) text-transparent"
                    : "border-(--ord-accent) bg-(--ord-accent) text-(--ord-on-accent)"
                }`}
              >
                {state === "done" ? "✓" : ""}
              </span>
              <div className={config.layout === "horizontal" ? "pt-7" : ""}>
                <p className={`m-0 ${state === "current" ? "font-semibold" : "font-medium"}`}>{step.label}</p>
                {/* The state is a word next to the step, never the tick or the colour alone. */}
                <p className="mt-0.5 text-xs font-semibold tracking-wide text-(--ord-muted) uppercase">{word}</p>
                {step.detail !== "" && <p className="mt-1 text-sm text-(--ord-muted)">{step.detail}</p>}
                {step.date !== "" && (
                  <p className="mt-1 text-sm text-(--ord-muted)">
                    <time dateTime={step.date}>{sayDate(step.date)}</time>
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
