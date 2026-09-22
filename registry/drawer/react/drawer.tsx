"use client";

import {
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

export type DrawerConfig = {
  triggerText: string;
  title: string;
  body: string;
  options: { label: string }[];
  primaryText: string;
  secondaryButton: boolean;
  secondaryText: string;
  side: "right" | "left" | "bottom";
  size: "sm" | "md" | "lg";
  closeOnBackdrop: boolean;
  swipeToClose: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: DrawerConfig = {
  triggerText: "Filters",
  title: "Filter results",
  body: "Pick what to show. Nothing changes until you press Show results.",
  options: [{ label: "In stock" }, { label: "On sale" }, { label: "Free delivery" }, { label: "Rated 4 stars and up" }],
  primaryText: "Show results",
  secondaryButton: true,
  secondaryText: "Clear all",
  side: "right",
  size: "md",
  closeOnBackdrop: true,
  swipeToClose: true,
  theme: "light",
  accentColor: "#2563eb",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", muted: "#4d4a57", border: "#737373", line: "#d9d5e4", hover: "#eeecf5" },
  dark: { surface: "#1c1826", text: "#f6f5fa", muted: "#b6b3c2", border: "#8e8a99", line: "#3a3448", hover: "#2a2438" },
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

const widths = { sm: "20rem", md: "24rem", lg: "32rem" };
const heights = { sm: "40dvh", md: "60dvh", lg: "85dvh" };
// Margins restated: the browser centres a dialog with auto margins; a drawer hugs one edge.
const sides = {
  right: "my-0 mr-0 ml-auto h-dvh max-h-dvh w-(--dr-width) max-w-[calc(100vw-3rem)] starting:translate-x-full",
  left: "my-0 mr-auto ml-0 h-dvh max-h-dvh w-(--dr-width) max-w-[calc(100vw-3rem)] starting:-translate-x-full",
  bottom: "mx-0 mt-auto mb-0 max-h-(--dr-height) w-full max-w-full rounded-t-2xl starting:translate-y-full",
};
const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--dr-accent-text)";
/** How far a swipe has to travel, in pixels, to close the drawer. */
const SWIPE_CLOSE = 80;

export function Drawer({ config = defaultConfig }: { config?: DrawerConfig }) {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const overflowRef = useRef("");
  const swipe = useRef<{ x: number; y: number; distance: number } | null>(null);
  const options = config.options.map((option) => option.label).filter((label) => label.trim() !== "");
  const [checked, setChecked] = useState<string[]>([]);
  const [applied, setApplied] = useState<string[] | null>(null);

  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const accentLuminance = luminance(config.accentColor);
  const style = {
    "--dr-accent": config.accentColor,
    "--dr-accent-text": readableAccent(config.accentColor, dark),
    "--dr-on-accent": accentLuminance > 0.179 ? "#000000" : "#ffffff",
    "--dr-surface": palette.surface,
    "--dr-text": palette.text,
    "--dr-muted": palette.muted,
    "--dr-border": palette.border,
    "--dr-line": palette.line,
    "--dr-hover": palette.hover,
    "--dr-width": widths[config.size],
    "--dr-height": heights[config.size],
  } as CSSProperties;
  const button = `min-h-10 cursor-pointer rounded-lg px-4 font-medium ${focusRing}`;

  function open() {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.style.translate = "";
    dialog.showModal();
    // Stop the page behind the drawer from scrolling.
    overflowRef.current = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    titleRef.current?.focus();
  }

  function onClose() {
    document.documentElement.style.overflow = overflowRef.current;
    triggerRef.current?.focus();
  }

  // Keep Tab inside the drawer (APG dialog pattern), including from the focused title.
  function onKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const items = [...event.currentTarget.querySelectorAll<HTMLElement>("button, a[href], input, select, textarea")];
    const index = items.indexOf(document.activeElement as HTMLElement);
    if (event.shiftKey && index <= 0) {
      event.preventDefault();
      items[items.length - 1]?.focus();
    } else if (!event.shiftKey && index === items.length - 1) {
      event.preventDefault();
      items[0]?.focus();
    }
  }

  // Swiping toward the edge it came from closes it. Touch only, so a mouse can still select text.
  function onPointerDown(event: PointerEvent<HTMLDialogElement>) {
    if (!config.swipeToClose || event.pointerType !== "touch") return;
    swipe.current = { x: event.clientX, y: event.clientY, distance: 0 };
  }

  function onPointerMove(event: PointerEvent<HTMLDialogElement>) {
    const start = swipe.current;
    if (!start) return;
    const delta = config.side === "right" ? event.clientX - start.x : config.side === "left" ? start.x - event.clientX : event.clientY - start.y;
    start.distance = Math.max(0, delta);
    const offset = config.side === "left" ? -start.distance : start.distance;
    event.currentTarget.style.translate = config.side === "bottom" ? `0 ${offset}px` : `${offset}px 0`;
  }

  function onPointerUp(event: PointerEvent<HTMLDialogElement>) {
    const start = swipe.current;
    if (!start) return;
    swipe.current = null;
    event.currentTarget.style.translate = "";
    if (start.distance > SWIPE_CLOSE) dialogRef.current?.close();
  }

  return (
    <div style={style}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        onClick={open}
        className={`inline-flex items-center gap-2 border border-(--dr-border) bg-(--dr-surface) text-(--dr-text) hover:bg-(--dr-hover) ${button}`}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4">
          <path d="M4 6h16M7 12h10M10 18h4" />
        </svg>
        {config.triggerText}
      </button>
      <p role="status" className="mt-2 text-sm text-(--dr-muted) empty:hidden">
        {applied === null ? "" : applied.length ? `Showing: ${applied.join(", ")}.` : "Showing everything."}
      </p>

      <dialog
        ref={dialogRef}
        aria-labelledby={`${id}-title`}
        aria-describedby={config.body.trim() ? `${id}-body` : undefined}
        onClose={onClose}
        onKeyDown={onKeyDown}
        onMouseDown={(event) => {
          // A click on the backdrop must not pull keyboard focus out of the drawer.
          if (event.target === event.currentTarget) event.preventDefault();
        }}
        onClick={(event) => {
          if (config.closeOnBackdrop && event.target === event.currentTarget) dialogRef.current?.close();
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={`overflow-hidden border-0 bg-(--dr-surface) p-0 text-(--dr-text) shadow-2xl transition-[translate] duration-300 ease-out backdrop:bg-black/50 motion-reduce:transition-none ${sides[config.side]}`}
      >
        <div className="flex h-full max-h-[inherit] flex-col">
          {config.side === "bottom" && <span aria-hidden="true" className="mx-auto mt-2 block h-1.5 w-10 shrink-0 rounded-full bg-(--dr-line)" />}
          <div className="flex items-start justify-between gap-4 border-b border-(--dr-line) px-5 py-4">
            <h2 ref={titleRef} id={`${id}-title`} tabIndex={-1} className="text-lg font-semibold outline-none">
              {config.title}
            </h2>
            <button
              type="button"
              aria-label="Close"
              onClick={() => dialogRef.current?.close()}
              className={`-m-1.5 grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg text-(--dr-muted) hover:bg-(--dr-hover) ${focusRing}`}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-5">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
            {config.body.trim() !== "" && (
              <p id={`${id}-body`} className="text-(--dr-muted)">
                {config.body}
              </p>
            )}
            {options.length > 0 && (
              <fieldset className="mt-4">
                <legend className="sr-only">{config.title}</legend>
                {options.map((label, index) => (
                  <label key={`${label}-${index}`} className="flex min-h-11 cursor-pointer items-center gap-3 border-b border-(--dr-line) last:border-0">
                    <input
                      type="checkbox"
                      checked={checked.includes(label)}
                      onChange={(event) =>
                        setChecked((before) => (event.target.checked ? [...before, label] : before.filter((item) => item !== label)))
                      }
                      className={`size-5 accent-(--dr-accent) ${focusRing}`}
                    />
                    {label}
                  </label>
                ))}
              </fieldset>
            )}
          </div>
          <div className="flex flex-wrap justify-end gap-3 border-t border-(--dr-line) px-5 py-4">
            {config.secondaryButton && (
              <button
                type="button"
                onClick={() => setChecked([])}
                className={`border border-(--dr-border) bg-transparent text-(--dr-text) hover:bg-(--dr-hover) ${button}`}
              >
                {config.secondaryText}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setApplied(options.filter((label) => checked.includes(label)));
                dialogRef.current?.close();
              }}
              className={`bg-(--dr-accent) text-(--dr-on-accent) ${button}`}
            >
              {config.primaryText}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
