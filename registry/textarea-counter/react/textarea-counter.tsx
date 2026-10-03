"use client";

import { useId, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export type TextareaCounterConfig = {
  label: string;
  hint: string;
  placeholder: string;
  name: string;
  rows: number;
  maxLength: number;
  allowOver: boolean;
  warnAt: number;
  overText: string;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: TextareaCounterConfig = {
  label: "What went wrong?",
  hint: "Anything you can tell us helps: what you were doing, what you expected.",
  placeholder: "",
  name: "details",
  rows: 4,
  maxLength: 200,
  allowOver: true,
  warnAt: 40,
  overText: "That is over the limit. Shorten it before sending.",
  theme: "light",
  accentColor: "#1d4ed8",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6", error: "#b42318" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459", error: "#ff9d95" },
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

const plural = (n: number) => `${n} character${n === 1 ? "" : "s"}`;

export function TextareaCounter({ config = defaultConfig }: { config?: TextareaCounterConfig }) {
  const id = useId();
  const [value, setValue] = useState("");
  const [said, setSaid] = useState("");
  const lastSaid = useRef("");
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--tc-accent": config.accentColor,
    "--tc-accent-text": readableAccent(config.accentColor, dark),
    "--tc-surface": `var(--bc-${dark ? "dark" : "light"}-surface, ${palette.surface})`,
    "--tc-sunk": `var(--bc-${dark ? "dark" : "light"}-sunk, ${palette.sunk})`,
    "--tc-text": `var(--bc-${dark ? "dark" : "light"}-text, ${palette.text})`,
    "--tc-muted": `var(--bc-${dark ? "dark" : "light"}-muted, ${palette.muted})`,
    "--tc-line": `var(--bc-${dark ? "dark" : "light"}-line, ${palette.line})`,
    "--tc-error": palette.error,
  } as CSSProperties;

  const left = config.maxLength - value.length;
  const over = left < 0;
  const warning = !over && left <= config.warnAt;
  const counter = over ? `${plural(-left)} over the limit` : `${plural(left)} left`;

  return (
    <div style={style} className="bg-(--tc-surface) text-(--tc-text)">
      <label htmlFor={`${id}-field`} className="block font-medium">
        {config.label}
      </label>
      {config.hint.trim() !== "" && (
        <p id={`${id}-hint`} className="text-sm text-(--tc-muted)">
          {config.hint}
        </p>
      )}

      <textarea
        id={`${id}-field`}
        name={config.name}
        rows={Math.max(2, config.rows)}
        value={value}
        placeholder={config.placeholder}
        // With the hard limit the browser stops the typing; without it people can paste and then trim,
        // which is kinder than silently swallowing the end of a pasted sentence.
        maxLength={config.allowOver ? undefined : config.maxLength}
        aria-invalid={over ? true : undefined}
        aria-describedby={`${config.hint.trim() === "" ? "" : `${id}-hint `}${id}-counter${over ? ` ${id}-error` : ""}`}
        onChange={(event) => {
          const next = event.target.value;
          setValue(next);
          // Said at the marks that matter, not on every keystroke: a live counter would read the
          // whole number out again for every letter typed.
          const remaining = config.maxLength - next.length;
          const phrase =
            remaining < 0 ? `${plural(-remaining)} over the limit` : remaining <= config.warnAt ? `${plural(remaining)} left` : "";
          const mark = remaining < 0 ? "over" : remaining === 0 ? "none" : remaining <= config.warnAt ? "warn" : "fine";
          if (mark !== lastSaid.current) {
            lastSaid.current = mark;
            setSaid(phrase);
          }
        }}
        className={`mt-2 w-full rounded-[var(--bc-radius-sm,0.375rem)] border bg-(--tc-sunk) p-3 text-(--tc-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--tc-accent-text) ${
          over ? "border-(--tc-error)" : "border-(--tc-line)"
        }`}
      />

      <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
        {/* The number itself is not a live region; the status line below carries what is worth saying. */}
        <p id={`${id}-counter`} className={`text-sm tabular-nums ${over ? "font-medium text-(--tc-error)" : warning ? "text-(--tc-text)" : "text-(--tc-muted)"}`}>
          {counter}
        </p>
        <p className="font-mono text-xs text-(--tc-muted) tabular-nums">{`${value.length} / ${config.maxLength}`}</p>
      </div>

      {over && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-sm text-(--tc-error)">
          {config.overText}
        </p>
      )}

      <p role="status" className="sr-only">
        {said}
      </p>
    </div>
  );
}
