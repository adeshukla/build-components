"use client";

import { useId, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export type NewsletterConfig = {
  heading: string;
  copy: string;
  emailLabel: string;
  placeholder: string;
  buttonText: string;
  name: string;
  requireConsent: boolean;
  consentText: string;
  note: string;
  successText: string;
  layout: "inline" | "stacked";
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: NewsletterConfig = {
  heading: "Notes from the yard",
  copy: "What we have been fixing, and what we learnt doing it. Once a month, no more.",
  emailLabel: "Email address",
  placeholder: "",
  buttonText: "Sign me up",
  name: "email",
  requireConsent: true,
  consentText: "Yes, send me the monthly note.",
  note: "One email a month. Unsubscribe from any of them.",
  successText: "Thanks — check your inbox to confirm it is you.",
  layout: "inline",
  theme: "light",
  accentColor: "#0f766e",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6", error: "#b42318" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459", error: "#ff9d95" },
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

export function Newsletter({ config = defaultConfig }: { config?: NewsletterConfig }) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const fieldRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--nl-accent": config.accentColor,
    "--nl-accent-text": readableAccent(config.accentColor, dark),
    "--nl-on-accent": luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff",
    "--nl-surface": palette.surface,
    "--nl-sunk": palette.sunk,
    "--nl-text": palette.text,
    "--nl-muted": palette.muted,
    "--nl-line": palette.line,
    "--nl-error": palette.error,
  } as CSSProperties;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    // Checked here rather than left to the browser's bubble, which vanishes and cannot be read back.
    const address = email.trim();
    if (address === "" || !/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(address)) {
      setError("Enter an email address like name@example.com.");
      fieldRef.current?.focus();
      return;
    }
    if (config.requireConsent && !consent) {
      setError("Tick the box to say we may email you.");
      consentRef.current?.focus();
      return;
    }
    setError("");
    setDone(true);
    setEmail("");
    setConsent(false);
  }

  return (
    <section style={style} aria-labelledby={`${id}-heading`} className="rounded-xl border border-(--nl-line) bg-(--nl-sunk) p-5 text-(--nl-text)">
      <h2 id={`${id}-heading`} className="text-lg font-semibold">
        {config.heading}
      </h2>
      {config.copy.trim() !== "" && <p className="mt-1 max-w-prose text-sm text-(--nl-muted)">{config.copy}</p>}

      <form noValidate onSubmit={submit} className="mt-4">
        <div className={config.layout === "inline" ? "flex flex-wrap items-end gap-3" : "grid gap-3"}>
          <div className={config.layout === "inline" ? "min-w-56 flex-1" : ""}>
            <label htmlFor={`${id}-email`} className="block text-sm font-medium">
              {config.emailLabel}
            </label>
            <input
              ref={fieldRef}
              id={`${id}-email`}
              name={config.name}
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              placeholder={config.placeholder}
              aria-invalid={error !== "" && !consentError(error) ? true : undefined}
              aria-describedby={`${config.note.trim() === "" ? "" : `${id}-note`}${error !== "" ? ` ${id}-error` : ""}`.trim() || undefined}
              onChange={(event) => {
                setEmail(event.target.value);
                if (error !== "") setError("");
              }}
              className={`mt-1 min-h-11 w-full rounded-md border bg-(--nl-surface) px-3 text-(--nl-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--nl-accent-text) ${
                error !== "" && !consentError(error) ? "border-(--nl-error)" : "border-(--nl-line)"
              }`}
            />
          </div>
          <button
            type="submit"
            className="min-h-11 shrink-0 cursor-pointer rounded-md bg-(--nl-accent) px-4 font-medium text-(--nl-on-accent) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--nl-accent-text)"
          >
            {config.buttonText}
          </button>
        </div>

        {config.requireConsent && (
          <label className="mt-3 flex min-h-11 cursor-pointer items-start gap-3 text-sm">
            <input
              ref={consentRef}
              type="checkbox"
              name="consent"
              checked={consent}
              onChange={(event) => {
                setConsent(event.target.checked);
                if (error !== "") setError("");
              }}
              className="mt-0.5 size-5 shrink-0 accent-(--nl-accent)"
            />
            <span>{config.consentText}</span>
          </label>
        )}

        {config.note.trim() !== "" && (
          <p id={`${id}-note`} className="mt-2 text-xs text-(--nl-muted)">
            {config.note}
          </p>
        )}

        {error !== "" && (
          <p id={`${id}-error`} role="alert" className="mt-2 text-sm text-(--nl-error)">
            {error}
          </p>
        )}
      </form>

      {/* The form stays where it is and the outcome is said, rather than the form vanishing. */}
      <p role="status" className="mt-3 text-sm text-(--nl-muted)">
        {done ? config.successText : ""}
      </p>
    </section>
  );
}

/** The consent message belongs to the box, not to the email field. */
function consentError(message: string) {
  return message.startsWith("Tick the box");
}
