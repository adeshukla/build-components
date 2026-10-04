"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export type CountdownConfig = {
  label: string;
  target: string;
  finishedText: string;
  showSeconds: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
  dayOne: string;
  dayMany: string;
  hourOne: string;
  hourMany: string;
  minuteOne: string;
  minuteMany: string;
  secondOne: string;
  secondMany: string;
  twoText: string;
  oneText: string;
  daysLabel: string;
  hoursLabel: string;
  minutesLabel: string;
  secondsLabel: string;
  waitingText: string;
};

// @config-start
const defaultConfig: CountdownConfig = {
  label: "Doors open in",
  target: "2026-12-24T18:00",
  finishedText: "Doors are open.",
  showSeconds: true,
  theme: "light",
  accentColor: "#b45309",
  dayOne: "{count} day",
  dayMany: "{count} days",
  hourOne: "{count} hour",
  hourMany: "{count} hours",
  minuteOne: "{count} minute",
  minuteMany: "{count} minutes",
  secondOne: "{count} second",
  secondMany: "{count} seconds",
  twoText: "{first} and {second} left",
  oneText: "{first} left",
  daysLabel: "days",
  hoursLabel: "hours",
  minutesLabel: "minutes",
  secondsLabel: "seconds",
  waitingText: "Working out the time left…",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
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

type Parts = { days: number; hours: number; minutes: number; seconds: number; done: boolean };

/** Whole units left, worked out by hand: Intl would disagree between the server and the browser. */
function split(target: string): Parts {
  const end = new Date(target).getTime();
  const left = Math.max(0, Math.floor((end - Date.now()) / 1000));
  return {
    days: Math.floor(left / 86400),
    hours: Math.floor((left % 86400) / 3600),
    minutes: Math.floor((left % 3600) / 60),
    seconds: left % 60,
    done: Number.isNaN(end) || left === 0,
  };
}

const unit = (value: number, one: string, many: string) => fill(value === 1 ? one : many, { count: value });

/** What a screen reader hears: the coarse reading, without the second hand ticking over it. */
function spoken(parts: Parts, w: CountdownConfig) {
  if (parts.done) return "";
  const days = unit(parts.days, w.dayOne, w.dayMany);
  const hours = unit(parts.hours, w.hourOne, w.hourMany);
  const minutes = unit(parts.minutes, w.minuteOne, w.minuteMany);
  if (parts.days > 0) return fill(w.twoText, { first: days, second: hours });
  if (parts.hours > 0) return fill(w.twoText, { first: hours, second: minutes });
  if (parts.minutes > 0) return fill(w.oneText, { first: minutes });
  return fill(w.oneText, { first: unit(parts.seconds, w.secondOne, w.secondMany) });
}

/** Words with something put in them: "{count} left" (D94). */
const fill = (words: string, values: Record<string, string | number>) => words.replace(/\{(\w+)\}/g, (match, name) => String(values[name] ?? match));

export function Countdown({ config = defaultConfig }: { config?: CountdownConfig }) {
  // Time is read on the client only: a server-rendered clock would differ from the first paint.
  const [parts, setParts] = useState<Parts | null>(null);
  const [said, setSaid] = useState("");
  const lastSaid = useRef("");
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--cn-accent": config.accentColor,
    "--cn-accent-text": readableAccent(config.accentColor, dark),
    "--cn-surface": `var(--bc-${dark ? "dark" : "light"}-surface, ${palette.surface})`,
    "--cn-sunk": `var(--bc-${dark ? "dark" : "light"}-sunk, ${palette.sunk})`,
    "--cn-text": `var(--bc-${dark ? "dark" : "light"}-text, ${palette.text})`,
    "--cn-muted": `var(--bc-${dark ? "dark" : "light"}-muted, ${palette.muted})`,
    "--cn-line": `var(--bc-${dark ? "dark" : "light"}-line, ${palette.line})`,
  } as CSSProperties;

  useEffect(() => {
    function tick() {
      const next = split(config.target);
      setParts(next);
      // Said when the coarse reading changes — once a minute, not once a second.
      const phrase = next.done ? config.finishedText : spoken(next, config);
      if (phrase !== lastSaid.current) {
        lastSaid.current = phrase;
        setSaid(phrase);
      }
    }
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [config.target, config.finishedText]);

  const boxes: { key: string; value: number; name: string }[] = parts
    ? [
        { key: "days", value: parts.days, name: config.daysLabel },
        { key: "hours", value: parts.hours, name: config.hoursLabel },
        { key: "minutes", value: parts.minutes, name: config.minutesLabel },
        ...(config.showSeconds ? [{ key: "seconds", value: parts.seconds, name: config.secondsLabel }] : []),
      ]
    : [];

  return (
    <div style={style} className="bg-(--cn-surface) text-(--cn-text)">
      <p className="text-sm text-(--cn-muted)">{config.label}</p>

      {parts === null ? (
        <p className="mt-1 text-sm text-(--cn-muted)">{config.waitingText}</p>
      ) : parts.done ? (
        <p className="mt-1 text-xl font-semibold">{config.finishedText}</p>
      ) : (
        // The digits tick every second, so they are hidden from the reading order and said separately.
        <ol aria-hidden="true" className="mt-1 flex list-none flex-wrap gap-2 p-0">
          {boxes.map((box) => (
            <li key={box.key} className="min-w-16 rounded-[var(--bc-radius-md,0.5rem)] border border-(--cn-line) bg-(--cn-sunk) px-3 py-2 text-center">
              <span className="block text-2xl font-semibold tabular-nums">{box.value}</span>
              <span className="block text-xs text-(--cn-muted)">{box.name}</span>
            </li>
          ))}
        </ol>
      )}

      <p role="status" className="mt-2 text-sm text-(--cn-muted)">
        {said}
      </p>
    </div>
  );
}
