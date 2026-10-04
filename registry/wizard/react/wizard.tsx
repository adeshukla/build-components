"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export type WizardConfig = {
  heading: string;
  steps: { title: string; label: string; required: string }[];
  backText: string;
  nextText: string;
  finishText: string;
  showProgress: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
  stepText: string;
  currentLabel: string;
  neededText: string;
  neededError: string;
  sentText: string;
  notGivenText: string;
  sentNoteText: string;
};

// @config-start
const defaultConfig: WizardConfig = {
  heading: "Book a refit",
  steps: [
    { title: "Your boat", label: "Boat name", required: "yes" },
    { title: "The work", label: "What needs doing", required: "yes" },
    { title: "When", label: "Month you would like", required: "no" },
    { title: "Contact", label: "Email address", required: "yes" },
  ],
  backText: "Back",
  nextText: "Next",
  finishText: "Send it",
  showProgress: true,
  theme: "light",
  accentColor: "#1d4ed8",
  stepText: "Step {current} of {total}",
  currentLabel: "Current step:",
  neededText: "(needed)",
  neededError: "{label} is needed before you can go on.",
  sentText: "{heading}: sent",
  notGivenText: "Not given",
  sentNoteText: "Sent. Everything you filled in is listed above.",
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

/** Words with something put in them: "{count} left" (D94). */
const fill = (words: string, values: Record<string, string | number>) => words.replace(/\{(\w+)\}/g, (match, name) => String(values[name] ?? match));

export function Wizard({ config = defaultConfig }: { config?: WizardConfig }) {
  const id = useId();
  const steps = config.steps.filter((step) => step.title.trim() !== "");
  const [at, setAt] = useState(0);
  const [answers, setAnswers] = useState<string[]>(() => steps.map(() => ""));
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const fieldRef = useRef<HTMLInputElement>(null);
  const moved = useRef(false);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--wz-accent": config.accentColor,
    "--wz-accent-text": readableAccent(config.accentColor, dark),
    "--wz-on-accent": luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff",
    "--wz-surface": `var(--bc-${dark ? "dark" : "light"}-surface, ${palette.surface})`,
    "--wz-sunk": `var(--bc-${dark ? "dark" : "light"}-sunk, ${palette.sunk})`,
    "--wz-text": `var(--bc-${dark ? "dark" : "light"}-text, ${palette.text})`,
    "--wz-muted": `var(--bc-${dark ? "dark" : "light"}-muted, ${palette.muted})`,
    "--wz-line": `var(--bc-${dark ? "dark" : "light"}-line, ${palette.line})`,
    "--wz-error": palette.error,
  } as CSSProperties;

  // A new step is a new page as far as the reader is concerned: focus its heading.
  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    headingRef.current?.focus();
  }, [at, done]);

  const step = steps[at];
  const last = at === steps.length - 1;

  function go(to: number) {
    moved.current = true;
    setError("");
    setAt(to);
  }

  function forward() {
    if (step.required === "yes" && answers[at].trim() === "") {
      setError(fill(config.neededError, { label: step.label }));
      fieldRef.current?.focus();
      return;
    }
    if (last) {
      moved.current = true;
      setDone(true);
      return;
    }
    go(at + 1);
  }

  if (done) {
    return (
      <div style={style} className="bg-(--wz-surface) text-(--wz-text)">
        <h2 ref={headingRef} tabIndex={-1} className="text-lg font-semibold outline-none">
          {fill(config.sentText, { heading: config.heading })}
        </h2>
        <dl className="mt-3 grid gap-2 text-sm">
          {steps.map((entry, index) => (
            <div key={entry.title} className="flex flex-wrap justify-between gap-2 border-b border-(--wz-line) pb-1 last:border-0">
              <dt className="text-(--wz-muted)">{entry.label}</dt>
              <dd className="m-0">{answers[index].trim() === "" ? config.notGivenText : answers[index]}</dd>
            </div>
          ))}
        </dl>
        <p role="status" className="mt-3 text-sm text-(--wz-muted)">
          {config.sentNoteText}
        </p>
      </div>
    );
  }

  return (
    <div style={style} className="bg-(--wz-surface) text-(--wz-text)">
      <p className="text-sm text-(--wz-muted)">{config.heading}</p>

      {config.showProgress && (
        // The steps as a list, with the one you are on marked for everyone, not just in colour.
        <ol className="mt-1 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-sm">
          {steps.map((entry, index) => (
            <li key={entry.title} aria-current={index === at ? "step" : undefined} className={index === at ? "font-semibold" : "text-(--wz-muted)"}>
              {index === at && <span className="sr-only">{`${config.currentLabel} `}</span>}
              {`${index + 1}. ${entry.title}`}
            </li>
          ))}
        </ol>
      )}

      <h2 ref={headingRef} tabIndex={-1} className="mt-3 text-lg font-semibold outline-none">
        {step.title}
        <span className="ml-2 text-sm font-normal text-(--wz-muted)">{fill(config.stepText, { current: at + 1, total: steps.length })}</span>
      </h2>

      <div className="mt-3">
        <label htmlFor={`${id}-field`} className="block text-sm font-medium">
          {step.label}
          {step.required === "yes" && <span className="ml-1 text-(--wz-muted)">{config.neededText}</span>}
        </label>
        <input
          ref={fieldRef}
          id={`${id}-field`}
          type="text"
          value={answers[at]}
          required={step.required === "yes"}
          aria-invalid={error === "" ? undefined : true}
          aria-describedby={error === "" ? undefined : `${id}-error`}
          onChange={(event) => {
            const value = event.target.value;
            setAnswers((current) => current.map((entry, index) => (index === at ? value : entry)));
            // Once an error is showing, check as they type rather than punishing them on blur.
            if (error !== "" && value.trim() !== "") setError("");
          }}
          className={`mt-1 min-h-11 w-full rounded-[var(--bc-radius-sm,0.375rem)] border bg-(--wz-sunk) px-3 text-(--wz-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--wz-accent-text) ${
            error === "" ? "border-(--wz-line)" : "border-(--wz-error)"
          }`}
        />
        {error !== "" && (
          <p id={`${id}-error`} role="alert" className="mt-1 text-sm text-(--wz-error)">
            {error}
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {at > 0 && (
          <button
            type="button"
            onClick={() => go(at - 1)}
            className="min-h-11 cursor-pointer rounded-[var(--bc-radius-sm,0.375rem)] border border-(--wz-line) px-4 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--wz-accent-text)"
          >
            {config.backText}
          </button>
        )}
        <button
          type="button"
          onClick={forward}
          className="min-h-11 cursor-pointer rounded-[var(--bc-radius-button,0.375rem)] bg-(--wz-accent) px-4 font-medium text-(--wz-on-accent) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--wz-accent-text)"
        >
          {last ? config.finishText : config.nextText}
        </button>
      </div>
    </div>
  );
}
