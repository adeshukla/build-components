"use client";

import { useId, useState, useSyncExternalStore, type CSSProperties } from "react";

export type SwitchConfig = {
  label: string;
  hint: string;
  startOn: boolean;
  labelFirst: boolean;
  showState: boolean;
  size: "sm" | "md";
  name: string;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: SwitchConfig = {
  label: "Email notifications",
  hint: "We'll email you when someone replies.",
  startOn: true,
  labelFirst: true,
  showState: true,
  size: "md",
  name: "notifications",
  theme: "light",
  accentColor: "#2563eb",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", muted: "#4d4a57", track: "#8e8a99" },
  dark: { surface: "#141019", text: "#f6f5fa", muted: "#b6b3c2", track: "#6f6a7d" },
};
const sizes = {
  sm: { track: "h-5 w-9", thumb: "size-4", travel: "translate-x-4" },
  md: { track: "h-6 w-11", thumb: "size-5", travel: "translate-x-5" },
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

export function Switch({ config = defaultConfig }: { config?: SwitchConfig }) {
  const id = useId();
  const [on, setOn] = useState(config.startOn);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const size = sizes[config.size];
  const style = {
    "--sw-accent": config.accentColor,
    "--sw-accent-text": readableAccent(config.accentColor, dark),
    "--sw-surface": palette.surface,
    "--sw-text": palette.text,
    "--sw-muted": palette.muted,
    "--sw-track": palette.track,
  } as CSSProperties;
  const hint = config.hint.trim();

  return (
    <div style={style} className="max-w-md bg-(--sw-surface) text-(--sw-text)">
      {/*
        A real checkbox with role="switch": the keyboard, the label and form submission come from
        the browser, and screen readers say "on" or "off" instead of "ticked".
      */}
      <label
        htmlFor={`${id}-switch`}
        className={`flex cursor-pointer items-start gap-3 ${config.labelFirst ? "" : "flex-row-reverse justify-end"}`}
      >
        <span className="flex-1">
          <span className="block font-medium">{config.label}</span>
          {hint !== "" && (
            <span id={`${id}-hint`} className="block text-sm text-(--sw-muted)">
              {hint}
            </span>
          )}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {config.showState && (
            <span aria-hidden="true" className="text-sm text-(--sw-muted) tabular-nums">
              {on ? "On" : "Off"}
            </span>
          )}
          <span className="relative inline-flex">
            <input
              id={`${id}-switch`}
              type="checkbox"
              role="switch"
              name={config.name || undefined}
              checked={on}
              aria-describedby={hint !== "" ? `${id}-hint` : undefined}
              onChange={(event) => setOn(event.target.checked)}
              className={`peer absolute inset-0 z-10 cursor-pointer opacity-0`}
            />
            <span
              aria-hidden="true"
              className={`flex items-center rounded-full p-0.5 transition-colors duration-200 outline-offset-2 outline-(--sw-accent-text) peer-checked:bg-(--sw-accent) peer-focus-visible:outline-2 motion-reduce:transition-none ${size.track} ${on ? "" : "bg-(--sw-track)"}`}
            >
              <span
                className={`rounded-full bg-white shadow transition-transform duration-200 motion-reduce:transition-none ${size.thumb} ${on ? size.travel : "translate-x-0"}`}
              />
            </span>
          </span>
        </span>
      </label>
    </div>
  );
}
