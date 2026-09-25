"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export type ShortcutHelpConfig = {
  openKey: "?" | "/" | "F1";
  title: string;
  hint: string;
  triggerText: string;
  showTrigger: boolean;
  shortcuts: { keys: string; action: string }[];
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: ShortcutHelpConfig = {
  openKey: "?",
  title: "Keyboard shortcuts",
  hint: "Press ? at any time to bring this back.",
  triggerText: "Keyboard shortcuts",
  showTrigger: true,
  shortcuts: [
    { keys: "?", action: "Open this list" },
    { keys: "g then h", action: "Go home" },
    { keys: "g then p", action: "Go to projects" },
    { keys: "/", action: "Jump to search" },
    { keys: "n", action: "New item" },
    { keys: "e", action: "Edit the selected item" },
    { keys: "Escape", action: "Close whatever is open" },
  ],
  theme: "light",
  accentColor: "#0f766e",
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

/** A single key pressed while typing belongs to the field, not to the page. */
function isTyping(target: EventTarget | null) {
  const element = target as HTMLElement | null;
  if (!element) return false;
  const tag = element.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || element.isContentEditable;
}

export function ShortcutHelp({ config = defaultConfig }: { config?: ShortcutHelpConfig }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--sh-accent": config.accentColor,
    "--sh-accent-text": readableAccent(config.accentColor, dark),
    "--sh-on-accent": luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff",
    "--sh-surface": palette.surface,
    "--sh-sunk": palette.sunk,
    "--sh-text": palette.text,
    "--sh-muted": palette.muted,
    "--sh-line": palette.line,
  } as CSSProperties;

  const shortcuts = config.shortcuts.filter((shortcut) => shortcut.action.trim() !== "");

  // The one shortcut that has to work from anywhere on the page — except from inside a field.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== config.openKey || event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTyping(event.target)) return;
      event.preventDefault();
      returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setOpen(true);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [config.openKey]);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    dialog?.showModal();
    closeRef.current?.focus();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, [open]);

  function close() {
    setOpen(false);
    // Closed here rather than left to the render: focus cannot leave a modal dialog that is still
    // open, which is what Safari enforces.
    dialogRef.current?.close();
    returnTo.current?.focus();
  }

  return (
    <div style={style} className="bg-(--sh-surface) text-(--sh-text)">
      {config.showTrigger && (
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={() => {
            returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            setOpen(true);
          }}
          className="min-h-11 cursor-pointer rounded-md border border-(--sh-line) px-4 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--sh-accent-text)"
        >
          {config.triggerText}
          <kbd className="ml-2 rounded border border-(--sh-line) bg-(--sh-sunk) px-1.5 py-0.5 font-mono text-xs">{config.openKey}</kbd>
        </button>
      )}

      <dialog
        ref={dialogRef}
        aria-labelledby={`${id}-title`}
        onCancel={(event) => {
          event.preventDefault();
          close();
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
        className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-xl border border-(--sh-line) bg-(--sh-surface) p-5 text-(--sh-text) backdrop:bg-black/50"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={`${id}-title`} className="text-lg font-semibold">
            {config.title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            className="-m-1 grid size-11 shrink-0 cursor-pointer place-items-center rounded-md text-(--sh-muted) hover:bg-(--sh-sunk) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--sh-accent-text)"
          >
            <span className="sr-only">Close the shortcut list</span>
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-5">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        {/* A description list: the keys are the term, what they do is the description. */}
        <dl className="mt-4 grid gap-2">
          {shortcuts.map((shortcut) => (
            <div key={`${shortcut.keys}-${shortcut.action}`} className="flex items-baseline justify-between gap-4 border-b border-(--sh-line) pb-2 last:border-0">
              <dt className="shrink-0">
                {shortcut.keys.split(" then ").map((part, index) => (
                  <span key={part + index}>
                    {index > 0 && <span className="mx-1 text-sm text-(--sh-muted)">then</span>}
                    <kbd className="rounded border border-(--sh-line) bg-(--sh-sunk) px-1.5 py-0.5 font-mono text-xs">{part}</kbd>
                  </span>
                ))}
              </dt>
              <dd className="m-0 text-right text-sm text-(--sh-muted)">{shortcut.action}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-4 text-sm text-(--sh-muted)">{config.hint}</p>
      </dialog>
    </div>
  );
}
