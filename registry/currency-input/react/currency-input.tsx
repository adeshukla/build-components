"use client";

import { useId, useState, useSyncExternalStore, type CSSProperties } from "react";

export type CurrencyInputConfig = {
  label: string;
  hint: string;
  symbol: string;
  symbolAfter: boolean;
  decimals: number;
  allowNegative: boolean;
  start: string;
  name: string;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: CurrencyInputConfig = {
  label: "Amount",
  hint: "Rounded to the nearest penny when you leave the field.",
  symbol: "£",
  symbolAfter: false,
  decimals: 2,
  allowNegative: false,
  start: "1250",
  name: "amount",
  theme: "light",
  accentColor: "#2563eb",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", muted: "#4d4a57", border: "#737373", error: "#b3261e" },
  dark: { surface: "#141019", text: "#f6f5fa", muted: "#b6b3c2", border: "#8e8a99", error: "#ff6b6b" },
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
 * Money written by hand, never by locale: Intl gives different text on the server and in the
 * browser, which breaks hydration. Thousands are grouped with a plain comma.
 */
function format(amount: number, decimals: number) {
  const fixed = Math.abs(amount).toFixed(decimals);
  const [whole, part] = fixed.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${amount < 0 ? "-" : ""}${grouped}${part ? `.${part}` : ""}`;
}

/** What was typed, as a number: anything that isn't a digit, dot or minus is ignored. */
function parse(text: string, allowNegative: boolean) {
  const cleaned = text.replace(/[^0-9.-]/g, "");
  const negative = allowNegative && cleaned.trim().startsWith("-");
  const digits = cleaned.replace(/-/g, "");
  if (digits === "" || digits === ".") return null;
  const value = Number(digits);
  return Number.isFinite(value) ? (negative ? -value : value) : null;
}

export function CurrencyInput({ config = defaultConfig }: { config?: CurrencyInputConfig }) {
  const id = useId();
  const decimals = Math.max(0, Math.min(4, Math.round(config.decimals)));
  const startValue = parse(config.start, config.allowNegative);
  const [text, setText] = useState(startValue === null ? "" : format(startValue, decimals));
  const [error, setError] = useState("");
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--ci-accent": config.accentColor,
    "--ci-accent-text": readableAccent(config.accentColor, dark),
    "--ci-surface": palette.surface,
    "--ci-text": palette.text,
    "--ci-muted": palette.muted,
    "--ci-border": palette.border,
    "--ci-error": palette.error,
  } as CSSProperties;
  const value = parse(text, config.allowNegative);
  const symbol = config.symbol.trim();

  return (
    <div style={style} className="max-w-xs bg-(--ci-surface) text-(--ci-text)">
      <label htmlFor={`${id}-input`} className="font-medium">
        {config.label}
        {/* The symbol is drawn beside the field, so it is said once, with the field, not read as
            a stray character by itself. */}
        {symbol !== "" && <span className="sr-only"> in {symbol}</span>}
      </label>
      {config.hint.trim() !== "" && (
        <p id={`${id}-hint`} className="text-sm text-(--ci-muted)">
          {config.hint}
        </p>
      )}
      <div
        className={`mt-2 flex h-11 items-center gap-1 rounded-lg border bg-(--ci-surface) px-3 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-(--ci-accent-text) ${error ? "border-2 border-(--ci-error)" : "border-(--ci-border)"}`}
      >
        {symbol !== "" && !config.symbolAfter && (
          <span aria-hidden="true" className="text-(--ci-muted)">
            {symbol}
          </span>
        )}
        <input
          id={`${id}-input`}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={text}
          aria-describedby={[config.hint.trim() !== "" && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined}
          aria-invalid={error ? true : undefined}
          onChange={(event) => {
            setText(event.target.value);
            if (error) setError("");
          }}
          onBlur={() => {
            const typed = parse(text, config.allowNegative);
            if (text.trim() === "") {
              setError("");
              return;
            }
            if (typed === null) {
              setError("Enter an amount, for example 12.50.");
              return;
            }
            setError("");
            setText(format(typed, decimals));
          }}
          className="min-w-0 flex-1 bg-transparent text-right tabular-nums outline-none"
        />
        {symbol !== "" && config.symbolAfter && (
          <span aria-hidden="true" className="text-(--ci-muted)">
            {symbol}
          </span>
        )}
      </div>
      <p id={`${id}-error`} role="alert" className="mt-1 text-sm font-medium text-(--ci-error) empty:hidden">
        {error}
      </p>
      {config.name !== "" && <input type="hidden" name={config.name} value={value === null ? "" : value.toFixed(decimals)} />}
    </div>
  );
}
