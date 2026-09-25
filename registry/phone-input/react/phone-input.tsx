"use client";

import { useId, useState, useSyncExternalStore, type CSSProperties } from "react";

export type PhoneInputConfig = {
  label: string;
  hint: string;
  countries: { name: string; dial: string; groups: string }[];
  startCountry: string;
  name: string;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: PhoneInputConfig = {
  label: "Phone number",
  hint: "We only use this to talk about your order.",
  countries: [
    { name: "United Kingdom", dial: "+44", groups: "4 6" },
    { name: "Ireland", dial: "+353", groups: "2 3 4" },
    { name: "United States", dial: "+1", groups: "3 3 4" },
    { name: "India", dial: "+91", groups: "5 5" },
    { name: "Germany", dial: "+49", groups: "4 7" },
  ],
  startCountry: "United Kingdom",
  name: "phone",
  theme: "light",
  accentColor: "#2563eb",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", border: "#737373", error: "#b3261e" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", border: "#8e8a99", error: "#ff6b6b" },
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

/**
 * Digits grouped the way the country writes them, from a simple pattern like "4 6".
 * Deliberately not a full phone-number library: those are megabytes, and this component's job is
 * the interface. Check the number properly on your server.
 */
function group(digits: string, pattern: string) {
  const sizes = pattern.split(/\s+/).map(Number).filter((size) => size > 0);
  const parts: string[] = [];
  let rest = digits;
  for (const size of sizes) {
    if (rest === "") break;
    parts.push(rest.slice(0, size));
    rest = rest.slice(size);
  }
  if (rest !== "") parts.push(rest);
  return parts.join(" ");
}

export function PhoneInput({ config = defaultConfig }: { config?: PhoneInputConfig }) {
  const id = useId();
  const countries = config.countries.filter((country) => country.name.trim() !== "" && country.dial.trim() !== "");
  const [countryName, setCountryName] = useState(
    countries.some((country) => country.name === config.startCountry) ? config.startCountry : (countries[0]?.name ?? ""),
  );
  const [digits, setDigits] = useState("");
  const [error, setError] = useState("");
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--ph-accent": config.accentColor,
    "--ph-accent-text": readableAccent(config.accentColor, dark),
    "--ph-surface": palette.surface,
    "--ph-sunk": palette.sunk,
    "--ph-text": palette.text,
    "--ph-muted": palette.muted,
    "--ph-border": palette.border,
    "--ph-error": palette.error,
  } as CSSProperties;
  const country = countries.find((entry) => entry.name === countryName) ?? countries[0];
  const shown = country ? group(digits, country.groups) : digits;
  const full = country ? `${country.dial}${digits}` : digits;

  return (
    <div style={style} className="max-w-sm bg-(--ph-surface) text-(--ph-text)">
      <label htmlFor={`${id}-number`} className="font-medium">
        {config.label}
      </label>
      {config.hint.trim() !== "" && (
        <p id={`${id}-hint`} className="text-sm text-(--ph-muted)">
          {config.hint}
        </p>
      )}
      <div
        className={`mt-2 flex h-11 items-stretch overflow-hidden rounded-lg border bg-(--ph-surface) has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-(--ph-accent-text) ${error ? "border-2 border-(--ph-error)" : "border-(--ph-border)"}`}
      >
        {/* A real select: the country is a choice, and the dial code is part of its name. */}
        <select
          aria-label="Country code"
          value={countryName}
          onChange={(event) => setCountryName(event.target.value)}
          className="min-w-0 border-r border-(--ph-border) bg-(--ph-sunk) px-2 text-sm outline-none"
        >
          {countries.map((entry) => (
            <option key={entry.name} value={entry.name}>
              {entry.name} ({entry.dial})
            </option>
          ))}
        </select>
        <input
          id={`${id}-number`}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={shown}
          aria-describedby={[config.hint.trim() !== "" && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined}
          aria-invalid={error ? true : undefined}
          onChange={(event) => {
            setDigits(event.target.value.replace(/\D/g, "").slice(0, 15));
            if (error) setError("");
          }}
          onBlur={() => {
            if (digits === "") return setError("");
            setError(digits.length < 6 ? "That number looks too short. Check it and try again." : "");
          }}
          className="min-w-0 flex-1 bg-transparent px-3 tabular-nums outline-none"
        />
      </div>
      <p id={`${id}-error`} role="alert" className="mt-1 text-sm font-medium text-(--ph-error) empty:hidden">
        {error}
      </p>
      {/* One value for your server: country code and number together, digits only. */}
      {config.name !== "" && <input type="hidden" name={config.name} value={digits === "" ? "" : full} />}
    </div>
  );
}
