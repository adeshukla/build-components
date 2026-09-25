"use client";

import { useId, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export type ConfirmDialogConfig = {
  triggerText: string;
  title: string;
  message: string;
  requirePhrase: boolean;
  phrase: string;
  confirmText: string;
  cancelText: string;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: ConfirmDialogConfig = {
  triggerText: "Delete workspace",
  title: "Delete this workspace?",
  message: "Everything in it goes with it: boards, files and invites. This cannot be undone.",
  requirePhrase: true,
  phrase: "DELETE",
  confirmText: "Delete workspace",
  cancelText: "Keep it",
  theme: "light",
  accentColor: "#b42318",
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

export function ConfirmDialog({ config = defaultConfig }: { config?: ConfirmDialogConfig }) {
  const id = useId();
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const fieldRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--cd-accent": config.accentColor,
    "--cd-accent-text": readableAccent(config.accentColor, dark),
    "--cd-on-accent": luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff",
    "--cd-surface": palette.surface,
    "--cd-sunk": palette.sunk,
    "--cd-text": palette.text,
    "--cd-muted": palette.muted,
    "--cd-line": palette.line,
  } as CSSProperties;

  // The phrase is compared as typed, apart from spaces either side: a near miss is not a match.
  const matches = !config.requirePhrase || typed.trim() === config.phrase;

  function open() {
    setTyped("");
    setResult("");
    dialogRef.current?.showModal();
    (config.requirePhrase ? fieldRef.current : cancelRef.current)?.focus();
  }

  function close(outcome: string) {
    setResult(outcome);
    dialogRef.current?.close();
    triggerRef.current?.focus();
  }

  // Keep Tab inside the dialog (APG dialog pattern).
  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key !== "Tab") return;
    const items = [...(dialogRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), input") ?? [])];
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
  }

  return (
    <div style={style} className="bg-(--cd-surface) text-(--cd-text)">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        onClick={open}
        className="min-h-11 cursor-pointer rounded-md bg-(--cd-accent) px-4 font-medium text-(--cd-on-accent) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--cd-accent-text)"
      >
        {config.triggerText}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-message`}
        onKeyDown={onKeyDown}
        onCancel={() => close("Cancelled")}
        className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-xl border border-(--cd-line) bg-(--cd-surface) p-5 text-(--cd-text) backdrop:bg-black/50"
      >
        <h2 id={`${id}-title`} className="text-lg font-semibold">
          {config.title}
        </h2>
        <p id={`${id}-message`} className="mt-2 text-sm text-(--cd-muted)">
          {config.message}
        </p>

        {config.requirePhrase && (
          <div className="mt-4">
            <label htmlFor={`${id}-field`} className="block text-sm font-medium">
              {`Type ${config.phrase} to confirm`}
            </label>
            <input
              ref={fieldRef}
              id={`${id}-field`}
              type="text"
              value={typed}
              autoComplete="off"
              spellCheck={false}
              aria-describedby={`${id}-hint`}
              onChange={(event) => setTyped(event.target.value)}
              className="mt-1 min-h-11 w-full rounded-md border border-(--cd-line) bg-(--cd-sunk) px-3 text-(--cd-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--cd-accent-text)"
            />
            {/* Says why the button is off, rather than leaving a dead button to work out. */}
            <p id={`${id}-hint`} className="mt-1 text-sm text-(--cd-muted)">
              {matches ? "That matches. The button below is now live." : `${config.confirmText} stays off until the words match exactly.`}
            </p>
          </div>
        )}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={() => close("Cancelled")}
            className="min-h-11 cursor-pointer rounded-md border border-(--cd-line) px-4 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--cd-accent-text)"
          >
            {config.cancelText}
          </button>
          <button
            type="button"
            disabled={!matches}
            onClick={() => close("Confirmed")}
            className="min-h-11 cursor-pointer rounded-md bg-(--cd-accent) px-4 font-medium text-(--cd-on-accent) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--cd-accent-text) disabled:cursor-not-allowed disabled:opacity-50"
          >
            {config.confirmText}
          </button>
        </div>
      </dialog>

      <p role="status" className="mt-3 text-sm text-(--cd-muted)">
        {result}
      </p>
    </div>
  );
}
