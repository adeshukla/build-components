"use client";

import { useRef, useState, useSyncExternalStore, type ClipboardEvent, type CSSProperties, type KeyboardEvent } from "react";

export type OtpConfig = {
  label: string;
  hint: string;
  length: number;
  mode: "boxes" | "single";
  allowLetters: boolean;
  completeText: string;
  resendText: string;
  theme: "light" | "dark" | "system";
  accentColor: string;
  radius: number;
};

// @config-start
const defaultConfig: OtpConfig = {
  label: "Enter the code we sent you",
  hint: "Six digits, from the text message.",
  length: 6,
  mode: "boxes",
  allowLetters: false,
  completeText: "Code complete.",
  resendText: "Send it again",
  theme: "light",
  accentColor: "#2563eb",
  radius: 10,
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", muted: "#4d4a57", line: "#8d8a99" },
  dark: { surface: "#141019", text: "#f6f5fa", muted: "#b6b3c2", line: "#8d8a99" },
};

const darkMedia = {
  subscribe: (onChange: () => void) => {
    const list = window.matchMedia("(prefers-color-scheme: dark)");
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  },
  get: () => window.matchMedia("(prefers-color-scheme: dark)").matches,
};

// WCAG relative luminance, used to keep the accent readable as text.
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

export function Otp({ config = defaultConfig }: { config?: OtpConfig }) {
  const length = Math.min(10, Math.max(3, Math.round(config.length)));
  const [digits, setDigits] = useState<string[]>(() => Array.from({ length }, () => ""));
  const [single, setSingle] = useState("");
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;

  const allowed = config.allowLetters ? /[^A-Za-z0-9]/g : /[^0-9]/g;
  const code = config.mode === "single" ? single : digits.join("");
  const complete = code.length === length;

  function setDigit(index: number, raw: string) {
    const clean = raw.replace(allowed, "").toUpperCase();
    if (clean === "") {
      const next = [...digits];
      next[index] = "";
      setDigits(next);
      return;
    }
    // Typing or pasting several characters fills the boxes from here on.
    const next = [...digits];
    clean.split("").forEach((character, offset) => {
      if (index + offset < length) next[index + offset] = character;
    });
    setDigits(next);
    const landed = Math.min(length - 1, index + clean.length);
    boxes.current[landed]?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>, index: number) {
    if (event.key === "Backspace" && digits[index] === "" && index > 0) {
      event.preventDefault();
      const next = [...digits];
      next[index - 1] = "";
      setDigits(next);
      boxes.current[index - 1]?.focus();
      return;
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      boxes.current[index - 1]?.focus();
    }
    if (event.key === "ArrowRight" && index < length - 1) {
      event.preventDefault();
      boxes.current[index + 1]?.focus();
    }
  }

  function onPaste(event: ClipboardEvent<HTMLInputElement>, index: number) {
    event.preventDefault();
    setDigit(index, event.clipboardData.getData("text"));
  }

  const style = {
    "--ot-accent": config.accentColor,
    "--ot-accent-text": readableAccent(config.accentColor, dark),
    "--ot-radius": `${config.radius}px`,
    "--ot-surface": palette.surface,
    "--ot-text": palette.text,
    "--ot-muted": palette.muted,
    "--ot-line": palette.line,
  } as CSSProperties;
  const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ot-accent-text)";

  return (
    <div style={style} className="bg-(--ot-surface) text-(--ot-text)">
      {/* A group with a legend: without it each box would be announced with no idea what for. */}
      <fieldset className="m-0 border-0 p-0">
        <legend className="font-medium">{config.label}</legend>
        {config.hint.trim() !== "" && (
          <p id="otp-hint" className="mt-0.5 text-sm text-(--ot-muted)">
            {config.hint}
          </p>
        )}

        {config.mode === "single" ? (
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={length}
            aria-label={config.label}
            aria-describedby={config.hint.trim() !== "" ? "otp-hint" : undefined}
            value={single}
            onChange={(event) => setSingle(event.target.value.replace(allowed, "").toUpperCase().slice(0, length))}
            className={`mt-2 w-48 rounded-(--ot-radius) border border-(--ot-line) bg-(--ot-surface) px-3 py-2 text-center text-xl tracking-[0.4em] tabular-nums ${focus}`}
          />
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(node) => {
                  boxes.current[index] = node;
                }}
                type="text"
                inputMode={config.allowLetters ? "text" : "numeric"}
                // Only the first box offers the code from a text message; the rest are filled from it.
                autoComplete={index === 0 ? "one-time-code" : "off"}
                maxLength={1}
                aria-label={`Character ${index + 1} of ${length}`}
                aria-describedby={config.hint.trim() !== "" && index === 0 ? "otp-hint" : undefined}
                value={digit}
                onChange={(event) => setDigit(index, event.target.value)}
                onKeyDown={(event) => onKeyDown(event, index)}
                onPaste={(event) => onPaste(event, index)}
                onFocus={(event) => event.target.select()}
                className={`size-12 rounded-(--ot-radius) border border-(--ot-line) bg-(--ot-surface) text-center text-xl tabular-nums ${focus}`}
              />
            ))}
          </div>
        )}
      </fieldset>

      <p role="status" aria-live="polite" className="mt-2 text-sm text-(--ot-muted)">
        {complete ? config.completeText : ""}
      </p>

      {config.resendText.trim() !== "" && (
        <button type="button" className={`mt-1 min-h-6 cursor-pointer text-sm underline ${focus}`}>
          {config.resendText}
        </button>
      )}
    </div>
  );
}
