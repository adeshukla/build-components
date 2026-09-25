"use client";

import { useSyncExternalStore, type CSSProperties } from "react";

export type BadgeConfig = {
  items: { text: string; tone: string }[];
  variant: "soft" | "solid" | "outline";
  showDot: boolean;
  size: "sm" | "md";
  theme: "light" | "dark" | "system";
};

// @config-start
const defaultConfig: BadgeConfig = {
  items: [
    { text: "Live", tone: "success" },
    { text: "In review", tone: "info" },
    { text: "Needs changes", tone: "warning" },
    { text: "Failed", tone: "error" },
    { text: "Draft", tone: "neutral" },
  ],
  variant: "soft",
  showDot: true,
  size: "md",
  theme: "light",
};
// @config-end

type Tone = "neutral" | "info" | "success" | "warning" | "error";
const toneNames: Tone[] = ["neutral", "info", "success", "warning", "error"];
/** Every tone carries its own text and dot, so colour is never the only thing saying what it is. */
const colours = {
  light: {
    neutral: { soft: "#eeecf5", ink: "#3b3747", strong: "#4d4a57" },
    info: { soft: "#eff4ff", ink: "#1b4ab0", strong: "#2563eb" },
    success: { soft: "#ecf7ef", ink: "#14632c", strong: "#146c2e" },
    warning: { soft: "#fdf4e3", ink: "#7a4a00", strong: "#8a5300" },
    error: { soft: "#fdeceb", ink: "#a01b14", strong: "#b3261e" },
  },
  dark: {
    neutral: { soft: "#2a2438", ink: "#d7d3e2", strong: "#b6b3c2" },
    info: { soft: "#161f36", ink: "#9db8ff", strong: "#6d93ff" },
    success: { soft: "#132a1c", ink: "#7fd79b", strong: "#4dbb74" },
    warning: { soft: "#2c2110", ink: "#f0c069", strong: "#d9a03f" },
    error: { soft: "#2e1615", ink: "#ff9d95", strong: "#ff6b6b" },
  },
};
const sizes = { sm: "min-h-5 gap-1 px-2 text-xs", md: "min-h-6 gap-1.5 px-2.5 text-sm" };

const darkMedia = {
  subscribe: (onChange: () => void) => {
    const list = window.matchMedia("(prefers-color-scheme: dark)");
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  },
  get: () => window.matchMedia("(prefers-color-scheme: dark)").matches,
};

const toneOf = (value: string): Tone => (toneNames.includes(value as Tone) ? (value as Tone) : "neutral");

export function Badge({ config = defaultConfig }: { config?: BadgeConfig }) {
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = colours[dark ? "dark" : "light"];
  const items = config.items.filter((item) => item.text.trim() !== "");

  return (
    <ul className="flex flex-wrap items-center gap-2">
      {items.map((item, index) => {
        const tone = palette[toneOf(item.tone)];
        const style = {
          "--bd-soft": tone.soft,
          "--bd-ink": tone.ink,
          "--bd-strong": tone.strong,
          "--bd-on-strong": dark ? "#141019" : "#ffffff",
        } as CSSProperties;
        const look =
          config.variant === "solid"
            ? "bg-(--bd-strong) text-(--bd-on-strong)"
            : config.variant === "outline"
              ? "border border-(--bd-ink) text-(--bd-ink)"
              : "bg-(--bd-soft) text-(--bd-ink)";
        return (
          <li key={`${item.text}-${index}`}>
            <span
              style={style}
              className={`inline-flex items-center rounded-full font-medium ${sizes[config.size]} ${look}`}
            >
              {config.showDot && (
                <span
                  aria-hidden="true"
                  className={`size-1.5 shrink-0 rounded-full ${config.variant === "solid" ? "bg-(--bd-on-strong)" : "bg-(--bd-strong)"}`}
                />
              )}
              {item.text}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
