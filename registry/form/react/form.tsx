"use client";

import { useRef, useState, useSyncExternalStore, type CSSProperties, type FormEvent } from "react";

export type FormField = {
  label: string;
  type: string;
  required: string;
  min: string;
  max: string;
  pattern: string;
  options: string;
  help: string;
};

export type FormConfig = {
  title: string;
  intro: string;
  submitText: string;
  successMessage: string;
  fields: FormField[];
  validateOn: "blur" | "input" | "submit";
  errorSummary: boolean;
  marker: "optional" | "required" | "none";
  counter: boolean;
  layout: "one" | "two";
  theme: "light" | "dark" | "system";
  accentColor: string;
  radius: number;
};

// @config-start
const defaultConfig: FormConfig = {
  title: "Send us a message",
  intro: "We answer every message within two working days.",
  submitText: "Send message",
  successMessage: "Thanks. Your message has been sent.",
  fields: [
    { label: "Full name", type: "text", required: "yes", min: "2", max: "60", pattern: "", options: "", help: "" },
    { label: "Email address", type: "email", required: "yes", min: "", max: "", pattern: "", options: "", help: "" },
    { label: "Phone number", type: "tel", required: "no", min: "", max: "", pattern: "", options: "", help: "" },
    {
      label: "How can we help",
      type: "select",
      required: "yes",
      min: "",
      max: "",
      pattern: "",
      options: "New project, Support, Something else",
      help: "",
    },
    {
      label: "Message",
      type: "textarea",
      required: "yes",
      min: "20",
      max: "500",
      pattern: "",
      options: "",
      help: "Tell us what you need and when you need it.",
    },
    {
      label: "I agree to be contacted about this enquiry",
      type: "checkbox",
      required: "yes",
      min: "",
      max: "",
      pattern: "",
      options: "",
      help: "",
    },
  ],
  validateOn: "blur",
  errorSummary: true,
  marker: "optional",
  counter: true,
  layout: "two",
  theme: "light",
  accentColor: "#2563eb",
  radius: 8,
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", muted: "#4d4a57", line: "#8d8a99", sunk: "#f4f3f8", error: "#b4232b" },
  dark: { surface: "#141019", text: "#f6f5fa", muted: "#b6b3c2", line: "#8d8a99", sunk: "#221d2e", error: "#ff8f8f" },
};

const darkMedia = {
  subscribe: (onChange: () => void) => {
    const list = window.matchMedia("(prefers-color-scheme: dark)");
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  },
  get: () => window.matchMedia("(prefers-color-scheme: dark)").matches,
};

// WCAG relative luminance, used to keep text on the accent readable.
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

const types = ["text", "email", "tel", "url", "number", "date", "textarea", "select", "checkbox"];

/** A field's name attribute, from its label: "Full name" becomes "full-name". */
export function fieldName(label: string) {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "field";
}

const isRequired = (field: FormField) => /^(yes|true|y|1)$/i.test(field.required.trim());
const fieldType = (field: FormField) => (types.includes(field.type.trim().toLowerCase()) ? field.type.trim().toLowerCase() : "text");
const choices = (field: FormField) => field.options.split(",").map((option) => option.trim()).filter(Boolean);
const limit = (value: string) => (value.trim() === "" || !Number.isFinite(Number(value)) ? null : Number(value));

/**
 * One rule set for both outputs. Messages name the problem and the fix, in the style of the
 * GOV.UK Design System: "Enter your full name", not "Invalid input".
 */
export function validateField(field: FormField, value: string, checked: boolean) {
  const type = fieldType(field);
  const label = field.label.trim();
  const lower = label.charAt(0).toLowerCase() + label.slice(1);
  const min = limit(field.min);
  const max = limit(field.max);
  const required = isRequired(field);

  if (type === "checkbox") return required && !checked ? `Select “${label}” to continue.` : "";

  const text = value.trim();
  if (text === "") {
    if (!required) return "";
    if (type === "select") return `Select ${lower}.`;
    if (type === "date") return `Enter ${lower}, for example 27 03 2026.`;
    return `Enter ${lower}.`;
  }

  if (type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
    return "Enter an email address in the correct format, like name@example.com.";
  }
  if (type === "tel" && !/^[\d\s()+-]{7,}$/.test(text)) {
    return "Enter a phone number using only digits, spaces, brackets, + or -, like +44 20 7946 0000.";
  }
  if (type === "url" && !/^https?:\/\/[^\s.]+\.[^\s]{2,}$/i.test(text)) {
    return "Enter a web address in the correct format, like https://example.com.";
  }
  if (type === "select" && choices(field).length > 0 && !choices(field).includes(text)) {
    return `Select ${lower} from the list.`;
  }

  if (type === "number" || type === "date") {
    if (type === "number" && !Number.isFinite(Number(text))) return `${label} must be a number.`;
    const size = type === "number" ? Number(text) : Date.parse(text);
    const low = type === "number" ? min : field.min.trim() === "" ? null : Date.parse(field.min);
    const high = type === "number" ? max : field.max.trim() === "" ? null : Date.parse(field.max);
    if (low !== null && size < low) return `${label} must be ${field.min} or later.`.replace("or later", type === "number" ? "or more" : "or later");
    if (high !== null && size > high) return `${label} must be ${field.max} or earlier.`.replace("or earlier", type === "number" ? "or less" : "or earlier");
    return "";
  }

  if (min !== null && text.length < min) {
    return `${label} must be at least ${min} characters. You have entered ${text.length}.`;
  }
  if (max !== null && text.length > max) {
    return `${label} must be ${max} characters or fewer. You have entered ${text.length}.`;
  }
  if (field.pattern.trim() !== "") {
    try {
      if (!new RegExp(field.pattern).test(text)) {
        return field.help.trim() !== ""
          ? `Enter ${lower} in the format described: ${field.help.trim()}`
          : `Enter ${lower} in the requested format.`;
      }
    } catch {
      // An unusable pattern must never block the visitor.
    }
  }
  return "";
}

export function ContactForm({ config = defaultConfig }: { config?: FormConfig }) {
  const fields = config.fields.filter((field) => field.label.trim() !== "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [values, setValues] = useState<Record<string, string>>({});
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [sent, setSent] = useState(false);
  const [shown, setShown] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLParagraphElement>(null);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;

  const valueOf = (field: FormField) => values[fieldName(field.label)] ?? "";
  const checkedOf = (field: FormField) => checks[fieldName(field.label)] ?? false;

  function check(field: FormField, next?: { value?: string; checked?: boolean }) {
    const name = fieldName(field.label);
    const message = validateField(
      field,
      next?.value ?? valueOf(field),
      next?.checked ?? checkedOf(field),
    );
    setErrors((current) => ({ ...current, [name]: message }));
    return message;
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found: Record<string, string> = {};
    for (const field of fields) {
      const message = validateField(field, valueOf(field), checkedOf(field));
      if (message !== "") found[fieldName(field.label)] = message;
    }
    setErrors(found);
    setShown(true);

    const names = Object.keys(found);
    if (names.length > 0) {
      // Focus goes to the summary when there is one, or to the first field that needs fixing.
      requestAnimationFrame(() => {
        if (config.errorSummary) summaryRef.current?.focus();
        else formRef.current?.querySelector<HTMLElement>(`[name="${names[0]}"]`)?.focus();
      });
      return;
    }

    setSent(true);
    setValues({});
    setChecks({});
    setShown(false);
    requestAnimationFrame(() => successRef.current?.focus());
  }

  const style = {
    "--fm-accent": config.accentColor,
    "--fm-accent-text": readableAccent(config.accentColor, dark),
    "--fm-on-accent": luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff",
    "--fm-radius": `${config.radius}px`,
    "--fm-surface": palette.surface,
    "--fm-sunk": palette.sunk,
    "--fm-text": palette.text,
    "--fm-muted": palette.muted,
    "--fm-line": palette.line,
    "--fm-error": palette.error,
  } as CSSProperties;

  const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--fm-accent-text)";
  const control = `w-full rounded-(--fm-radius) border bg-(--fm-surface) px-3 py-2 text-(--fm-text) ${focus}`;
  const listed = fields.filter((field) => (errors[fieldName(field.label)] ?? "") !== "");

  return (
    <section style={style} className="bg-(--fm-surface) text-(--fm-text)">
      <form ref={formRef} noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
        <div>
          <h2 className="text-2xl font-semibold">{config.title}</h2>
          {config.intro.trim() !== "" && <p className="mt-1 text-pretty text-(--fm-muted)">{config.intro}</p>}
        </div>

        {sent && (
          <p
            ref={successRef}
            role="status"
            tabIndex={-1}
            className="rounded-(--fm-radius) border-l-4 border-(--fm-accent) bg-(--fm-sunk) px-4 py-3 font-medium"
          >
            {config.successMessage}
          </p>
        )}

        {config.errorSummary && shown && listed.length > 0 && (
          <div
            ref={summaryRef}
            role="alert"
            aria-labelledby="form-summary-title"
            tabIndex={-1}
            className="rounded-(--fm-radius) border-2 border-(--fm-error) p-4"
          >
            <h3 id="form-summary-title" className="font-semibold text-(--fm-error)">
              There is a problem
            </h3>
            <ul className="mt-2 flex list-none flex-col gap-1 p-0">
              {listed.map((field) => (
                <li key={fieldName(field.label)}>
                  <a
                    href={`#${fieldName(field.label)}`}
                    onClick={(event) => {
                      event.preventDefault();
                      formRef.current?.querySelector<HTMLElement>(`[name="${fieldName(field.label)}"]`)?.focus();
                    }}
                    // At least 24px tall, so the link is a large enough target (WCAG 2.2).
                    className={`inline-block min-h-6 py-0.5 text-(--fm-error) underline ${focus}`}
                  >
                    {errors[fieldName(field.label)]}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className={config.layout === "two" ? "grid gap-5 sm:grid-cols-2" : "flex flex-col gap-5"}>
          {fields.map((field) => {
            const name = fieldName(field.label);
            const type = fieldType(field);
            const error = errors[name] ?? "";
            const required = isRequired(field);
            const max = limit(field.max);
            const wide = type === "textarea" || type === "checkbox";
            const describedBy = [field.help.trim() !== "" ? `${name}-help` : "", error !== "" ? `${name}-error` : ""]
              .filter(Boolean)
              .join(" ");

            if (type === "checkbox") {
              return (
                <div key={name} className={config.layout === "two" ? "sm:col-span-2" : ""}>
                  <div className="flex items-start gap-3">
                    <input
                      id={name}
                      name={name}
                      type="checkbox"
                      checked={checkedOf(field)}
                      aria-describedby={describedBy || undefined}
                      aria-invalid={error !== "" || undefined}
                      onChange={(event) => {
                        setChecks((current) => ({ ...current, [name]: event.target.checked }));
                        if (config.validateOn !== "submit" || error !== "") check(field, { checked: event.target.checked });
                      }}
                      className={`mt-1 size-5 shrink-0 accent-(--fm-accent) ${focus}`}
                    />
                    <label htmlFor={name} className="text-pretty">
                      {field.label}
                    </label>
                  </div>
                  {error !== "" && (
                    <p id={`${name}-error`} className="mt-1 font-medium text-(--fm-error)">
                      <span className="sr-only">Error: </span>
                      {error}
                    </p>
                  )}
                </div>
              );
            }

            return (
              <div key={name} className={wide && config.layout === "two" ? "sm:col-span-2" : ""}>
                <label htmlFor={name} className="block font-medium">
                  {field.label}
                  {config.marker === "optional" && !required && <span className="text-(--fm-muted)"> (optional)</span>}
                  {config.marker === "required" && required && <span className="text-(--fm-muted)"> (required)</span>}
                </label>
                {field.help.trim() !== "" && (
                  <p id={`${name}-help`} className="mt-0.5 text-sm text-(--fm-muted)">
                    {field.help}
                  </p>
                )}
                {error !== "" && (
                  <p id={`${name}-error`} className="mt-1 font-medium text-(--fm-error)">
                    <span className="sr-only">Error: </span>
                    {error}
                  </p>
                )}

                {type === "textarea" ? (
                  <textarea
                    id={name}
                    name={name}
                    rows={5}
                    value={valueOf(field)}
                    maxLength={max ?? undefined}
                    aria-describedby={describedBy || undefined}
                    aria-invalid={error !== "" || undefined}
                    onChange={(event) => {
                      setValues((current) => ({ ...current, [name]: event.target.value }));
                      if (config.validateOn === "input" || error !== "") check(field, { value: event.target.value });
                    }}
                    onBlur={() => config.validateOn === "blur" && check(field)}
                    className={`${control} mt-1 ${error !== "" ? "border-2 border-(--fm-error)" : "border-(--fm-line)"}`}
                  />
                ) : type === "select" ? (
                  <select
                    id={name}
                    name={name}
                    value={valueOf(field)}
                    aria-describedby={describedBy || undefined}
                    aria-invalid={error !== "" || undefined}
                    onChange={(event) => {
                      setValues((current) => ({ ...current, [name]: event.target.value }));
                      if (config.validateOn !== "submit" || error !== "") check(field, { value: event.target.value });
                    }}
                    onBlur={() => config.validateOn === "blur" && check(field)}
                    className={`${control} mt-1 ${error !== "" ? "border-2 border-(--fm-error)" : "border-(--fm-line)"}`}
                  >
                    <option value="">Choose one</option>
                    {choices(field).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={name}
                    name={name}
                    type={type === "number" ? "text" : type}
                    inputMode={type === "number" ? "numeric" : undefined}
                    value={valueOf(field)}
                    min={type === "date" && field.min.trim() !== "" ? field.min : undefined}
                    max={type === "date" && field.max.trim() !== "" ? field.max : undefined}
                    maxLength={type === "text" && max !== null ? max : undefined}
                    autoComplete={type === "email" ? "email" : type === "tel" ? "tel" : undefined}
                    aria-describedby={describedBy || undefined}
                    aria-invalid={error !== "" || undefined}
                    onChange={(event) => {
                      setValues((current) => ({ ...current, [name]: event.target.value }));
                      if (config.validateOn === "input" || error !== "") check(field, { value: event.target.value });
                    }}
                    onBlur={() => config.validateOn === "blur" && check(field)}
                    className={`${control} mt-1 ${error !== "" ? "border-2 border-(--fm-error)" : "border-(--fm-line)"}`}
                  />
                )}

                {config.counter && max !== null && (type === "text" || type === "textarea") && (
                  <p aria-live="polite" className="mt-1 text-sm text-(--fm-muted)">
                    {Math.max(0, max - valueOf(field).length)} characters remaining
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div>
          <button
            type="submit"
            className={`cursor-pointer rounded-(--fm-radius) bg-(--fm-accent) px-5 py-3 font-semibold text-(--fm-on-accent) ${focus}`}
          >
            {config.submitText}
          </button>
        </div>
      </form>
    </section>
  );
}
