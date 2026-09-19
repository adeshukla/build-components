"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export type TooltipConfig = {
  triggerText: string;
  text: string;
  trigger: "button" | "icon";
  placement: "top" | "bottom" | "left" | "right";
  delay: number;
  arrow: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
  radius: number;
};

// @config-start
const defaultConfig: TooltipConfig = {
  triggerText: "Delivery options",
  text: "Orders placed before 2pm are sent the same working day.",
  trigger: "button",
  placement: "top",
  delay: 150,
  arrow: true,
  theme: "light",
  accentColor: "#2563eb",
  radius: 8,
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", tip: "#16121f", tipText: "#ffffff", text: "#16121f", line: "#d9d5e4" },
  dark: { surface: "#141019", tip: "#f6f5fa", tipText: "#16121f", text: "#f6f5fa", line: "#3a3448" },
};

const darkMedia = {
  subscribe: (onChange: () => void) => {
    const list = window.matchMedia("(prefers-color-scheme: dark)");
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  },
  get: () => window.matchMedia("(prefers-color-scheme: dark)").matches,
};

// WCAG relative luminance, used to keep the accent readable as a focus ring.
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

const positions = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

const arrows = {
  top: "top-full left-1/2 -translate-x-1/2 -translate-y-1/2",
  bottom: "bottom-full left-1/2 -translate-x-1/2 translate-y-1/2",
  left: "left-full top-1/2 -translate-y-1/2 -translate-x-1/2",
  right: "right-full top-1/2 -translate-y-1/2 translate-x-1/2",
};

export function Tooltip({ config = defaultConfig }: { config?: TooltipConfig }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;

  // Escape closes a tooltip without moving focus: the APG asks for this, so a tooltip can
  // never hide the thing you are reading.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => () => clearTimeout(timer.current), []);

  function show(immediate = false) {
    clearTimeout(timer.current);
    if (immediate || config.delay === 0) setOpen(true);
    else timer.current = setTimeout(() => setOpen(true), config.delay);
  }

  function hide() {
    clearTimeout(timer.current);
    setOpen(false);
  }

  const style = {
    "--tt-accent-text": readableAccent(config.accentColor, dark),
    "--tt-radius": `${config.radius}px`,
    "--tt-surface": palette.surface,
    "--tt-tip": palette.tip,
    "--tt-tip-text": palette.tipText,
    "--tt-text": palette.text,
    "--tt-line": palette.line,
  } as CSSProperties;

  return (
    <div style={style} className="inline-block bg-(--tt-surface) text-(--tt-text)">
      <span className="relative inline-flex">
        <button
          type="button"
          // The tooltip describes the trigger; the trigger keeps its own name either way.
          aria-describedby={open ? `${id}-tip` : undefined}
          aria-label={config.trigger === "icon" ? config.triggerText : undefined}
          onMouseEnter={() => show()}
          onMouseLeave={hide}
          onFocus={() => show(true)}
          onBlur={hide}
          className={`cursor-pointer rounded-(--tt-radius) border border-(--tt-line) font-medium text-(--tt-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--tt-accent-text) ${
            config.trigger === "icon" ? "grid size-9 place-items-center" : "px-3 py-2"
          }`}
        >
          {config.trigger === "icon" ? (
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-5">
              <circle cx="12" cy="12" r="9" />
              <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.7M12 17h.01" />
            </svg>
          ) : (
            config.triggerText
          )}
        </button>

        <span
          id={`${id}-tip`}
          role="tooltip"
          hidden={!open}
          className={`absolute z-20 w-max max-w-64 rounded-(--tt-radius) bg-(--tt-tip) px-3 py-2 text-sm text-(--tt-tip-text) shadow-lg ${positions[config.placement]}`}
        >
          {config.text}
          {config.arrow && (
            <span
              aria-hidden="true"
              className={`absolute size-2 rotate-45 bg-(--tt-tip) ${arrows[config.placement]}`}
            />
          )}
        </span>
      </span>
    </div>
  );
}
