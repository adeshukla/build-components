"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export type UnsavedChangesConfig = {
  label: string;
  placeholder: string;
  leaveText: string;
  saveText: string;
  title: string;
  message: string;
  stayText: string;
  discardText: string;
  warnOnReload: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: UnsavedChangesConfig = {
  label: "Draft note",
  placeholder: "Type something, then try to leave.",
  leaveText: "Back to all notes",
  saveText: "Save",
  title: "Leave without saving?",
  message: "You have typed something that has not been saved. Leaving now loses it.",
  stayText: "Keep editing",
  discardText: "Discard and leave",
  warnOnReload: true,
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

export function UnsavedChanges({ config = defaultConfig }: { config?: UnsavedChangesConfig }) {
  const id = useId();
  const [text, setText] = useState("");
  const [saved, setSaved] = useState("");
  const [result, setResult] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const leaveRef = useRef<HTMLButtonElement>(null);
  const stayRef = useRef<HTMLButtonElement>(null);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--uc-accent": config.accentColor,
    "--uc-accent-text": readableAccent(config.accentColor, dark),
    "--uc-on-accent": luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff",
    "--uc-surface": palette.surface,
    "--uc-sunk": palette.sunk,
    "--uc-text": palette.text,
    "--uc-muted": palette.muted,
    "--uc-line": palette.line,
  } as CSSProperties;

  const dirty = text !== saved;

  // The browser's own warning, for closing the tab or reloading. It only gets to ask while there is
  // something to lose, and the browser writes the wording itself.
  useEffect(() => {
    if (!config.warnOnReload || !dirty) return;
    const ask = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", ask);
    return () => window.removeEventListener("beforeunload", ask);
  }, [config.warnOnReload, dirty]);

  function leave() {
    if (!dirty) {
      setResult("Left with nothing unsaved");
      return;
    }
    dialogRef.current?.showModal();
    stayRef.current?.focus();
  }

  function stay() {
    dialogRef.current?.close();
    leaveRef.current?.focus();
  }

  function discard() {
    setText(saved);
    setResult("Left, changes discarded");
    dialogRef.current?.close();
    leaveRef.current?.focus();
  }

  return (
    <div style={style} className="bg-(--uc-surface) text-(--uc-text)">
      <label htmlFor={`${id}-field`} className="block text-sm font-medium">
        {config.label}
      </label>
      <textarea
        id={`${id}-field`}
        rows={3}
        value={text}
        placeholder={config.placeholder}
        onChange={(event) => setText(event.target.value)}
        aria-describedby={`${id}-dirty`}
        className="mt-1 w-full rounded-md border border-(--uc-line) bg-(--uc-sunk) p-3 text-(--uc-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--uc-accent-text)"
      />

      {/* Said once, when it changes, so nobody is told on every keystroke. */}
      <p id={`${id}-dirty`} role="status" className="mt-1 text-sm text-(--uc-muted)">
        {dirty ? "Unsaved changes" : "Nothing to save"}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setSaved(text);
            setResult("Saved");
          }}
          className="min-h-11 cursor-pointer rounded-md bg-(--uc-accent) px-4 font-medium text-(--uc-on-accent) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--uc-accent-text)"
        >
          {config.saveText}
        </button>
        <button
          ref={leaveRef}
          type="button"
          onClick={leave}
          className="min-h-11 cursor-pointer rounded-md border border-(--uc-line) px-4 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--uc-accent-text)"
        >
          {config.leaveText}
        </button>
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-message`}
        onCancel={(event) => {
          // Escape is the cautious choice: stay on the page and keep the text.
          event.preventDefault();
          stay();
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
        className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-xl border border-(--uc-line) bg-(--uc-surface) p-5 text-(--uc-text) backdrop:bg-black/50"
      >
        <h2 id={`${id}-title`} className="text-lg font-semibold">
          {config.title}
        </h2>
        <p id={`${id}-message`} className="mt-2 text-sm text-(--uc-muted)">
          {config.message}
        </p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={discard}
            className="min-h-11 cursor-pointer rounded-md border border-(--uc-line) px-4 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--uc-accent-text)"
          >
            {config.discardText}
          </button>
          <button
            ref={stayRef}
            type="button"
            onClick={stay}
            className="min-h-11 cursor-pointer rounded-md bg-(--uc-accent) px-4 font-medium text-(--uc-on-accent) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--uc-accent-text)"
          >
            {config.stayText}
          </button>
        </div>
      </dialog>

      <p role="status" className="mt-3 text-sm text-(--uc-muted)">
        {result}
      </p>
    </div>
  );
}
