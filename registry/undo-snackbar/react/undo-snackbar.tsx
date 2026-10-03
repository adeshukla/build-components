"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export type UndoSnackbarConfig = {
  triggerLabel: string;
  message: string;
  undoLabel: string;
  closeLabel: string;
  undoneText: string;
  keptText: string;
  seconds: number;
  position: "bottom-left" | "bottom-centre";
  showCountdown: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: UndoSnackbarConfig = {
  triggerLabel: "Archive this message",
  message: "Message archived.",
  undoLabel: "Undo",
  closeLabel: "Dismiss",
  undoneText: "Message put back.",
  keptText: "Message stayed archived.",
  seconds: 8,
  position: "bottom-left",
  showCountdown: true,
  theme: "light",
  accentColor: "#e6b24a",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", panel: "#1b1624", onPanel: "#f6f5fa", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#141019", sunk: "#221d2e", panel: "#2c2639", onPanel: "#f6f5fa", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
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

/** On the dark snackbar panel the accent has to clear 4.5:1 against that, not against the page. */
function readableOnPanel(hex: string, panel: string) {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const base = luminance(panel);
  const lighten = base < 0.18;
  for (let step = 0; step <= 20; step++) {
    const shifted = channels.map((c) => Math.round(lighten ? c + (255 - c) * (step / 20) : c * (1 - step / 20)));
    const value = `#${shifted.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
    const l = luminance(value);
    const contrast = (Math.max(l, base) + 0.05) / (Math.min(l, base) + 0.05);
    if (contrast >= 4.5) return value;
  }
  return lighten ? "#ffffff" : "#000000";
}

export function UndoSnackbar({ config = defaultConfig }: { config?: UndoSnackbarConfig }) {
  const [open, setOpen] = useState(false);
  const [left, setLeft] = useState(config.seconds);
  const [said, setSaid] = useState("");
  const [held, setHeld] = useState(false);
  const tick = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--usb-accent": config.accentColor,
    "--usb-accent-on-panel": readableOnPanel(config.accentColor, palette.panel),
    "--usb-accent-text": readableOnPanel(config.accentColor, palette.surface),
    "--usb-surface": `var(--bc-${dark ? "dark" : "light"}-surface, ${palette.surface})`,
    "--usb-sunk": `var(--bc-${dark ? "dark" : "light"}-sunk, ${palette.sunk})`,
    "--usb-panel": palette.panel,
    "--usb-on-panel": palette.onPanel,
    "--usb-text": `var(--bc-${dark ? "dark" : "light"}-text, ${palette.text})`,
    "--usb-muted": `var(--bc-${dark ? "dark" : "light"}-muted, ${palette.muted})`,
    "--usb-line": `var(--bc-${dark ? "dark" : "light"}-line, ${palette.line})`,
  } as CSSProperties;

  // Counting only while nobody is using it is what makes the time limit adjustable, which WCAG 2.2.1
  // requires of anything that disappears on its own. Nought seconds means it never does.
  useEffect(() => {
    clearInterval(tick.current);
    if (!open || held || config.seconds <= 0) return;
    tick.current = setInterval(() => {
      setLeft((current) => {
        if (current <= 1) {
          clearInterval(tick.current);
          setOpen(false);
          setSaid(config.keptText);
          return 0;
        }
        return current - 1;
      });
    }, 1_000);
    return () => clearInterval(tick.current);
  }, [open, held, config.seconds, config.keptText]);

  const start = () => {
    setSaid("");
    setLeft(config.seconds);
    setHeld(false);
    setOpen(true);
  };

  return (
    <div style={style} className="relative min-h-56 bg-(--usb-surface) text-(--usb-text)">
      <div className="p-4">
        <button
          type="button"
          onClick={start}
          className="inline-flex min-h-11 items-center rounded-[var(--bc-radius-sm,0.375rem)] border border-(--usb-line) bg-(--usb-sunk) px-4 font-medium text-(--usb-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--usb-accent-text)"
        >
          {config.triggerLabel}
        </button>

        {/*
          One live region holding nothing but words. The snackbar itself is not a live region: a region
          that contains a button gets read as a lump of text, and re-reads itself on every countdown tick.
        */}
        <p role="status" data-said className="mt-3 text-sm text-(--usb-muted)">
          {open ? config.message : said}
        </p>
      </div>

      {open && (
        <div
          data-snackbar
          // Focus is never moved here: taking it would interrupt whatever the person was doing, and the
          // action has already happened. The button is one Tab away instead.
          onMouseEnter={() => setHeld(true)}
          onMouseLeave={() => setHeld(false)}
          onFocus={() => setHeld(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node)) setHeld(false);
          }}
          className={`absolute bottom-3 z-30 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[var(--bc-radius-md,0.5rem)] bg-(--usb-panel) px-4 py-3 text-(--usb-on-panel) shadow-xl ${
            config.position === "bottom-centre" ? "left-1/2 -translate-x-1/2" : "left-3"
          }`}
        >
          <p aria-hidden="true" className="m-0">
            {config.message}
          </p>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setSaid(config.undoneText);
            }}
            className="min-h-11 rounded-[var(--bc-radius-xs,0.25rem)] px-2 font-semibold text-(--usb-accent-on-panel) underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--usb-accent-on-panel)"
          >
            {config.undoLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setSaid(config.keptText);
            }}
            aria-label={config.closeLabel}
            className="min-h-11 min-w-11 rounded-[var(--bc-radius-xs,0.25rem)] text-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--usb-accent-on-panel)"
          >
            <span aria-hidden="true">×</span>
          </button>
          {config.showCountdown && config.seconds > 0 && (
            // A number, not a shrinking bar: the bar says nothing to anyone who cannot see it, and the
            // count stops when the snackbar is being used.
            <span aria-hidden="true" data-countdown className="font-mono text-xs opacity-80">
              {held ? "held" : `${left}s`}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
