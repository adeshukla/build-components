"use client";

import { useSyncExternalStore, type CSSProperties } from "react";

export type StepItem = { label: string; detail: string; href: string };

export type StepperConfig = {
  label: string;
  steps: StepItem[];
  current: number;
  orientation: "horizontal" | "vertical";
  marker: "number" | "dot";
  linkDone: boolean;
  summary: boolean;
  details: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: StepperConfig = {
  label: "Checkout",
  steps: [
    { label: "Basket", detail: "3 items", href: "/basket" },
    { label: "Delivery", detail: "Where it goes", href: "/delivery" },
    { label: "Payment", detail: "How you pay", href: "" },
    { label: "Confirm", detail: "Check and send", href: "" },
  ],
  current: 3,
  orientation: "horizontal",
  marker: "number",
  linkDone: true,
  summary: true,
  details: true,
  theme: "light",
  accentColor: "#2563eb",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", muted: "#4d4a57", line: "#d9d5e4", done: "#1a7f52" },
  dark: { surface: "#141019", text: "#f6f5fa", muted: "#b6b3c2", line: "#3a3448", done: "#6ddba4" },
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

/** Relative, fragment, http(s), mailto and tel links only. */
function safeHref(value: string) {
  return /^(\/|#|https?:\/\/|mailto:|tel:)/i.test(value.trim()) ? value.trim() : "#";
}

export function Stepper({ config = defaultConfig }: { config?: StepperConfig }) {
  const steps = config.steps.filter((step) => step.label.trim() !== "");
  const current = Math.min(Math.max(1, Math.round(config.current)), Math.max(1, steps.length));
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const accentLuminance = luminance(config.accentColor);
  const vertical = config.orientation === "vertical";

  const style = {
    "--st-accent": config.accentColor,
    "--st-accent-text": readableAccent(config.accentColor, dark),
    "--st-on-accent": accentLuminance > 0.179 ? "#000000" : "#ffffff",
    "--st-surface": palette.surface,
    "--st-text": palette.text,
    "--st-muted": palette.muted,
    "--st-line": palette.line,
    "--st-done": palette.done,
  } as CSSProperties;
  const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--st-accent-text)";

  if (steps.length === 0) return null;

  return (
    <nav aria-label={config.label} style={style} className="bg-(--st-surface) text-(--st-text)">
      {config.summary && (
        <p className="mb-3 text-sm text-(--st-muted)">
          Step {current} of {steps.length}: {steps[current - 1].label}
        </p>
      )}

      <ol className={`flex list-none gap-4 p-0 ${vertical ? "flex-col" : "flex-col sm:flex-row sm:items-start"}`}>
        {steps.map((step, index) => {
          const position = index + 1;
          const done = position < current;
          const isCurrent = position === current;
          const linked = done && config.linkDone && step.href.trim() !== "";

          const body = (
            <>
              <span
                aria-hidden="true"
                className={`grid size-8 shrink-0 place-items-center rounded-full border-2 text-sm font-semibold ${
                  done
                    ? "border-(--st-done) text-(--st-done)"
                    : isCurrent
                      ? "border-(--st-accent) bg-(--st-accent) text-(--st-on-accent)"
                      : "border-(--st-line) text-(--st-muted)"
                }`}
              >
                {done ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="size-4">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                ) : config.marker === "number" ? (
                  position
                ) : (
                  <span className="size-2 rounded-full bg-current" />
                )}
              </span>
              <span className="min-w-0">
                <span className={`block font-medium ${isCurrent ? "" : "text-(--st-muted)"}`}>
                  {step.label}
                  {/* Said in words, because the tick and the colour are not available to everyone. */}
                  <span className="sr-only">
                    {done ? " (completed)" : isCurrent ? " (current step)" : " (not started)"}
                  </span>
                </span>
                {config.details && step.detail.trim() !== "" && (
                  <span className="block text-sm text-(--st-muted)">{step.detail}</span>
                )}
              </span>
            </>
          );

          return (
            <li
              key={index}
              aria-current={isCurrent ? "step" : undefined}
              className={`flex min-w-0 flex-1 items-start gap-3 ${
                vertical ? "" : "sm:flex-col sm:items-start sm:gap-2"
              }`}
            >
              {linked ? (
                <a href={safeHref(step.href)} className={`flex min-w-0 items-start gap-3 no-underline ${focus}`}>
                  {body}
                </a>
              ) : (
                <span className="flex min-w-0 items-start gap-3">{body}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
