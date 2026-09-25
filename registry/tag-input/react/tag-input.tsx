"use client";

import { useId, useRef, useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent } from "react";

export type TagInputConfig = {
  label: string;
  hint: string;
  placeholder: string;
  startTags: { text: string }[];
  maxTags: number;
  allowDuplicates: boolean;
  name: string;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: TagInputConfig = {
  label: "Skills",
  hint: "Type a skill and press Enter or comma. Backspace removes the last one.",
  placeholder: "Add a skill",
  startTags: [{ text: "Accessibility" }, { text: "CSS" }],
  maxTags: 8,
  allowDuplicates: false,
  name: "skills",
  theme: "light",
  accentColor: "#2563eb",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#eeecf5", text: "#16121f", muted: "#4d4a57", border: "#737373", line: "#d9d5e4" },
  dark: { surface: "#141019", sunk: "#2a2438", text: "#f6f5fa", muted: "#b6b3c2", border: "#8e8a99", line: "#3a3448" },
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

export function TagInput({ config = defaultConfig }: { config?: TagInputConfig }) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [tags, setTags] = useState(() => config.startTags.map((tag) => tag.text).filter((text) => text.trim() !== ""));
  const [text, setText] = useState("");
  const [message, setMessage] = useState("");
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--ti-accent": config.accentColor,
    "--ti-accent-text": readableAccent(config.accentColor, dark),
    "--ti-surface": palette.surface,
    "--ti-sunk": palette.sunk,
    "--ti-text": palette.text,
    "--ti-muted": palette.muted,
    "--ti-border": palette.border,
    "--ti-line": palette.line,
  } as CSSProperties;
  const max = Math.max(1, Math.min(30, Math.round(config.maxTags)));
  const full = tags.length >= max;

  function add(raw: string) {
    const value = raw.trim().replace(/,$/, "").trim();
    if (value === "") return;
    if (full) {
      setMessage(`You can add ${max} at most. Remove one first.`);
      return;
    }
    if (!config.allowDuplicates && tags.some((tag) => tag.toLowerCase() === value.toLowerCase())) {
      setMessage(`${value} is already in the list.`);
      setText("");
      return;
    }
    setTags([...tags, value]);
    setText("");
    setMessage(`${value} added. ${tags.length + 1} of ${max}.`);
  }

  function remove(index: number) {
    const gone = tags[index];
    setTags(tags.filter((_, at) => at !== index));
    setMessage(`${gone} removed. ${tags.length - 1} of ${max}.`);
    inputRef.current?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      // Enter belongs to the tag, not to the form around it.
      event.preventDefault();
      add(text);
    } else if (event.key === "Backspace" && text === "" && tags.length > 0) {
      remove(tags.length - 1);
    }
  }

  return (
    <div style={style} className="max-w-md bg-(--ti-surface) text-(--ti-text)">
      <label htmlFor={`${id}-input`} className="font-medium">
        {config.label}
      </label>
      {config.hint.trim() !== "" && (
        <p id={`${id}-hint`} className="text-sm text-(--ti-muted)">
          {config.hint}
        </p>
      )}
      {/* The chips sit outside the field, so the field's own value is only what is being typed. */}
      <ul aria-label={`${config.label} added`} className="mt-2 flex flex-wrap gap-2 empty:hidden">
        {tags.map((tag, index) => (
          <li key={`${tag}-${index}`}>
            <span className="inline-flex items-center gap-1 rounded-full bg-(--ti-sunk) py-1 pr-1 pl-3 text-sm">
              {tag}
              <button
                type="button"
                aria-label={`Remove ${tag}`}
                onClick={() => remove(index)}
                className="grid size-6 cursor-pointer place-items-center rounded-full text-(--ti-muted) hover:bg-black/10 hover:text-(--ti-text) focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--ti-accent-text)"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-3.5">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </span>
          </li>
        ))}
      </ul>
      <input
        ref={inputRef}
        id={`${id}-input`}
        type="text"
        autoComplete="off"
        value={text}
        placeholder={full ? "" : config.placeholder}
        aria-describedby={[config.hint.trim() !== "" && `${id}-hint`, `${id}-count`].filter(Boolean).join(" ")}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => add(text)}
        className="mt-2 h-11 w-full rounded-lg border border-(--ti-border) bg-(--ti-surface) px-3 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ti-accent-text)"
      />
      <p id={`${id}-count`} className="mt-1 text-sm text-(--ti-muted)">
        {tags.length} of {max} added
      </p>
      <p role="status" className="sr-only">
        {message}
      </p>
      {config.name !== "" && tags.map((tag, index) => <input key={`${tag}-${index}`} type="hidden" name={`${config.name}[]`} value={tag} />)}
    </div>
  );
}
