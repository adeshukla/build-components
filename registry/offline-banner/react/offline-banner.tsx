"use client";

import { useEffect, useState, useSyncExternalStore, type CSSProperties } from "react";

export type OfflineBannerConfig = {
  offlineText: string;
  onlineText: string;
  retryText: string;
  showRetry: boolean;
  position: "top" | "bottom" | "inline";
  demoToggle: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: OfflineBannerConfig = {
  offlineText: "You are offline. Anything you change is kept on this device until the connection is back.",
  onlineText: "Back online.",
  retryText: "Try again",
  showRetry: true,
  position: "top",
  demoToggle: true,
  theme: "light",
  accentColor: "#b45309",
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

// The browser's own idea of the connection. Treated as a hint: it says the network is there, not
// that your server is answering, which is why the retry button exists.
const network = {
  subscribe: (onChange: () => void) => {
    window.addEventListener("online", onChange);
    window.addEventListener("offline", onChange);
    return () => {
      window.removeEventListener("online", onChange);
      window.removeEventListener("offline", onChange);
    };
  },
  get: () => !navigator.onLine,
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

export function OfflineBanner({ config = defaultConfig }: { config?: OfflineBannerConfig }) {
  const [pretend, setPretend] = useState(false);
  const [note, setNote] = useState("");
  // Nothing is said before the first drop: a page that loads online has no news to report.
  const [dropped, setDropped] = useState(false);
  const reallyOffline = useSyncExternalStore(network.subscribe, network.get, () => false);
  const offline = reallyOffline || pretend;

  useEffect(() => {
    const mark = () => setDropped(true);
    window.addEventListener("offline", mark);
    return () => window.removeEventListener("offline", mark);
  }, []);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--ob-accent": config.accentColor,
    "--ob-accent-text": readableAccent(config.accentColor, dark),
    "--ob-on-accent": luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff",
    "--ob-surface": palette.surface,
    "--ob-sunk": palette.sunk,
    "--ob-text": palette.text,
    "--ob-muted": palette.muted,
    "--ob-line": palette.line,
  } as CSSProperties;

  // Sticky, not fixed: it stays in view while scrolling but keeps its own space, so it never lands
  // on top of the first thing on the page.
  const place =
    config.position === "top" ? "sticky top-0 z-40" : config.position === "bottom" ? "sticky bottom-0 z-40" : "static";

  return (
    <div style={style} className="bg-(--ob-surface) text-(--ob-text)">
      {/* Polite, not an alert: losing the connection is worth saying, not worth cutting someone off for. */}
      <div role="status" className={place}>
        {offline ? (
          <div className="flex flex-wrap items-center justify-between gap-2 bg-(--ob-accent) px-4 py-2 text-sm text-(--ob-on-accent)">
            <span>{config.offlineText}</span>
            {config.showRetry && (
              <button
                type="button"
                onClick={() => setNote(navigator.onLine && !pretend ? "" : "Still nothing. The connection is not back yet.")}
                className="min-h-11 shrink-0 cursor-pointer rounded-md border border-current px-3 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
              >
                {config.retryText}
              </button>
            )}
          </div>
        ) : (
          dropped && <div className="bg-(--ob-sunk) px-4 py-2 text-sm">{config.onlineText}</div>
        )}
      </div>

      {config.demoToggle && (
        <div className="mt-2">
          {/* For trying it out: the real thing runs off the browser's online and offline events. */}
          <button
            type="button"
            onClick={() => {
              const next = !offline;
              setPretend(next);
              if (next) setDropped(true);
              setNote("");
            }}
            className="min-h-11 cursor-pointer rounded-md border border-(--ob-line) px-4 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ob-accent-text)"
          >
            {offline ? "Pretend the connection is back" : "Pretend to go offline"}
          </button>
        </div>
      )}

      <p role="status" className="mt-2 text-sm text-(--ob-muted)">
        {note}
      </p>
    </div>
  );
}
