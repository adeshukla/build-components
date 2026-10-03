"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export type ErrorStateConfig = {
  triggerLabel: string;
  heading: string;
  headingLevel: "h2" | "h3";
  message: string;
  advice: string;
  retryLabel: string;
  detailsLabel: string;
  detailsText: string;
  showDetails: boolean;
  okText: string;
  retrySucceeds: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: ErrorStateConfig = {
  triggerLabel: "Load the report",
  heading: "The report did not load",
  headingLevel: "h2",
  message: "The server took too long to answer.",
  advice: "Nothing was changed. Try again, or come back in a few minutes.",
  retryLabel: "Try again",
  detailsLabel: "Technical detail",
  detailsText: "GET /api/reports/2026-q1 — 504 Gateway Timeout after 30s",
  showDetails: true,
  okText: "Report loaded.",
  retrySucceeds: true,
  theme: "light",
  accentColor: "#b42318",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#fdf2f1", text: "#16121f", muted: "#4d4a57", line: "#e6b9b4" },
  dark: { surface: "#141019", sunk: "#2a1b1d", text: "#f6f5fa", muted: "#c5b8b8", line: "#6b3a38" },
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

type Phase = "idle" | "failed" | "ok";

export function ErrorState({ config = defaultConfig }: { config?: ErrorStateConfig }) {
  const id = useId();
  const [phase, setPhase] = useState<Phase>("idle");
  const [tried, setTried] = useState(0);
  const panel = useRef<HTMLDivElement | null>(null);
  const wanted = useRef(false);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--est-accent": config.accentColor,
    "--est-accent-text": readableAccent(config.accentColor, dark),
    "--est-on-accent": luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff",
    "--est-surface": `var(--bc-${dark ? "dark" : "light"}-surface, ${palette.surface})`,
    "--est-sunk": `var(--bc-${dark ? "dark" : "light"}-sunk, ${palette.sunk})`,
    "--est-text": `var(--bc-${dark ? "dark" : "light"}-text, ${palette.text})`,
    "--est-muted": `var(--bc-${dark ? "dark" : "light"}-muted, ${palette.muted})`,
    "--est-line": `var(--bc-${dark ? "dark" : "light"}-line, ${palette.line})`,
  } as CSSProperties;

  // Focus moves to the panel once it is rendered, not a frame later.
  useEffect(() => {
    if (!wanted.current) return;
    wanted.current = false;
    panel.current?.focus();
  });

  const attempt = () => {
    const next = tried + 1;
    setTried(next);
    const ok = config.retrySucceeds && next > 1;
    // Focus goes to the panel, not to the retry button: the reason has to be read before it is retried.
    wanted.current = !ok;
    setPhase(ok ? "ok" : "failed");
  };

  const Heading = config.headingLevel;

  return (
    <div style={style} className="bg-(--est-surface) text-(--est-text)">
      {phase !== "failed" && (
        <button
          type="button"
          onClick={attempt}
          className="inline-flex min-h-11 items-center rounded-[var(--bc-radius-sm,0.375rem)] border border-(--est-line) bg-(--est-sunk) px-4 font-medium text-(--est-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--est-accent-text)"
        >
          {config.triggerLabel}
        </button>
      )}

      {phase === "failed" && (
        // A focusable region with a heading, not role="alert": an alert reads the whole panel over
        // whatever else is happening, and gives no way to get back to it afterwards.
        <div
          ref={panel}
          tabIndex={-1}
          role="group"
          data-panel
          aria-labelledby={`${id}-heading`}
          className="max-w-prose rounded-[var(--bc-radius-md,0.5rem)] border-2 border-(--est-line) bg-(--est-sunk) p-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--est-accent-text)"
        >
          <div className="flex items-start gap-3">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="mt-0.5 size-6 shrink-0 fill-(--est-accent-text)">
              <path d="M12 2 1.5 20.5h21L12 2Zm0 5.5 1 7h-2l1-7Zm0 9.25a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3Z" />
            </svg>
            <div>
              <Heading id={`${id}-heading`} className="m-0 text-lg font-semibold">
                {config.heading}
              </Heading>
              {/* What happened, then what to do about it. A heading alone leaves nobody anywhere to go. */}
              <p className="mt-1">{config.message}</p>
              <p className="mt-1 text-sm text-(--est-muted)">{config.advice}</p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={attempt}
                  className="inline-flex min-h-11 items-center rounded-[var(--bc-radius-button,0.375rem)] bg-(--est-accent) px-4 font-medium text-(--est-on-accent) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--est-accent-text)"
                >
                  {config.retryLabel}
                </button>
              </div>

              {config.showDetails && (
                // A disclosure, so the technical line is there for whoever reports it and out of the way
                // of everyone else.
                <details className="mt-4">
                  <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-medium text-(--est-accent-text) underline underline-offset-4">
                    {config.detailsLabel}
                  </summary>
                  <p className="mt-2 font-mono text-xs break-words text-(--est-muted)">{config.detailsText}</p>
                </details>
              )}
            </div>
          </div>
        </div>
      )}

      <p role="status" className="mt-3 text-sm text-(--est-muted)">
        {phase === "ok" ? config.okText : ""}
      </p>
    </div>
  );
}
