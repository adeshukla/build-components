"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export type BackToTopConfig = {
  text: string;
  showAfter: number;
  position: "right" | "left";
  showLabel: boolean;
  targetId: string;
  showDemo: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: BackToTopConfig = {
  text: "Back to top",
  showAfter: 400,
  position: "right",
  showLabel: true,
  targetId: "",
  showDemo: true,
  theme: "light",
  accentColor: "#25154d",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", border: "#737373" },
  dark: { surface: "#1c1826", text: "#f6f5fa", border: "#8e8a99" },
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

export function BackToTop({ config = defaultConfig }: { config?: BackToTopConfig }) {
  const [shown, setShown] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--bt-accent": config.accentColor,
    "--bt-on-accent": luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff",
    "--bt-surface": palette.surface,
    "--bt-text": palette.text,
    "--bt-border": palette.border,
  } as CSSProperties;

  // Only appears once there is enough page behind you for it to be worth having.
  useEffect(() => {
    const after = Math.max(0, config.showAfter);
    const onScroll = () => setShown(window.scrollY > after);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [config.showAfter]);

  function toTop() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    // Scrolling alone leaves a keyboard user at the bottom of the page: move focus as well.
    const target = config.targetId ? document.getElementById(config.targetId) : null;
    const landing = target ?? document.querySelector<HTMLElement>("h1") ?? document.body;
    if (landing && landing.tabIndex < 0) landing.tabIndex = -1;
    landing?.focus({ preventScroll: true });
  }

  return (
    <div style={style} className="bg-(--bt-surface) text-(--bt-text)">
      {config.showDemo && (
        // Example page content, so there is something to scroll. Delete it in your own page.
        <div>
          <h1 tabIndex={-1} className="mb-4 text-2xl font-semibold outline-none">
            Page heading
          </h1>
          {Array.from({ length: 16 }, (_, index) => (
            <p key={index} className="mb-6 max-w-prose">
              Section {index + 1}. A page needs some length before a back-to-top button earns its place, so here is a paragraph of it. Keep scrolling and the button turns up in the corner.
            </p>
          ))}
        </div>
      )}
      {/* Rendered only once it is wanted: a hidden attribute would lose to the display class. */}
      {shown && (
      <button
        ref={buttonRef}
        type="button"
        onClick={toTop}
        className={`fixed bottom-6 z-40 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-(--bt-accent) px-4 text-(--bt-on-accent) shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bt-accent) ${config.position === "right" ? "right-6" : "left-6"}`}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-5">
          <path d="m6 15 6-6 6 6" />
        </svg>
        {config.showLabel ? config.text : <span className="sr-only">{config.text}</span>}
      </button>
      )}
    </div>
  );
}
