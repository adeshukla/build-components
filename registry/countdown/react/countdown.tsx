"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export type CountdownConfig = {
  label: string;
  target: string;
  finishedText: string;
  showSeconds: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: CountdownConfig = {
  label: "Doors open in",
  target: "2026-12-24T18:00",
  finishedText: "Doors are open.",
  showSeconds: true,
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

const unit = (value: number, name: string) => `${value} ${name}${value === 1 ? "" : "s"}`;

/** What a screen reader hears: the coarse reading, without the second hand ticking over it. */
function spoken(parts: Parts) {
  if (parts.done) return "";
  if (parts.days > 0) return `${unit(parts.days, "day")} and ${unit(parts.hours, "hour")} left`;
  if (parts.hours > 0) return `${unit(parts.hours, "hour")} and ${unit(parts.minutes, "minute")} left`;
  if (parts.minutes > 0) return `${unit(parts.minutes, "minute")} left`;
  return `${unit(parts.seconds, "second")} left`;
}

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
    "--cn-surface": palette.surface,
    "--cn-sunk": palette.sunk,
    "--cn-text": palette.text,
    "--cn-muted": palette.muted,
    "--cn-line": palette.line,
  } as CSSProperties;

  useEffect(() => {
    function tick() {
      const next = split(config.target);
      setParts(next);
      // Said when the coarse reading changes — once a minute, not once a second.
      const phrase = next.done ? config.finishedText : spoken(next);
      if (phrase !== lastSaid.current) {
        lastSaid.current = phrase;
        setSaid(phrase);
      }
    }
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [config.target, config.finishedText]);

  const boxes: { value: number; name: string }[] = parts
    ? [
        { value: parts.days, name: "days" },
        { value: parts.hours, name: "hours" },
        { value: parts.minutes, name: "minutes" },
        ...(config.showSeconds ? [{ value: parts.seconds, name: "seconds" }] : []),
      ]
    : [];

  return (
    <div style={style} className="bg-(--cn-surface) text-(--cn-text)">
      <p className="text-sm text-(--cn-muted)">{config.label}</p>

      {parts === null ? (
        <p className="mt-1 text-sm text-(--cn-muted)">Working out the time left…</p>
      ) : parts.done ? (
        <p className="mt-1 text-xl font-semibold">{config.finishedText}</p>
      ) : (
        // The digits tick every second, so they are hidden from the reading order and said separately.
        <ol aria-hidden="true" className="mt-1 flex list-none gap-2 p-0">
          {boxes.map((box) => (
            <li key={box.name} className="min-w-16 rounded-lg border border-(--cn-line) bg-(--cn-sunk) px-3 py-2 text-center">
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
