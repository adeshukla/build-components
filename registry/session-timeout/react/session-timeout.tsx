"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export type SessionTimeoutConfig = {
  idleSeconds: number;
  countdownSeconds: number;
  title: string;
  message: string;
  stayText: string;
  signOutText: string;
  watchActivity: boolean;
  showTrigger: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: SessionTimeoutConfig = {
  idleSeconds: 60,
  countdownSeconds: 30,
  title: "Still there?",
  message: "You have been quiet for a while. We will sign you out to keep the account safe.",
  stayText: "Stay signed in",
  signOutText: "Sign out now",
  watchActivity: true,
  showTrigger: true,
  theme: "light",
  accentColor: "#1d4ed8",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#1c1826", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
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

/** m:ss by hand: Intl output differs between the server and the browser and breaks hydration. */
function clock(seconds: number) {
  const whole = Math.max(0, Math.round(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

/** The marks worth saying out loud; every second would talk over the person. */
const SPOKEN = [30, 20, 10, 5];

export function SessionTimeout({ config = defaultConfig }: { config?: SessionTimeoutConfig }) {
  const id = useId();
  const [warning, setWarning] = useState(false);
  const [left, setLeft] = useState(config.countdownSeconds);
  const [said, setSaid] = useState("");
  const [result, setResult] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stayRef = useRef<HTMLButtonElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const leftRef = useRef(config.countdownSeconds);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--st-accent": config.accentColor,
    "--st-accent-text": readableAccent(config.accentColor, dark),
    "--st-on-accent": luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff",
    "--st-surface": palette.surface,
    "--st-sunk": palette.sunk,
    "--st-text": palette.text,
    "--st-muted": palette.muted,
    "--st-line": palette.line,
  } as CSSProperties;

  // Safari does not focus a button when it is clicked, so the opener is passed in rather than read
  // from document.activeElement, which would be the body there.
  function warn(from?: HTMLElement | null) {
    leftRef.current = Math.max(5, config.countdownSeconds);
    setLeft(leftRef.current);
    setSaid("");
    setResult("");
    returnTo.current = from ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    setWarning(true);
  }

  function finish(outcome: string) {
    setResult(outcome);
    setWarning(false);
    // Closed here rather than left to the render: focus cannot leave a modal dialog that is still
    // open, which is what Safari enforces.
    dialogRef.current?.close();
    returnTo.current?.focus();
  }

  // Nothing happening for a while is what starts the warning. Any real activity puts the clock back.
  useEffect(() => {
    if (warning) return;
    const wait = Math.max(5, config.idleSeconds) * 1000;
    const start = () => window.setTimeout(() => warn(), wait);
    let timer = start();
    const restart = () => {
      window.clearTimeout(timer);
      timer = start();
    };
    const events = ["pointerdown", "keydown", "scroll"] as const;
    if (config.watchActivity) events.forEach((event) => document.addEventListener(event, restart, { passive: true }));
    return () => {
      window.clearTimeout(timer);
      if (config.watchActivity) events.forEach((event) => document.removeEventListener(event, restart));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- warn is stable enough: it only reads config and refs.
  }, [warning, config.idleSeconds, config.countdownSeconds, config.watchActivity]);

  // The countdown itself, plus the announcements at the marks worth hearing.
  useEffect(() => {
    if (!warning) return;
    const dialog = dialogRef.current;
    dialog?.showModal();
    stayRef.current?.focus();
    const tick = window.setInterval(() => {
      leftRef.current -= 1;
      setLeft(leftRef.current);
      if (SPOKEN.includes(leftRef.current)) setSaid(`${leftRef.current} seconds left`);
      if (leftRef.current <= 0) {
        window.clearInterval(tick);
        finish("Signed out");
      }
    }, 1000);
    return () => {
      window.clearInterval(tick);
      if (dialog?.open) dialog.close();
    };
  }, [warning]);

  return (
    <div style={style} className="bg-(--st-surface) text-(--st-text)">
      {config.showTrigger && (
        // Nobody wants to wait out the idle timer to see this: the button starts the warning now.
        <button
          type="button"
          onClick={(event) => warn(event.currentTarget)}
          className="min-h-11 cursor-pointer rounded-md border border-(--st-line) px-4 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--st-accent-text)"
        >
          Show the warning now
        </button>
      )}

      <dialog
        ref={dialogRef}
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-message`}
        onCancel={(event) => {
          // Escape must not sign anyone out by accident: treat it as staying.
          event.preventDefault();
          finish("Still signed in");
        }}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const items = [...(dialogRef.current?.querySelectorAll<HTMLElement>("button") ?? [])];
          if (items.length === 0) return;
          const first = items[0];
          const last = items[items.length - 1];
          if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          } else if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          }
        }}
        className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-xl border border-(--st-line) bg-(--st-surface) p-5 text-(--st-text) backdrop:bg-black/50"
      >
        <h2 id={`${id}-title`} className="text-lg font-semibold">
          {config.title}
        </h2>
        <p id={`${id}-message`} className="mt-2 text-sm text-(--st-muted)">
          {config.message}
        </p>
        {/* The ticking number is not a live region: it would be read every second. */}
        <p aria-hidden="true" className="mt-3 text-2xl font-semibold tabular-nums">
          {clock(left)}
        </p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => finish("Signed out")}
            className="min-h-11 cursor-pointer rounded-md border border-(--st-line) px-4 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--st-accent-text)"
          >
            {config.signOutText}
          </button>
          <button
            ref={stayRef}
            type="button"
            onClick={() => finish("Still signed in")}
            className="min-h-11 cursor-pointer rounded-md bg-(--st-accent) px-4 font-medium text-(--st-on-accent) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--st-accent-text)"
          >
            {config.stayText}
          </button>
        </div>
      </dialog>

      {/* Two separate regions: the countdown marks while it runs, the outcome once it stops. */}
      <p role="status" className="mt-3 text-sm text-(--st-muted)">
        {warning ? said : result}
      </p>
    </div>
  );
}
