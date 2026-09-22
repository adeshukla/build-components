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

export type ResizablePanelsConfig = {
  label: string;
  firstTitle: string;
  firstBody: string;
  secondTitle: string;
  secondBody: string;
  orientation: "horizontal" | "vertical";
  startSize: number;
  minSize: number;
  maxSize: number;
  step: number;
  collapsible: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: ResizablePanelsConfig = {
  label: "Resize the file list",
  firstTitle: "Files",
  firstBody: "Drag the divider, or focus it and use the arrow keys. Enter collapses this panel and brings it back.",
  secondTitle: "Preview",
  secondBody: "This panel takes whatever room is left. Both panels keep their content readable at every size.",
  orientation: "horizontal",
  startSize: 35,
  minSize: 20,
  maxSize: 70,
  step: 5,
  collapsible: true,
  theme: "light",
  accentColor: "#2563eb",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#d9d5e4", handle: "#8e8a99" },
  dark: { surface: "#141019", sunk: "#1f1a29", text: "#f6f5fa", muted: "#b6b3c2", line: "#3a3448", handle: "#8e8a99" },
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

export function ResizablePanels({ config = defaultConfig }: { config?: ResizablePanelsConfig }) {
  const id = useId();
  const min = Math.min(config.minSize, config.maxSize);
  const max = Math.max(config.minSize, config.maxSize);
  const clamp = (value: number) => Math.min(max, Math.max(min, Math.round(value)));
  const [size, setSize] = useState(clamp(config.startSize));
  const [collapsed, setCollapsed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const horizontal = config.orientation === "horizontal";
  const shown = collapsed ? 0 : size;

  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--rp-accent": config.accentColor,
    "--rp-accent-text": readableAccent(config.accentColor, dark),
    "--rp-surface": palette.surface,
    "--rp-sunk": palette.sunk,
    "--rp-text": palette.text,
    "--rp-muted": palette.muted,
    "--rp-line": palette.line,
    "--rp-handle": palette.handle,
  } as CSSProperties;

  function resize(value: number) {
    setCollapsed(false);
    setSize(clamp(value));
  }

  // APG window splitter: arrows move it, Home/End jump to the limits, Enter collapses and restores.
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const less = horizontal ? "ArrowLeft" : "ArrowUp";
    const more = horizontal ? "ArrowRight" : "ArrowDown";
    let handled = true;
    if (event.key === less) resize(shown - config.step);
    else if (event.key === more) resize((collapsed ? min : size) + (collapsed ? 0 : config.step));
    else if (event.key === "Home") resize(min);
    else if (event.key === "End") resize(max);
    else if (event.key === "Enter" && config.collapsible) setCollapsed(!collapsed);
    else handled = false;
    if (handled) event.preventDefault();
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.focus();
    dragging.current = true;
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const box = containerRef.current?.getBoundingClientRect();
    if (!dragging.current || !box) return;
    const at = horizontal ? (event.clientX - box.left) / box.width : (event.clientY - box.top) / box.height;
    resize(at * 100);
  }

  const pane = "min-w-0 min-h-0 overflow-auto p-4";

  return (
    <div
      ref={containerRef}
      style={style}
      className={`flex h-72 overflow-hidden rounded-lg border border-(--rp-line) bg-(--rp-surface) text-(--rp-text) ${horizontal ? "flex-row" : "flex-col"}`}
    >
      <section
        id={`${id}-first`}
        aria-labelledby={`${id}-first-title`}
        hidden={collapsed}
        style={{ flexBasis: `${shown}%` }}
        className={`${pane} shrink-0 bg-(--rp-sunk)`}
      >
        <p id={`${id}-first-title`} className="font-semibold">
          {config.firstTitle}
        </p>
        <p className="mt-1 text-sm text-(--rp-muted)">{config.firstBody}</p>
      </section>
      <div
        role="separator"
        tabIndex={0}
        aria-label={config.label}
        aria-controls={`${id}-first`}
        aria-orientation={horizontal ? "vertical" : "horizontal"}
        aria-valuenow={shown}
        aria-valuemin={config.collapsible ? 0 : min}
        aria-valuemax={max}
        aria-valuetext={collapsed ? `${config.firstTitle} collapsed` : `${config.firstTitle} ${shown}%`}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
        onDoubleClick={() => config.collapsible && setCollapsed(!collapsed)}
        className={`group relative flex shrink-0 touch-none items-center justify-center bg-(--rp-line) outline-none select-none focus-visible:bg-(--rp-accent) hover:bg-(--rp-accent) forced-colors:bg-[CanvasText] forced-colors:focus-visible:bg-[Highlight] ${horizontal ? "w-1.5 cursor-col-resize" : "h-1.5 cursor-row-resize"}`}
      >
        {/* A wider invisible grip: the visible line is thin, the target is not. */}
        <span aria-hidden="true" className={`absolute ${horizontal ? "inset-y-0 -inset-x-3" : "inset-x-0 -inset-y-3"}`} />
        <span
          aria-hidden="true"
          className={`relative rounded-full bg-(--rp-handle) group-hover:bg-(--rp-surface) group-focus-visible:bg-(--rp-surface) ${horizontal ? "h-8 w-1" : "h-1 w-8"}`}
        />
      </div>
      <section aria-labelledby={`${id}-second-title`} className={`${pane} flex-1`}>
        <p id={`${id}-second-title`} className="font-semibold">
          {config.secondTitle}
        </p>
        <p className="mt-1 text-sm text-(--rp-muted)">{config.secondBody}</p>
      </section>
    </div>
  );
}
