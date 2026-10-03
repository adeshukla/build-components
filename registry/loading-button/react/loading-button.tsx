"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export type LoadingButtonConfig = {
  idleLabel: string;
  busyLabel: string;
  doneText: string;
  errorText: string;
  retryLabel: string;
  demoMs: number;
  demoOutcome: "saves" | "fails";
  showSpinner: boolean;
  fullWidth: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: LoadingButtonConfig = {
  idleLabel: "Save changes",
  busyLabel: "Saving…",
  doneText: "Changes saved.",
  errorText: "Could not save. Nothing was changed.",
  retryLabel: "Try saving again",
  demoMs: 1200,
  demoOutcome: "saves",
  showSpinner: true,
  fullWidth: false,
  theme: "light",
  accentColor: "#0f766e",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6", error: "#b42318" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459", error: "#ff9d95" },
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

type Phase = "idle" | "busy" | "done" | "error";

export function LoadingButton({
  config = defaultConfig,
  onRun,
}: {
  config?: LoadingButtonConfig;
  /** Replace this with your own request. It has to reject for the failure path to show. */
  onRun?: () => Promise<void>;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--lbn-accent": config.accentColor,
    "--lbn-accent-text": readableAccent(config.accentColor, dark),
    "--lbn-on-accent": luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff",
    "--lbn-surface": `var(--bc-${dark ? "dark" : "light"}-surface, ${palette.surface})`,
    "--lbn-sunk": `var(--bc-${dark ? "dark" : "light"}-sunk, ${palette.sunk})`,
    "--lbn-text": `var(--bc-${dark ? "dark" : "light"}-text, ${palette.text})`,
    "--lbn-muted": `var(--bc-${dark ? "dark" : "light"}-muted, ${palette.muted})`,
    "--lbn-line": `var(--bc-${dark ? "dark" : "light"}-line, ${palette.line})`,
    "--lbn-error": palette.error,
  } as CSSProperties;

  useEffect(() => () => clearTimeout(timer.current), []);

  const run = () => {
    // A second press while it is working must not send a second request. Ignoring the click is the
    // guard; the button stays focusable so its state can still be read.
    if (phase === "busy") return;
    setPhase("busy");
    const work =
      onRun ??
      (() =>
        new Promise<void>((resolve, reject) => {
          timer.current = setTimeout(
            () => (config.demoOutcome === "fails" ? reject(new Error("demo")) : resolve()),
            config.demoMs,
          );
        }));
    work().then(
      () => setPhase("done"),
      () => setPhase("error"),
    );
  };

  const busy = phase === "busy";
  const label = busy ? config.busyLabel : phase === "error" ? config.retryLabel : config.idleLabel;

  return (
    <div style={style} className="bg-(--lbn-surface) text-(--lbn-text)">
      {/* React 19 hoists this into the head and keeps one copy, however many buttons are on the page. */}
      <style href="lbn-spin" precedence="default">{`
        @keyframes lbn-spin { to { transform: rotate(1turn); } }
        .lbn-spin { animation: lbn-spin 0.8s linear infinite; }
        /* A spinning mark is motion with no information in it, so it stops and simply sits there. */
        @media (prefers-reduced-motion: reduce) { .lbn-spin { animation: none; } }
      `}</style>

      <button
        type="button"
        onClick={run}
        // aria-busy says it is working; aria-disabled says the press will do nothing. Neither takes the
        // button out of the tab order, which the disabled attribute would — along with the focus on it.
        aria-busy={busy || undefined}
        aria-disabled={busy || undefined}
        data-phase={phase}
        className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--bc-radius-button,0.375rem)] bg-(--lbn-accent) px-5 font-medium text-(--lbn-on-accent) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--lbn-accent-text) ${
          config.fullWidth ? "w-full" : ""
        } ${busy ? "opacity-80" : ""}`}
        // The widest label sets the width, so the button does not jump as the words change.
        style={{ minWidth: `${Math.max(config.idleLabel.length, config.busyLabel.length, config.retryLabel.length) * 0.62 + 3}rem` }}
      >
        {config.showSpinner && busy && (
          <svg aria-hidden="true" data-spinner viewBox="0 0 16 16" className="lbn-spin size-4 shrink-0">
            <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.35" />
            <path d="M8 1.5a6.5 6.5 0 0 1 6.5 6.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
        {label}
      </button>

      {/* The outcome is words in a polite region: a button that has stopped spinning is not a message. */}
      <p
        role="status"
        data-outcome={phase}
        className={`mt-3 text-sm ${phase === "error" ? "text-(--lbn-error)" : "text-(--lbn-muted)"}`}
      >
        {phase === "done" ? config.doneText : phase === "error" ? config.errorText : ""}
      </p>
    </div>
  );
}
