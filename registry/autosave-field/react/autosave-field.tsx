"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export type AutosaveFieldConfig = {
  label: string;
  hint: string;
  name: string;
  rows: number;
  maxLength: number;
  pauseMs: number;
  unsavedText: string;
  savingText: string;
  savedText: string;
  errorText: string;
  retryLabel: string;
  demoOutcome: "saves" | "fails";
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: AutosaveFieldConfig = {
  label: "Notes",
  hint: "Saved on its own a moment after you stop typing.",
  name: "notes",
  rows: 5,
  maxLength: 2000,
  pauseMs: 900,
  unsavedText: "Not saved yet",
  savingText: "Saving…",
  savedText: "Saved",
  errorText: "Could not save.",
  retryLabel: "Try again",
  demoOutcome: "saves",
  theme: "light",
  accentColor: "#0f766e",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6", error: "#b42318" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459", error: "#ff9d95" },
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

/** Two digits, written out rather than formatted by locale, so the server and the browser agree. */
export function clockTime(date: Date) {
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

type State = "clean" | "unsaved" | "saving" | "saved" | "error";

export function AutosaveField({
  config = defaultConfig,
  onSave,
}: {
  config?: AutosaveFieldConfig;
  /** Replace this with your own request. It has to reject for the failure path to show. */
  onSave?: (value: string) => Promise<void>;
}) {
  const id = useId();
  const [value, setValue] = useState("");
  const [state, setState] = useState<State>("clean");
  const [savedAt, setSavedAt] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const latest = useRef("");
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--asf-accent": config.accentColor,
    "--asf-accent-text": readableAccent(config.accentColor, dark),
    "--asf-surface": palette.surface,
    "--asf-sunk": palette.sunk,
    "--asf-text": palette.text,
    "--asf-muted": palette.muted,
    "--asf-line": palette.line,
    "--asf-error": palette.error,
  } as CSSProperties;

  // A stand-in for your request. It waits, then keeps or breaks its promise.
  const saveDraft = (draft: string) =>
    onSave
      ? onSave(draft)
      : new Promise<void>((resolve, reject) => {
          setTimeout(() => (config.demoOutcome === "fails" ? reject(new Error("demo")) : resolve()), 300);
        });

  const save = () => {
    setState("saving");
    const draft = latest.current;
    saveDraft(draft).then(
      () => {
        setState("saved");
        setSavedAt(clockTime(new Date()));
      },
      () => setState("error"),
    );
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  const change = (next: string) => {
    setValue(next);
    latest.current = next;
    setState("unsaved");
    clearTimeout(timer.current);
    // Saving on every keystroke sends a request per letter; the pause is what makes it one.
    timer.current = setTimeout(save, config.pauseMs);
  };

  const message =
    state === "clean"
      ? ""
      : state === "unsaved"
        ? config.unsavedText
        : state === "saving"
          ? config.savingText
          : state === "saved"
            ? `${config.savedText} at ${savedAt}`
            : config.errorText;

  return (
    <div style={style} className="bg-(--asf-surface) text-(--asf-text)">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <label htmlFor={`${id}-field`} className="font-medium">
          {config.label}
        </label>
        {/* Polite, never assertive: an alert on every pause would interrupt the typing it is reporting on. */}
        <p
          role="status"
          className={`text-sm ${state === "error" ? "text-(--asf-error)" : "text-(--asf-muted)"}`}
          data-state={state}
        >
          {message}
        </p>
      </div>
      {config.hint.trim() !== "" && (
        <p id={`${id}-hint`} className="mt-1 text-sm text-(--asf-muted)">
          {config.hint}
        </p>
      )}

      <textarea
        id={`${id}-field`}
        name={config.name}
        rows={config.rows}
        maxLength={config.maxLength}
        value={value}
        aria-describedby={config.hint.trim() === "" ? undefined : `${id}-hint`}
        onChange={(event) => change(event.target.value)}
        className="mt-2 w-full rounded-md border border-(--asf-line) bg-(--asf-sunk) p-3 text-(--asf-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--asf-accent-text)"
      />

      {state === "error" && (
        // The work is still in the field, so the way out is one button, not a lost draft.
        <button
          type="button"
          onClick={save}
          className="mt-2 min-h-11 rounded-md border border-(--asf-line) bg-(--asf-sunk) px-4 font-medium text-(--asf-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--asf-accent-text)"
        >
          {config.retryLabel}
        </button>
      )}
    </div>
  );
}
