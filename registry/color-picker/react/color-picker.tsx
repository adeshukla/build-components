"use client";

import { useId, useState, useSyncExternalStore, type CSSProperties } from "react";

export type ColorPickerConfig = {
  label: string;
  swatches: { name: string; hex: string }[];
  startHex: string;
  allowCustom: boolean;
  showHex: boolean;
  name: string;
  theme: "light" | "dark" | "system";
};

// @config-start
const defaultConfig: ColorPickerConfig = {
  label: "Label colour",
  swatches: [
    { name: "Slate", hex: "#475569" },
    { name: "Ocean", hex: "#2563eb" },
    { name: "Moss", hex: "#15803d" },
    { name: "Amber", hex: "#b45309" },
    { name: "Rose", hex: "#be123c" },
    { name: "Plum", hex: "#7c3aed" },
  ],
  startHex: "#2563eb",
  allowCustom: true,
  showHex: true,
  name: "colour",
  theme: "light",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", muted: "#4d4a57", border: "#737373", line: "#d9d5e4" },
  dark: { surface: "#141019", text: "#f6f5fa", muted: "#b6b3c2", border: "#8e8a99", line: "#3a3448" },
};

const darkMedia = {
  subscribe: (onChange: () => void) => {
    const list = window.matchMedia("(prefers-color-scheme: dark)");
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  },
  get: () => window.matchMedia("(prefers-color-scheme: dark)").matches,
};

const isHex = (value: string) => /^#[0-9a-f]{6}$/i.test(value.trim());

export function ColorPicker({ config = defaultConfig }: { config?: ColorPickerConfig }) {
  const id = useId();
  const swatches = config.swatches.filter((swatch) => swatch.name.trim() !== "" && isHex(swatch.hex));
  const start = isHex(config.startHex) ? config.startHex.toLowerCase() : (swatches[0]?.hex.toLowerCase() ?? "#2563eb");
  const [value, setValue] = useState(start);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--cp-surface": palette.surface,
    "--cp-text": palette.text,
    "--cp-muted": palette.muted,
    "--cp-border": palette.border,
    "--cp-line": palette.line,
  } as CSSProperties;
  const named = swatches.find((swatch) => swatch.hex.toLowerCase() === value);

  return (
    <div style={style} className="max-w-sm bg-(--cp-surface) text-(--cp-text)">
      <fieldset>
        <legend className="font-medium">{config.label}</legend>
        {/* Radios, so the colours are one group with one Tab stop, and each says its name. */}
        <div className="mt-2 flex flex-wrap gap-2">
          {swatches.map((swatch) => {
            const hex = swatch.hex.toLowerCase();
            return (
              <label key={hex} className="cursor-pointer">
                <input
                  type="radio"
                  name={`${id}-swatch`}
                  value={hex}
                  checked={value === hex}
                  onChange={() => setValue(hex)}
                  className="peer sr-only"
                />
                <span className="sr-only">{swatch.name}</span>
                <span
                  aria-hidden="true"
                  style={{ backgroundColor: hex }}
                  className="block size-9 rounded-full ring-1 ring-(--cp-border) ring-offset-2 ring-offset-(--cp-surface) peer-checked:ring-2 peer-checked:ring-(--cp-text) peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-(--cp-text)"
                />
              </label>
            );
          })}
        </div>
      </fieldset>

      {config.allowCustom && (
        <p className="mt-3 flex items-center gap-2">
          <label htmlFor={`${id}-custom`} className="text-sm font-medium">
            Any other colour
          </label>
          {/* The browser's own colour picker: it comes with a keyboard and an eyedropper. */}
          <input
            id={`${id}-custom`}
            type="color"
            value={value}
            onChange={(event) => setValue(event.target.value.toLowerCase())}
            className="size-9 cursor-pointer rounded border border-(--cp-border) bg-(--cp-surface) p-0.5"
          />
        </p>
      )}

      {config.showHex && (
        <p className="mt-3 text-sm">
          Chosen: <span className="font-mono">{value}</span>
          {named && <span className="text-(--cp-muted)"> · {named.name}</span>}
        </p>
      )}
      <p role="status" className="sr-only">
        {named ? `${named.name} chosen, ${value}.` : `Colour ${value} chosen.`}
      </p>
      {config.name !== "" && <input type="hidden" name={config.name} value={value} />}
    </div>
  );
}
