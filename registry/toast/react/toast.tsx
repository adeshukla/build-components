"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export type ToastConfig = {
  buttonText: string;
  message: string;
  errorButtonText: string;
  errorMessage: string;
  actionText: string;
  position: "top-right" | "top-center" | "bottom-right" | "bottom-center";
  duration: number;
  maxVisible: number;
  closeButton: boolean;
  icon: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
  radius: number;
};

// @config-start
const defaultConfig: ToastConfig = {
  buttonText: "Save changes",
  message: "Your changes have been saved.",
  errorButtonText: "Save without a connection",
  errorMessage: "We could not save your changes. Check your connection and try again.",
  actionText: "Undo",
  position: "bottom-right",
  duration: 6,
  maxVisible: 3,
  closeButton: true,
  icon: true,
  theme: "light",
  accentColor: "#2563eb",
  radius: 12,
};
// @config-end

const palettes = {
  light: { page: "#ffffff", surface: "#ffffff", text: "#16121f", muted: "#4d4a57", line: "#d9d5e4", good: "#1a7f52", bad: "#b4232b" },
  dark: { page: "#141019", surface: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#3a3448", good: "#6ddba4", bad: "#ff8f8f" },
};

const darkMedia = {
  subscribe: (onChange: () => void) => {
    const list = window.matchMedia("(prefers-color-scheme: dark)");
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  },
  get: () => window.matchMedia("(prefers-color-scheme: dark)").matches,
};

// WCAG relative luminance, used to keep the accent readable as text.
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

const places = {
  "top-right": "top-4 right-4 items-end",
  "top-center": "top-4 left-1/2 -translate-x-1/2 items-center",
  "bottom-right": "bottom-4 right-4 items-end",
  "bottom-center": "bottom-4 left-1/2 -translate-x-1/2 items-center",
};

/** A tap leaves the pointer where it landed, so hover-pause is only for devices that hover. */
const hoverMedia = {
  subscribe: (onChange: () => void) => {
    const list = window.matchMedia("(hover: hover)");
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  },
  get: () => window.matchMedia("(hover: hover)").matches,
};

type Toast = { id: number; kind: "good" | "bad"; message: string };

export function Toast({ config = defaultConfig }: { config?: ToastConfig }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [held, setHeld] = useState(false);
  const next = useRef(1);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const canHover = useSyncExternalStore(hoverMedia.subscribe, hoverMedia.get, () => true);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;

  // Messages clear themselves, unless the pointer or the keyboard is inside the stack: nobody
  // should lose a message they are still reading. Duration 0 means they stay until closed.
  useEffect(() => {
    if (config.duration === 0 || held || toasts.length === 0) return;
    const timer = setTimeout(() => setToasts((current) => current.slice(1)), config.duration * 1000);
    return () => clearTimeout(timer);
  }, [toasts, held, config.duration]);

  function show(kind: Toast["kind"]) {
    const id = next.current++;
    setToasts((current) =>
      [...current, { id, kind, message: kind === "good" ? config.message : config.errorMessage }].slice(
        -Math.max(1, config.maxVisible),
      ),
    );
  }

  const style = {
    "--to-accent-text": readableAccent(config.accentColor, dark),
    "--to-radius": `${config.radius}px`,
    "--to-page": palette.page,
    "--to-surface": palette.surface,
    "--to-text": palette.text,
    "--to-muted": palette.muted,
    "--to-line": palette.line,
    "--to-good": palette.good,
    "--to-bad": palette.bad,
  } as CSSProperties;
  const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--to-accent-text)";
  const button = `cursor-pointer rounded-(--to-radius) border border-(--to-line) px-3 py-2 font-medium ${focus}`;

  return (
    <div style={style} className="bg-(--to-page) text-(--to-text)">
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => show("good")} className={button}>
          {config.buttonText}
        </button>
        <button type="button" onClick={() => show("bad")} className={button}>
          {config.errorButtonText}
        </button>
      </div>

      {/* One live region, always in the page: a region added at the same time as its first
          message is often announced too late, or not at all. */}
      <div
        role="region"
        aria-label="Notifications"
        onMouseEnter={canHover ? () => setHeld(true) : undefined}
        onMouseLeave={canHover ? () => setHeld(false) : undefined}
        onFocusCapture={() => setHeld(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHeld(false);
        }}
        className={`pointer-events-none fixed z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2 ${places[config.position]}`}
      >
        <div aria-live="polite" aria-atomic="false" className="contents">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`pointer-events-auto flex w-full items-start gap-3 rounded-(--to-radius) border border-(--to-line) bg-(--to-surface) p-3 shadow-lg transition-opacity duration-200 starting:opacity-0 motion-reduce:transition-none`}
            >
              {config.icon && (
                <span
                  aria-hidden="true"
                  className={`mt-0.5 shrink-0 ${toast.kind === "good" ? "text-(--to-good)" : "text-(--to-bad)"}`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-5">
                    {toast.kind === "good" ? (
                      <path d="M20 6 9 17l-5-5" />
                    ) : (
                      <>
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v6M12 16h.01" />
                      </>
                    )}
                  </svg>
                </span>
              )}

              <div className="min-w-0 flex-1">
                <p className="text-sm text-pretty">{toast.message}</p>
                {config.actionText.trim() !== "" && toast.kind === "good" && (
                  <button
                    type="button"
                    onClick={() => setToasts((current) => current.filter((entry) => entry.id !== toast.id))}
                    className={`mt-1 inline-block min-h-6 cursor-pointer py-0.5 text-sm font-semibold text-(--to-accent-text) underline ${focus}`}
                  >
                    {config.actionText}
                  </button>
                )}
              </div>

              {config.closeButton && (
                <button
                  type="button"
                  onClick={() => setToasts((current) => current.filter((entry) => entry.id !== toast.id))}
                  className={`-m-1 grid size-8 shrink-0 cursor-pointer place-items-center rounded-full ${focus}`}
                >
                  <span className="sr-only">Close this message</span>
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4">
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
