"use client";

import { useId, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export type ErrorSummaryConfig = {
  legend: string;
  heading: string;
  headingLevel: "h2" | "h3";
  countInHeading: boolean;
  fields: { label: string; kind: string; required: string }[];
  submitLabel: string;
  successText: string;
  markFields: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: ErrorSummaryConfig = {
  legend: "Your details",
  heading: "There is a problem",
  headingLevel: "h2",
  countInHeading: false,
  fields: [
    { label: "Full name", kind: "text", required: "yes" },
    { label: "Email address", kind: "email", required: "yes" },
    { label: "Phone number", kind: "tel", required: "no" },
  ],
  submitLabel: "Continue",
  successText: "Thank you. Your details were accepted.",
  markFields: true,
  theme: "light",
  accentColor: "#1d4ed8",
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

/** What is wrong with one answer, said as an instruction rather than as a label plus "invalid". */
export function problemWith(field: { label: string; kind: string; required: string }, value: string) {
  if (field.required === "yes" && value.trim() === "") return `Enter your ${field.label.toLowerCase()}`;
  if (value.trim() === "") return "";
  if (field.kind === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
    return `Enter an email address in the form name@example.com`;
  if (field.kind === "tel" && !/^[0-9+()\s-]{7,}$/.test(value)) return `Enter a phone number using only digits, spaces, + and brackets`;
  return "";
}

export function ErrorSummary({ config = defaultConfig }: { config?: ErrorSummaryConfig }) {
  const id = useId();
  const [values, setValues] = useState<string[]>(() => config.fields.map(() => ""));
  const [problems, setProblems] = useState<{ index: number; message: string }[] | null>(null);
  const [done, setDone] = useState(false);
  const summary = useRef<HTMLDivElement | null>(null);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--esm-accent": config.accentColor,
    "--esm-accent-text": readableAccent(config.accentColor, dark),
    "--esm-on-accent": luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff",
    "--esm-surface": `var(--bc-${dark ? "dark" : "light"}-surface, ${palette.surface})`,
    "--esm-sunk": `var(--bc-${dark ? "dark" : "light"}-sunk, ${palette.sunk})`,
    "--esm-text": `var(--bc-${dark ? "dark" : "light"}-text, ${palette.text})`,
    "--esm-muted": `var(--bc-${dark ? "dark" : "light"}-muted, ${palette.muted})`,
    "--esm-line": `var(--bc-${dark ? "dark" : "light"}-line, ${palette.line})`,
    "--esm-error": palette.error,
  } as CSSProperties;

  const Heading = config.headingLevel;
  const at = (index: number) => values[index] ?? "";
  const problemAt = (index: number) => problems?.find((problem) => problem.index === index)?.message ?? "";

  const check = () => {
    const found = config.fields
      .map((field, index) => ({ index, message: problemWith(field, at(index)) }))
      .filter((problem) => problem.message !== "");
    setProblems(found);
    setDone(found.length === 0);
    // Focus goes to the summary, not the first field: the list is the thing that has to be read.
    if (found.length > 0) requestAnimationFrame(() => summary.current?.focus());
  };

  const count = problems?.length ?? 0;

  return (
    <div style={style} className="bg-(--esm-surface) text-(--esm-text)">
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          check();
        }}
      >
        {count > 0 && (
          // A focusable region, announced once by the move rather than twice by a live region.
          <div
            ref={summary}
            tabIndex={-1}
            role="group"
            aria-labelledby={`${id}-summary-heading`}
            className="mb-5 rounded-[var(--bc-radius-sm,0.375rem)] border-4 border-(--esm-error) p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--esm-accent-text)"
          >
            <Heading id={`${id}-summary-heading`} className="m-0 text-lg font-semibold text-(--esm-error)">
              {config.countInHeading ? `${count} ${count === 1 ? "problem" : "problems"} to fix` : config.heading}
            </Heading>
            <ul className="mt-2 list-disc pl-5">
              {problems?.map((problem) => (
                <li key={problem.index} className="mt-1">
                  {/* A link, so Tab reaches it and Enter jumps to the answer that needs changing. */}
                  <a
                    href={`#${id}-field-${problem.index}`}
                    className="min-h-6 font-medium text-(--esm-error) underline"
                    onClick={(event) => {
                      event.preventDefault();
                      document.getElementById(`${id}-field-${problem.index}`)?.focus();
                    }}
                  >
                    {problem.message}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <fieldset className="m-0 border-0 p-0">
          <legend className="p-0 font-medium">{config.legend}</legend>

          {config.fields.map((field, index) => {
            const message = problemAt(index);
            return (
              <div key={index} className="mt-4">
                <label htmlFor={`${id}-field-${index}`} className="block text-sm font-medium">
                  {field.label}
                  {field.required !== "yes" && <span className="font-normal text-(--esm-muted)"> (optional)</span>}
                </label>
                {message !== "" && config.markFields && (
                  <p id={`${id}-error-${index}`} className="mt-1 text-sm font-medium text-(--esm-error)">
                    {message}
                  </p>
                )}
                <input
                  id={`${id}-field-${index}`}
                  name={field.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
                  type={field.kind === "email" ? "email" : field.kind === "tel" ? "tel" : "text"}
                  value={at(index)}
                  aria-invalid={message !== "" ? true : undefined}
                  aria-describedby={message !== "" && config.markFields ? `${id}-error-${index}` : undefined}
                  onChange={(event) => {
                    const next = [...values];
                    next[index] = event.target.value;
                    setValues(next);
                    // Once a problem is shown, it follows the typing rather than waiting for another submit.
                    if (problems !== null) setProblems(problems.filter((problem) => problem.index !== index));
                  }}
                  className={`mt-2 min-h-11 w-full max-w-md rounded-[var(--bc-radius-sm,0.375rem)] border bg-(--esm-sunk) px-3 text-(--esm-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--esm-accent-text) ${
                    message !== "" ? "border-(--esm-error)" : "border-(--esm-line)"
                  }`}
                />
              </div>
            );
          })}
        </fieldset>

        <button
          type="submit"
          className="mt-5 min-h-11 rounded-[var(--bc-radius-button,0.375rem)] bg-(--esm-accent) px-5 font-medium text-(--esm-on-accent) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--esm-accent-text)"
        >
          {config.submitLabel}
        </button>

        <p role="status" className="mt-3 text-sm text-(--esm-muted)">
          {done ? config.successText : ""}
        </p>
      </form>
    </div>
  );
}
