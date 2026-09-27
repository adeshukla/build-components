"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export type NavProgressConfig = {
  triggerLabel: string;
  pageName: string;
  position: "top" | "bottom";
  thickness: number;
  delayMs: number;
  demoMs: number;
  loadingText: string;
  doneText: string;
  showBar: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: NavProgressConfig = {
  triggerLabel: "Go to the next page",
  pageName: "Parts catalogue",
  position: "top",
  thickness: 3,
  delayMs: 200,
  demoMs: 1400,
  loadingText: "Loading",
  doneText: "Loaded",
  showBar: true,
  theme: "light",
  accentColor: "#e6b24a",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
};

const darkMedia = {
  subscribe: (onChange: () => void) => {
    const list = window.matchMedia("(prefers-color-scheme: dark)");
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  },
  get: () => window.matchMedia("(prefers-color-scheme: dark)").matches,
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

type Phase = "idle" | "waiting" | "loading" | "done";

export function NavProgress({ config = defaultConfig }: { config?: NavProgressConfig }) {
  const id = useId();
  const [phase, setPhase] = useState<Phase>("idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--np-accent": config.accentColor,
    "--np-accent-text": readableAccent(config.accentColor, dark),
    "--np-surface": palette.surface,
    "--np-sunk": palette.sunk,
    "--np-text": palette.text,
    "--np-muted": palette.muted,
    "--np-line": palette.line,
  } as CSSProperties;

  useEffect(() => {
    const running = timers.current;
    return () => running.forEach(clearTimeout);
  }, []);

  const start = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    // Waiting, not loading: a bar that flashes for 80ms is worse than no bar, so nothing is drawn
    // until the load has already outlasted the delay.
    setPhase("waiting");
    timers.current.push(setTimeout(() => setPhase("loading"), config.delayMs));
    timers.current.push(setTimeout(() => setPhase("done"), Math.max(config.demoMs, config.delayMs)));
  };

  const busy = phase === "waiting" || phase === "loading";

  return (
    <div style={style} className="relative overflow-hidden bg-(--np-surface) text-(--np-text)">
      {/* The bar is a picture of the state the live region already carries, so screen readers skip it. */}
      {config.showBar && phase === "loading" && (
        <div
          aria-hidden="true"
          data-track
          className={`absolute inset-x-0 ${config.position === "top" ? "top-0" : "bottom-0"} z-40 overflow-hidden bg-(--np-sunk)`}
          style={{ height: `${config.thickness}px` }}
        >
          <div className="np-creep h-full w-full origin-left bg-(--np-accent)" />
        </div>
      )}

      {/* React 19 hoists this into the head and keeps one copy, however many bars are on the page. */}
      <style href="np-creep" precedence="default">{`
        @keyframes np-creep { from { transform: scaleX(0.05); } to { transform: scaleX(0.9); } }
        .np-creep { animation: np-creep 2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        /* Under reduced motion the bar is simply there at a fixed width: no creep, no pulse. */
        @media (prefers-reduced-motion: reduce) { .np-creep { animation: none; transform: scaleX(0.6); } }
      `}</style>

      <div className="p-4">
        <button
          type="button"
          onClick={start}
          aria-describedby={`${id}-state`}
          className="inline-flex min-h-11 items-center rounded-md bg-(--np-sunk) px-4 font-medium text-(--np-text) ring-1 ring-(--np-line) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--np-accent-text)"
        >
          {config.triggerLabel}
        </button>

        {/*
          The announcement is the accessible part of a navigation indicator. A route change gives a
          screen reader nothing by itself, which is why the words matter more than the bar.
        */}
        <p id={`${id}-state`} role="status" data-phase={phase} className="mt-3 text-sm text-(--np-muted)">
          {busy ? `${config.loadingText}…` : phase === "done" ? `${config.doneText}: ${config.pageName}` : ""}
        </p>

        <div aria-hidden="true" className="mt-4 grid gap-2">
          {[0, 1, 2].map((row) => (
            <div key={row} className="h-3 rounded bg-(--np-sunk)" style={{ width: `${90 - row * 18}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
