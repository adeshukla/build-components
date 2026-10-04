"use client";

import { useId, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export type SelectFieldConfig = {
  label: string;
  hint: string;
  options: { label: string; group: string }[];
  placeholder: string;
  name: string;
  required: boolean;
  errorText: string;
  size: "sm" | "md";
  width: "full" | "auto";
  theme: "light" | "dark" | "system";
  accentColor: string;
  neededText: string;
  continueText: string;
};

// @config-start
const defaultConfig: SelectFieldConfig = {
  label: "Which yard?",
  hint: "Where the work will be done.",
  options: [
    { label: "Falmouth", group: "South west" },
    { label: "Plymouth", group: "South west" },
    { label: "Lymington", group: "South coast" },
    { label: "Chichester", group: "South coast" },
    { label: "Whitby", group: "North east" },
  ],
  placeholder: "Choose a yard",
  name: "yard",
  required: true,
  errorText: "Choose a yard before carrying on.",
  size: "md",
  width: "full",
  theme: "light",
  accentColor: "#1d4ed8",
  neededText: "(needed)",
  continueText: "Carry on",
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

export function SelectField({ config = defaultConfig }: { config?: SelectFieldConfig }) {
  const id = useId();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const fieldRef = useRef<HTMLSelectElement>(null);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--sf-accent": config.accentColor,
    "--sf-accent-text": readableAccent(config.accentColor, dark),
    "--sf-surface": `var(--bc-${dark ? "dark" : "light"}-surface, ${palette.surface})`,
    "--sf-sunk": `var(--bc-${dark ? "dark" : "light"}-sunk, ${palette.sunk})`,
    "--sf-text": `var(--bc-${dark ? "dark" : "light"}-text, ${palette.text})`,
    "--sf-muted": `var(--bc-${dark ? "dark" : "light"}-muted, ${palette.muted})`,
    "--sf-line": `var(--bc-${dark ? "dark" : "light"}-line, ${palette.line})`,
    "--sf-error": palette.error,
  } as CSSProperties;

  const options = config.options.filter((option) => option.label.trim() !== "");
  // Options carrying a group name are wrapped in optgroups; the rest sit at the top level.
  const groups = [...new Set(options.map((option) => option.group.trim()))];

  return (
    <div style={style} className="bg-(--sf-surface) text-(--sf-text)">
      <label htmlFor={`${id}-field`} className="block font-medium">
        {config.label}
        {config.required && <span className="ml-1 font-normal text-(--sf-muted)">{config.neededText}</span>}
      </label>
      {config.hint.trim() !== "" && (
        <p id={`${id}-hint`} className="text-sm text-(--sf-muted)">
          {config.hint}
        </p>
      )}

      {/* A native select: the phone shows its own picker, the keyboard works, and type-ahead is free. */}
      <select
        ref={fieldRef}
        id={`${id}-field`}
        name={config.name}
        value={value}
        required={config.required}
        aria-invalid={error === "" ? undefined : true}
        aria-describedby={`${config.hint.trim() === "" ? "" : `${id}-hint`}${error === "" ? "" : ` ${id}-error`}`.trim() || undefined}
        onChange={(event) => {
          setValue(event.target.value);
          if (event.target.value !== "") setError("");
        }}
        className={`mt-2 block rounded-[var(--bc-radius-sm,0.375rem)] border bg-(--sf-sunk) pr-9 text-(--sf-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--sf-accent-text) ${
          config.width === "full" ? "w-full" : "w-auto"
        } ${config.size === "sm" ? "min-h-11 px-2 text-sm" : "min-h-11 px-3"} ${error === "" ? "border-(--sf-line)" : "border-(--sf-error)"}`}
      >
        <option value="">{config.placeholder}</option>
        {groups.map((group) =>
          group === "" ? (
            options
              .filter((option) => option.group.trim() === "")
              .map((option) => (
                <option key={option.label} value={option.label}>
                  {option.label}
                </option>
              ))
          ) : (
            <optgroup key={group} label={group}>
              {options
                .filter((option) => option.group.trim() === group)
                .map((option) => (
                  <option key={option.label} value={option.label}>
                    {option.label}
                  </option>
                ))}
            </optgroup>
          ),
        )}
      </select>

      {error !== "" && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-sm text-(--sf-error)">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => {
          if (config.required && value === "") {
            setError(config.errorText);
            fieldRef.current?.focus();
          } else {
            setError("");
          }
        }}
        className="mt-3 min-h-11 cursor-pointer rounded-[var(--bc-radius-sm,0.375rem)] border border-(--sf-line) px-4 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--sf-accent-text)"
      >
        {config.continueText}
      </button>

      <p role="status" className="mt-2 text-sm text-(--sf-muted)">
        {value === "" ? "" : `${value} chosen`}
      </p>
    </div>
  );
}
