"use client";

import { useState, useSyncExternalStore, type CSSProperties } from "react";

export type PasswordConfig = {
  label: string;
  hint: string;
  minLength: number;
  requireNumber: boolean;
  requireSymbol: boolean;
  requireUpper: boolean;
  showToggle: boolean;
  showMeter: boolean;
  showRules: boolean;
  capsWarning: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
  radius: number;
};

// @config-start
const defaultConfig: PasswordConfig = {
  label: "New password",
  hint: "Use something you have not used elsewhere.",
  minLength: 12,
  requireNumber: true,
  requireSymbol: false,
  requireUpper: false,
  showToggle: true,
  showMeter: true,
  showRules: true,
  capsWarning: true,
  theme: "light",
  accentColor: "#2563eb",
  radius: 8,
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#8d8a99", good: "#1a7f52", bad: "#b4232b" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#8d8a99", good: "#6ddba4", bad: "#ff8f8f" },
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

/** The rules you set, each with whether this password meets it. */
export function passwordRules(value: string, config: PasswordConfig) {
  const rules = [{ text: `At least ${config.minLength} characters`, met: value.length >= config.minLength }];
  if (config.requireNumber) rules.push({ text: "A number", met: /\d/.test(value) });
  if (config.requireUpper) rules.push({ text: "A capital letter", met: /[A-Z]/.test(value) });
  if (config.requireSymbol) rules.push({ text: "A symbol, such as ! or ?", met: /[^A-Za-z0-9]/.test(value) });
  return rules;
}

/**
 * Strength in four steps: the rules you set, plus length and variety. It is a hint, never a
 * gate — the rules decide whether the password is allowed.
 */
export function passwordStrength(value: string, config: PasswordConfig) {
  if (value === "") return { score: 0, label: "Enter a password" };
  const met = passwordRules(value, config).filter((rule) => rule.met).length;
  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((pattern) => pattern.test(value)).length;
  const long = value.length >= config.minLength + 4;
  const score = Math.min(4, Math.max(1, met + (variety >= 3 ? 1 : 0) + (long ? 1 : 0) - 1));
  return { score, label: ["", "Weak", "Fair", "Good", "Strong"][score] };
}

export function Password({ config = defaultConfig }: { config?: PasswordConfig }) {
  const [value, setValue] = useState("");
  const [shown, setShown] = useState(false);
  const [caps, setCaps] = useState(false);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;

  const rules = passwordRules(value, config);
  const strength = passwordStrength(value, config);

  const style = {
    "--pw-accent": config.accentColor,
    "--pw-accent-text": readableAccent(config.accentColor, dark),
    "--pw-radius": `${config.radius}px`,
    "--pw-surface": palette.surface,
    "--pw-sunk": palette.sunk,
    "--pw-text": palette.text,
    "--pw-muted": palette.muted,
    "--pw-line": palette.line,
    "--pw-good": palette.good,
    "--pw-bad": palette.bad,
  } as CSSProperties;
  const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--pw-accent-text)";
  const describedBy = [config.hint.trim() !== "" ? "password-hint" : "", config.showRules ? "password-rules" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div style={style} className="bg-(--pw-surface) text-(--pw-text)">
      <label htmlFor="password-input" className="block font-medium">
        {config.label}
      </label>
      {config.hint.trim() !== "" && (
        <p id="password-hint" className="mt-0.5 text-sm text-(--pw-muted)">
          {config.hint}
        </p>
      )}

      <div className="mt-2 flex gap-2">
        <input
          id="password-input"
          type={shown ? "text" : "password"}
          value={value}
          autoComplete="new-password"
          aria-describedby={describedBy || undefined}
          onChange={(event) => setValue(event.target.value)}
          onKeyUp={(event) => config.capsWarning && setCaps(event.getModifierState?.("CapsLock") ?? false)}
          className={`w-full rounded-(--pw-radius) border border-(--pw-line) bg-(--pw-surface) px-3 py-2 ${focus}`}
        />
        {config.showToggle && (
          <button
            type="button"
            // aria-pressed says the state; the label says what pressing it does.
            aria-pressed={shown}
            onClick={() => setShown(!shown)}
            className={`shrink-0 cursor-pointer rounded-(--pw-radius) border border-(--pw-line) px-3 font-medium ${focus}`}
          >
            {shown ? "Hide" : "Show"}
            <span className="sr-only"> password</span>
          </button>
        )}
      </div>

      {config.capsWarning && caps && (
        <p role="status" className="mt-1 text-sm font-medium text-(--pw-bad)">
          Caps Lock is on.
        </p>
      )}

      {config.showMeter && (
        <div className="mt-3">
          <div aria-hidden="true" className="flex gap-1">
            {[1, 2, 3, 4].map((step) => (
              <span
                key={step}
                className={`h-1.5 flex-1 rounded-full ${
                  step <= strength.score ? "bg-(--pw-accent)" : "bg-(--pw-sunk)"
                }`}
              />
            ))}
          </div>
          {/* The words carry the meaning: the bars are only a picture of them. */}
          <p aria-live="polite" className="mt-1 text-sm text-(--pw-muted)">
            Password strength: {strength.label}
          </p>
        </div>
      )}

      {config.showRules && (
        <ul id="password-rules" className="mt-3 flex list-none flex-col gap-1 p-0 text-sm">
          {rules.map((rule) => (
            <li key={rule.text} className="flex items-center gap-2">
              <span aria-hidden="true" className={rule.met ? "text-(--pw-good)" : "text-(--pw-muted)"}>
                {rule.met ? "✓" : "•"}
              </span>
              <span className={rule.met ? "text-(--pw-muted)" : ""}>
                {rule.text}
                <span className="sr-only">{rule.met ? " (met)" : " (not met yet)"}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
