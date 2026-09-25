"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent } from "react";

export type InlineEditConfig = {
  label: string;
  value: string;
  hint: string;
  multiline: boolean;
  required: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: InlineEditConfig = {
  label: "Project name",
  value: "Harbour redesign",
  hint: "Enter saves, Escape cancels.",
  multiline: false,
  required: true,
  theme: "light",
  accentColor: "#2563eb",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", hover: "#eeecf5", text: "#16121f", muted: "#4d4a57", border: "#737373", error: "#b3261e" },
  dark: { surface: "#141019", hover: "#2a2438", text: "#f6f5fa", muted: "#b6b3c2", border: "#8e8a99", error: "#ff6b6b" },
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

export function InlineEdit({ config = defaultConfig }: { config?: InlineEditConfig }) {
  const id = useId();
  const [value, setValue] = useState(config.value);
  const [draft, setDraft] = useState(config.value);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const editRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  // Focus can only go back to the button once the button is on the page again.
  const returning = useRef(false);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--ie-accent": config.accentColor,
    "--ie-accent-text": readableAccent(config.accentColor, dark),
    "--ie-on-accent": luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff",
    "--ie-surface": palette.surface,
    "--ie-hover": palette.hover,
    "--ie-text": palette.text,
    "--ie-muted": palette.muted,
    "--ie-border": palette.border,
    "--ie-error": palette.error,
  } as CSSProperties;

  // Focus follows the mode: into the field to edit, back to the button when done.
  useEffect(() => {
    if (editing) {
      editRef.current?.focus();
    } else if (returning.current) {
      returning.current = false;
      buttonRef.current?.focus();
    }
  }, [editing]);

  function start() {
    setDraft(value);
    setError("");
    setEditing(true);
  }

  function cancel() {
    returning.current = true;
    setEditing(false);
    setMessage("Edit cancelled. Nothing changed.");
  }

  function save() {
    const next = draft.trim();
    if (config.required && next === "") {
      setError(`${config.label} can't be empty.`);
      editRef.current?.focus();
      return;
    }
    returning.current = true;
    setValue(next);
    setEditing(false);
    setMessage(`Saved. ${config.label} is now ${next}.`);
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      cancel();
    } else if (event.key === "Enter" && !config.multiline) {
      event.preventDefault();
      save();
    }
  }

  const field = `w-full rounded-lg border bg-(--ie-surface) px-3 py-2 text-(--ie-text) outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ie-accent-text) ${error ? "border-2 border-(--ie-error)" : "border-(--ie-border)"}`;
  const button = "min-h-9 cursor-pointer rounded-lg px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ie-accent-text)";

  return (
    <div style={style} className="max-w-md bg-(--ie-surface) text-(--ie-text)">
      <p id={`${id}-label`} className="text-sm font-medium text-(--ie-muted)">
        {config.label}
      </p>
      {editing ? (
        <div className="mt-1">
          {config.multiline ? (
            <textarea
              ref={editRef}
              rows={3}
              value={draft}
              aria-labelledby={`${id}-label`}
              aria-describedby={[config.hint.trim() !== "" && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined}
              aria-invalid={error ? true : undefined}
              onChange={(event) => {
                setDraft(event.target.value);
                if (error) setError("");
              }}
              onKeyDown={onKeyDown}
              className={field}
            />
          ) : (
            <input
              ref={editRef}
              type="text"
              value={draft}
              aria-labelledby={`${id}-label`}
              aria-describedby={[config.hint.trim() !== "" && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined}
              aria-invalid={error ? true : undefined}
              onChange={(event) => {
                setDraft(event.target.value);
                if (error) setError("");
              }}
              onKeyDown={onKeyDown}
              className={field}
            />
          )}
          <p id={`${id}-error`} role="alert" className="mt-1 text-sm font-medium text-(--ie-error) empty:hidden">
            {error}
          </p>
          {config.hint.trim() !== "" && (
            <p id={`${id}-hint`} className="mt-1 text-sm text-(--ie-muted)">
              {config.hint}
            </p>
          )}
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={save} className={`${button} bg-(--ie-accent) text-(--ie-on-accent)`}>
              Save
            </button>
            <button type="button" onClick={cancel} className={`${button} border border-(--ie-border) text-(--ie-text)`}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        // One button, named with both the label and the current value, so it is never just "Edit".
        <button
          ref={buttonRef}
          type="button"
          onClick={start}
          className="mt-1 flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-left hover:bg-(--ie-hover) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ie-accent-text)"
        >
          <span className={`min-w-0 break-words ${value === "" ? "text-(--ie-muted)" : ""}`}>{value === "" ? "Not set" : value}</span>
          <span className="flex shrink-0 items-center gap-1 text-sm text-(--ie-muted)">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4">
              <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" />
            </svg>
            Edit
            <span className="sr-only">
              {" "}
              {config.label}, currently {value === "" ? "not set" : value}
            </span>
          </span>
        </button>
      )}
      <p role="status" className="sr-only">
        {message}
      </p>
    </div>
  );
}
