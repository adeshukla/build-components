"use client";

import { useId, useState, useSyncExternalStore, type CSSProperties } from "react";

export type MaskedInputConfig = {
  label: string;
  hint: string;
  mask: string;
  name: string;
  showExample: boolean;
  errorText: string;
  theme: "light" | "dark" | "system";
  accentColor: string;
  exampleText: string;
};

// @config-start
const defaultConfig: MaskedInputConfig = {
  label: "Postcode",
  hint: "",
  mask: "AA## #AA",
  name: "postcode",
  showExample: true,
  errorText: "That is not a full postcode yet.",
  theme: "light",
  accentColor: "#1d4ed8",
  exampleText: "Like {example}. We add the spacing.",
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

/** # is a digit, A a letter, * either; everything else in the mask is punctuation it fills in for you. */
const fits = (slot: string, character: string) =>
  slot === "#" ? /[0-9]/.test(character) : slot === "A" ? /[a-z]/i.test(character) : /[a-z0-9]/i.test(character);

/** Walks the mask and the typing together, so pasted text and punctuation both land in the right place. */
export function applyMask(mask: string, raw: string) {
  const characters = raw.replace(/\s+/g, " ").split("");
  let out = "";
  let at = 0;
  for (const slot of mask) {
    if (at >= characters.length) break;
    if (slot === "#" || slot === "A" || slot === "*") {
      // Skip anything that cannot go in this slot rather than refusing the whole entry.
      while (at < characters.length && !fits(slot, characters[at])) at += 1;
      if (at >= characters.length) break;
      out += slot === "A" || slot === "*" ? characters[at].toUpperCase() : characters[at];
      at += 1;
    } else {
      out += slot;
      if (characters[at] === slot) at += 1;
    }
  }
  return out;
}

/** Words with something put in them: "{count} left" (D94). */
const fill = (words: string, values: Record<string, string | number>) => words.replace(/\{(\w+)\}/g, (match, name) => String(values[name] ?? match));

export function MaskedInput({ config = defaultConfig }: { config?: MaskedInputConfig }) {
  const id = useId();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--mi-accent": config.accentColor,
    "--mi-accent-text": readableAccent(config.accentColor, dark),
    "--mi-surface": `var(--bc-${dark ? "dark" : "light"}-surface, ${palette.surface})`,
    "--mi-sunk": `var(--bc-${dark ? "dark" : "light"}-sunk, ${palette.sunk})`,
    "--mi-text": `var(--bc-${dark ? "dark" : "light"}-text, ${palette.text})`,
    "--mi-muted": `var(--bc-${dark ? "dark" : "light"}-muted, ${palette.muted})`,
    "--mi-line": `var(--bc-${dark ? "dark" : "light"}-line, ${palette.line})`,
    "--mi-error": palette.error,
  } as CSSProperties;

  const example = config.mask.replace(/#/g, "0").replace(/[A*]/g, "X");
  const full = value.length === config.mask.length;

  return (
    <div style={style} className="bg-(--mi-surface) text-(--mi-text)">
      <label htmlFor={`${id}-field`} className="block font-medium">
        {config.label}
      </label>
      {/* The shape is said in the hint, not left to be discovered by typing into a field that fights back. */}
      <p id={`${id}-hint`} className="text-sm text-(--mi-muted)">
        {config.hint.trim() !== "" ? config.hint : config.showExample ? fill(config.exampleText, { example }) : ""}
      </p>

      <input
        id={`${id}-field`}
        name={config.name}
        type="text"
        inputMode={/^[#\s\-/]+$/.test(config.mask) ? "numeric" : "text"}
        autoComplete="off"
        value={value}
        aria-invalid={error === "" ? undefined : true}
        aria-describedby={`${id}-hint${error === "" ? "" : ` ${id}-error`}`}
        onChange={(event) => {
          const next = applyMask(config.mask, event.target.value);
          setValue(next);
          if (error !== "") setError("");
        }}
        onBlur={() => setError(value === "" || value.length === config.mask.length ? "" : config.errorText)}
        className={`mt-2 min-h-11 w-full max-w-64 rounded-[var(--bc-radius-sm,0.375rem)] border bg-(--mi-sunk) px-3 font-mono text-(--mi-text) uppercase focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--mi-accent-text) ${
          error === "" ? "border-(--mi-line)" : "border-(--mi-error)"
        }`}
      />

      {error !== "" && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-sm text-(--mi-error)">
          {error}
        </p>
      )}

      <p role="status" className="mt-2 text-sm text-(--mi-muted)">
        {full ? `${config.label} complete: ${value}` : ""}
      </p>
    </div>
  );
}
