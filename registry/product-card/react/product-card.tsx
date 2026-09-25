"use client";

import { useId, useState, useSyncExternalStore, type CSSProperties } from "react";

export type ProductCardConfig = {
  name: string;
  price: string;
  blurb: string;
  options: { group: string; label: string; stock: string }[];
  addText: string;
  showPrice: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: ProductCardConfig = {
  name: "Deck jacket",
  price: "£128",
  blurb: "Waxed cotton, taped seams, two chest pockets.",
  options: [
    { group: "Colour", label: "Navy", stock: "in" },
    { group: "Colour", label: "Sand", stock: "in" },
    { group: "Colour", label: "Moss", stock: "out" },
    { group: "Size", label: "S", stock: "in" },
    { group: "Size", label: "M", stock: "in" },
    { group: "Size", label: "L", stock: "in" },
    { group: "Size", label: "XL", stock: "out" },
  ],
  addText: "Add to bag",
  showPrice: true,
  theme: "light",
  accentColor: "#16303f",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
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

export function ProductCard({ config = defaultConfig }: { config?: ProductCardConfig }) {
  const id = useId();
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [said, setSaid] = useState("");
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--pc-accent": config.accentColor,
    "--pc-accent-text": readableAccent(config.accentColor, dark),
    "--pc-on-accent": luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff",
    "--pc-surface": palette.surface,
    "--pc-sunk": palette.sunk,
    "--pc-text": palette.text,
    "--pc-muted": palette.muted,
    "--pc-line": palette.line,
  } as CSSProperties;

  const options = config.options.filter((option) => option.label.trim() !== "");
  const groups = [...new Set(options.map((option) => option.group))];
  const ready = groups.every((group) => picked[group]);

  return (
    <div style={style} className="max-w-md rounded-xl border border-(--pc-line) bg-(--pc-surface) p-4 text-(--pc-text)">
      <h2 className="text-lg font-semibold">{config.name}</h2>
      {config.showPrice && <p className="mt-1 text-xl font-semibold">{config.price}</p>}
      <p className="mt-1 text-sm text-(--pc-muted)">{config.blurb}</p>

      {groups.map((group) => (
        // A fieldset per group: the legend names what the choice is, which a div cannot do.
        <fieldset key={group} className="mt-4 border-0 p-0">
          <legend className="text-sm font-medium">{group}</legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {options
              .filter((option) => option.group === group)
              .map((option) => {
                const out = option.stock === "out";
                const on = picked[group] === option.label;
                return (
                  <label
                    key={option.label}
                    className={`inline-flex min-h-11 items-center gap-1 rounded-md border px-3 text-sm has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-(--pc-accent-text) ${
                      out
                        ? "cursor-not-allowed border-dashed border-(--pc-line) text-(--pc-muted)"
                        : on
                          ? "cursor-pointer border-(--pc-accent) bg-(--pc-accent) text-(--pc-on-accent)"
                          : "cursor-pointer border-(--pc-line)"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`${id}-${group}`}
                      value={option.label}
                      disabled={out}
                      checked={on}
                      onChange={() => {
                        setPicked((current) => ({ ...current, [group]: option.label }));
                        setSaid("");
                      }}
                      className="sr-only"
                    />
                    {option.label}
                    {/* Out of stock is said, not only drawn as a dashed outline. */}
                    {out && <span className="text-xs">(out of stock)</span>}
                  </label>
                );
              })}
          </div>
        </fieldset>
      ))}

      <button
        type="button"
        disabled={!ready}
        onClick={() => setSaid(`${config.name} added: ${groups.map((group) => picked[group]).join(", ")}`)}
        className="mt-4 min-h-11 w-full cursor-pointer rounded-md bg-(--pc-accent) px-4 font-medium text-(--pc-on-accent) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--pc-accent-text) disabled:cursor-not-allowed disabled:opacity-50"
      >
        {config.addText}
      </button>

      {/* What is still needed, then what happened — the button alone cannot say either. */}
      <p role="status" className="mt-2 text-sm text-(--pc-muted)">
        {said || (ready ? "" : `Pick a ${groups.filter((group) => !picked[group]).join(" and a ").toLowerCase()} first`)}
      </p>
    </div>
  );
}
