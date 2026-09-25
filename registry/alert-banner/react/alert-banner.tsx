"use client";

import { useState, useSyncExternalStore, type CSSProperties } from "react";

export type AlertBannerConfig = {
  tone: "info" | "success" | "warning" | "error";
  title: string;
  body: string;
  actionText: string;
  actionUrl: string;
  dismissible: boolean;
  theme: "light" | "dark" | "system";
};

// @config-start
const defaultConfig: AlertBannerConfig = {
  tone: "warning",
  title: "Your card expires next month",
  body: "Update it before 30 June so your subscription doesn't stop.",
  actionText: "Update card",
  actionUrl: "/billing",
  dismissible: true,
  theme: "light",
};
// @config-end

/** Each tone has its own word, icon and colour: colour is never the only sign of what this is. */
const tones = {
  info: { word: "Information", path: "M12 8h.01M11 12h1v5h1", ring: "#2563eb" },
  success: { word: "Success", path: "m5 12 5 5L20 7", ring: "#146c2e" },
  warning: { word: "Warning", path: "M12 9v5M12 17h.01M10.3 3.9 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z", ring: "#8a5300" },
  error: { word: "Error", path: "M12 8v5M12 16h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z", ring: "#b3261e" },
} as const;
const palettes = {
  light: {
    surface: { info: "#eff4ff", success: "#ecf7ef", warning: "#fdf4e3", error: "#fdeceb" },
    text: "#16121f",
    muted: "#4d4a57",
    tone: { info: "#1b4ab0", success: "#14632c", warning: "#7a4a00", error: "#a01b14" },
  },
  dark: {
    surface: { info: "#161f36", success: "#132a1c", warning: "#2c2110", error: "#2e1615" },
    text: "#f6f5fa",
    muted: "#b6b3c2",
    tone: { info: "#9db8ff", success: "#7fd79b", warning: "#f0c069", error: "#ff9d95" },
  },
};

const darkMedia = {
  subscribe: (onChange: () => void) => {
    const list = window.matchMedia("(prefers-color-scheme: dark)");
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  },
  get: () => window.matchMedia("(prefers-color-scheme: dark)").matches,
};

const safeHref = (value: string) => (/^(\/|#|https?:\/\/|mailto:|tel:)/i.test(value.trim()) ? value.trim() : "#");

export function AlertBanner({ config = defaultConfig }: { config?: AlertBannerConfig }) {
  const [gone, setGone] = useState(false);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const tone = tones[config.tone];
  const style = {
    "--ab-surface": palette.surface[config.tone],
    "--ab-tone": palette.tone[config.tone],
    "--ab-text": palette.text,
    "--ab-muted": palette.muted,
  } as CSSProperties;

  if (gone) return null;

  return (
    <div
      style={style}
      // An error interrupts; anything else waits its turn.
      role={config.tone === "error" ? "alert" : "status"}
      className="flex max-w-2xl items-start gap-3 rounded-lg border-l-4 border-(--ab-tone) bg-(--ab-surface) p-4 text-(--ab-text)"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="mt-0.5 size-5 shrink-0 text-(--ab-tone)">
        <path d={tone.path} />
      </svg>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">
          <span className="sr-only">{tone.word}: </span>
          {config.title}
        </p>
        {config.body.trim() !== "" && <p className="mt-0.5 text-sm text-(--ab-muted)">{config.body}</p>}
        {config.actionText.trim() !== "" && (
          <p className="mt-2">
            <a
              href={safeHref(config.actionUrl)}
              className="inline-block py-1 text-sm font-semibold text-(--ab-tone) underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ab-tone)"
            >
              {config.actionText}
            </a>
          </p>
        )}
      </div>
      {config.dismissible && (
        <button
          type="button"
          aria-label={`Dismiss: ${config.title}`}
          onClick={() => {
            setGone(true);
            // The message goes; focus must not go with it. Put it on whatever the page marks as
            // the place to land, or let it fall to the page if nothing is marked.
            const after = document.querySelector<HTMLElement>("[data-after-dismiss]");
            window.requestAnimationFrame(() => after?.focus());
          }}
          className="-m-1 grid size-8 shrink-0 cursor-pointer place-items-center rounded-md text-(--ab-muted) hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ab-tone)"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      )}
    </div>
  );
}
