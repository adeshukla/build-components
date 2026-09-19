"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export type PopoverConfig = {
  triggerText: string;
  heading: string;
  body: string;
  primaryText: string;
  primaryHref: string;
  secondaryButton: boolean;
  secondaryText: string;
  placement: "bottom" | "top" | "right";
  align: "start" | "end";
  closeButton: boolean;
  closeOnOutside: boolean;
  arrow: boolean;
  width: number;
  theme: "light" | "dark" | "system";
  accentColor: string;
  radius: number;
};

// @config-start
const defaultConfig: PopoverConfig = {
  triggerText: "Share this page",
  heading: "Share",
  body: "Anyone with the link can open this page. The link stops working when you turn sharing off.",
  primaryText: "Copy link",
  primaryHref: "",
  secondaryButton: true,
  secondaryText: "Turn off sharing",
  placement: "bottom",
  align: "start",
  closeButton: true,
  closeOnOutside: true,
  arrow: true,
  width: 320,
  theme: "light",
  accentColor: "#2563eb",
  radius: 12,
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", muted: "#4d4a57", line: "#d9d5e4", hover: "#f4f3f8" },
  dark: { surface: "#141019", text: "#f6f5fa", muted: "#b6b3c2", line: "#3a3448", hover: "#221d2e" },
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

export function Popover({ config = defaultConfig }: { config?: PopoverConfig }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const accentLuminance = luminance(config.accentColor);

  // Unlike a tooltip, a popover holds things you can use, so focus moves into it.
  useLayoutEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>("button, [href], input, select, textarea")?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    }
    function onPointerDown(event: PointerEvent) {
      if (config.closeOnOutside && !rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, config.closeOnOutside]);

  const style = {
    "--pv-accent": config.accentColor,
    "--pv-accent-text": readableAccent(config.accentColor, dark),
    "--pv-on-accent": accentLuminance > 0.179 ? "#000000" : "#ffffff",
    "--pv-radius": `${config.radius}px`,
    "--pv-surface": palette.surface,
    "--pv-text": palette.text,
    "--pv-muted": palette.muted,
    "--pv-line": palette.line,
    "--pv-hover": palette.hover,
  } as CSSProperties;
  const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--pv-accent-text)";

  const places = {
    bottom: `top-full mt-2 ${config.align === "end" ? "right-0" : "left-0"}`,
    top: `bottom-full mb-2 ${config.align === "end" ? "right-0" : "left-0"}`,
    right: "left-full top-0 ml-2",
  };
  const arrows = {
    bottom: `bottom-full translate-y-1/2 ${config.align === "end" ? "right-4" : "left-4"}`,
    top: `top-full -translate-y-1/2 ${config.align === "end" ? "right-4" : "left-4"}`,
    right: "right-full top-4 translate-x-1/2",
  };

  return (
    <div ref={rootRef} style={style} className="relative inline-block bg-(--pv-surface) text-(--pv-text)">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls="popover-panel"
        onClick={() => setOpen(!open)}
        className={`cursor-pointer rounded-(--pv-radius) border border-(--pv-line) px-3 py-2 font-medium ${focus}`}
      >
        {config.triggerText}
      </button>

      <div
        ref={panelRef}
        id="popover-panel"
        // A dialog role tells a screen reader that focus has moved somewhere new.
        role="dialog"
        aria-label={config.heading}
        hidden={!open}
        style={{ width: `${config.width}px` }}
        className={`absolute z-20 max-w-[calc(100vw-2rem)] rounded-(--pv-radius) border border-(--pv-line) bg-(--pv-surface) p-4 shadow-xl ${places[config.placement]}`}
      >
        {config.arrow && (
          <span
            aria-hidden="true"
            className={`absolute size-3 rotate-45 border-(--pv-line) bg-(--pv-surface) ${arrows[config.placement]} ${
              config.placement === "bottom" ? "border-t border-l" : ""
            } ${config.placement === "top" ? "border-r border-b" : ""} ${config.placement === "right" ? "border-b border-l" : ""}`}
          />
        )}

        <div className="flex items-start justify-between gap-3">
          <p className="font-semibold">{config.heading}</p>
          {config.closeButton && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                triggerRef.current?.focus();
              }}
              className={`-m-1 grid size-8 shrink-0 cursor-pointer place-items-center rounded-full hover:bg-(--pv-hover) ${focus}`}
            >
              <span className="sr-only">Close</span>
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          )}
        </div>

        {config.body.trim() !== "" && <p className="mt-2 text-sm text-pretty text-(--pv-muted)">{config.body}</p>}

        <div className="mt-4 flex flex-wrap gap-2">
          {config.primaryHref.trim() !== "" ? (
            <a
              href={safeHref(config.primaryHref)}
              className={`rounded-(--pv-radius) bg-(--pv-accent) px-3 py-2 text-sm font-semibold text-(--pv-on-accent) no-underline ${focus}`}
            >
              {config.primaryText}
            </a>
          ) : (
            <button
              type="button"
              className={`cursor-pointer rounded-(--pv-radius) bg-(--pv-accent) px-3 py-2 text-sm font-semibold text-(--pv-on-accent) ${focus}`}
            >
              {config.primaryText}
            </button>
          )}
          {config.secondaryButton && (
            <button
              type="button"
              className={`cursor-pointer rounded-(--pv-radius) border border-(--pv-line) px-3 py-2 text-sm font-medium ${focus}`}
            >
              {config.secondaryText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
