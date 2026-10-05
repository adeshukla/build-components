"use client";

import { useId, useRef, useState, useSyncExternalStore, type CSSProperties, type FormEvent } from "react";

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
  action: string;
  validateOn: "blur" | "input" | "submit";
  errorSummary: boolean;
  marker: "optional" | "required" | "none";
  counter: boolean;
  layout: "one" | "two";
  theme: "light" | "dark" | "system";
  accentColor: string;
  radius: number;
  checkboxText: string;
  missingText: string;
  selectMissingText: string;
  dateMissingText: string;
  emailText: string;
  telText: string;
  urlText: string;
  notInListText: string;
  notNumberText: string;
  tooSmallText: string;
  tooBigText: string;
  tooEarlyText: string;
  tooLateText: string;
  tooShortText: string;
  tooLongText: string;
  formatHelpText: string;
  formatText: string;
  summaryTitle: string;
  errorPrefix: string;
  optionalText: string;
  requiredText: string;
  chooseOneText: string;
  remainingText: string;
  sendingText: string;
  sendErrorText: string;
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
  action: "",
  validateOn: "blur",
  errorSummary: false,
  marker: "optional",
  counter: true,
  layout: "two",
  theme: "light",
  accentColor: "#2563eb",
  radius: 8,
  checkboxText: "Select “{label}” to continue.",
  missingText: "Enter {name}.",
  selectMissingText: "Select {name}.",
  dateMissingText: "Enter {name}, for example 27 03 2026.",
  emailText: "Enter an email address in the correct format, like name@example.com.",
  telText: "Enter a phone number using only digits, spaces, brackets, + or -, like +44 20 7946 0000.",
  urlText: "Enter a web address in the correct format, like https://example.com.",
  notInListText: "Select {name} from the list.",
  notNumberText: "{label} must be a number.",
  tooSmallText: "{label} must be {min} or more.",
  tooBigText: "{label} must be {max} or less.",
  tooEarlyText: "{label} must be {min} or later.",
  tooLateText: "{label} must be {max} or earlier.",
  tooShortText: "{label} must be at least {min} characters. You have entered {count}.",
  tooLongText: "{label} must be {max} characters or fewer. You have entered {count}.",
  formatHelpText: "Enter {name} in the format described: {help}",
  formatText: "Enter {name} in the requested format.",
  summaryTitle: "There is a problem",
  errorPrefix: "Error:",
  optionalText: "(optional)",
  requiredText: "(required)",
  chooseOneText: "Choose one",
  remainingText: "{count} characters remaining",
  sendingText: "Sending…",
  sendErrorText: "It did not go through. Check your connection and try again.",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", muted: "#4d4a57", line: "#8d8a99", sunk: "#f4f3f8", error: "#b4232b" },
  dark: { surface: "#141019", text: "#f6f5fa", muted: "#b6b3c2", line: "#8d8a99", sunk: "#221d2e", error: "#ff8f8f" },
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
export function validateField(field: FormField, value: string, checked: boolean, words: FormConfig) {
  const type = fieldType(field);
  const label = field.label.trim();
  const lower = label.charAt(0).toLowerCase() + label.slice(1);
  const min = limit(field.min);
  const max = limit(field.max);
  const required = isRequired(field);

  const say = (text: string, values: Record<string, string | number> = {}) => fill(text, { label, name: lower, ...values });
  if (type === "checkbox") return required && !checked ? say(words.checkboxText) : "";

  const text = value.trim();
  if (text === "") {
    if (!required) return "";
    if (type === "select") return say(words.selectMissingText);
    if (type === "date") return say(words.dateMissingText);
    return say(words.missingText);
  }

  if (type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
    return words.emailText;
  }
  if (type === "tel" && !/^[\d\s()+-]{7,}$/.test(text)) {
    return words.telText;
  }
  if (type === "url" && !/^https?:\/\/[^\s.]+\.[^\s]{2,}$/i.test(text)) {
    return words.urlText;
  }
  if (type === "select" && choices(field).length > 0 && !choices(field).includes(text)) {
    return say(words.notInListText);
  }

  if (type === "number" || type === "date") {
    if (type === "number" && !Number.isFinite(Number(text))) return say(words.notNumberText);
    const size = type === "number" ? Number(text) : Date.parse(text);
    const low = type === "number" ? min : field.min.trim() === "" ? null : Date.parse(field.min);
    const high = type === "number" ? max : field.max.trim() === "" ? null : Date.parse(field.max);
    if (low !== null && size < low) return say(type === "number" ? words.tooSmallText : words.tooEarlyText, { min: field.min.trim() });
    if (high !== null && size > high) return say(type === "number" ? words.tooBigText : words.tooLateText, { max: field.max.trim() });
    return "";
  }

  if (min !== null && text.length < min) {
    return say(words.tooShortText, { min, count: text.length });
  }
  if (max !== null && text.length > max) {
    return say(words.tooLongText, { max, count: text.length });
  }
  if (field.pattern.trim() !== "") {
    try {
      if (!new RegExp(field.pattern).test(text)) {
        return field.help.trim() !== ""
          ? say(words.formatHelpText, { help: field.help.trim() })
          : say(words.formatText);
      }
    } catch {
      // An unusable pattern must never block the visitor.
    }
  }
  return "";
}

/** Words with something put in them: "{count} left" (D94). */
const fill = (words: string, values: Record<string, string | number>) => words.replace(/\{(\w+)\}/g, (match, name) => String(values[name] ?? match));

/**
 * Sends the form where the Send to option says, as a form would (a POST of its fields), and says whether it
 * arrived. With no address nothing is sent and it counts as done: a preview, or a page still being built.
 */
async function send(action: string, form: HTMLFormElement) {
  if (action.trim() === "") return true;
  try {
    const response = await fetch(action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
    return response.ok;
  } catch {
    return false;
  }
}

export function ContactForm({ config = defaultConfig }: { config?: FormConfig }) {
  const id = useId();
  /*
   * The name is the answer's name in the submitted data and stays exactly as it is; the id is only
   * an address on this page, and two of these forms on one page must not share one.
   */
  const fieldId = (name: string) => `${id}-${name}`;
  const fields = config.fields.filter((field) => field.label.trim() !== "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [values, setValues] = useState<Record<string, string>>({});
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
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
      config,
    );
    setErrors((current) => ({ ...current, [name]: message }));
    return message;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    const found: Record<string, string> = {};
    for (const field of fields) {
      const message = validateField(field, valueOf(field), checkedOf(field), config);
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

    setFailed(false);
    setSending(true);
    const delivered = await send(config.action, event.currentTarget);
    setSending(false);
    if (!delivered) {
      // What was typed stays, so trying again is one press.
      setFailed(true);
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
    "--fm-radius": `var(--bc-radius-md, ${config.radius}px)`,
    "--fm-surface": `var(--bc-${dark ? "dark" : "light"}-surface, ${palette.surface})`,
    "--fm-sunk": `var(--bc-${dark ? "dark" : "light"}-sunk, ${palette.sunk})`,
    "--fm-text": `var(--bc-${dark ? "dark" : "light"}-text, ${palette.text})`,
    "--fm-muted": `var(--bc-${dark ? "dark" : "light"}-muted, ${palette.muted})`,
    "--fm-line": `var(--bc-${dark ? "dark" : "light"}-line, ${palette.line})`,
    "--fm-error": palette.error,
  } as CSSProperties;

  const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--fm-accent-text)";
  const control = `w-full rounded-(--fm-radius) border bg-(--fm-surface) px-3 py-2 text-(--fm-text) ${focus}`;
  const listed = fields.filter((field) => (errors[fieldName(field.label)] ?? "") !== "");

  return (
    <section style={style} className="bg-(--fm-surface) text-(--fm-text)">
      <form ref={formRef} noValidate action={config.action.trim() || undefined} method="post" onSubmit={onSubmit} className="flex flex-col gap-5">
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
            aria-labelledby={`${id}-form-summary-title`}
            tabIndex={-1}
            className="rounded-(--fm-radius) border-2 border-(--fm-error) p-4"
          >
            <h3 id={`${id}-form-summary-title`} className="font-semibold text-(--fm-error)">
              {config.summaryTitle}
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

        {/* Subgrid keeps labels, inputs and messages on the same lines across both columns,
            however long a label or hint runs. */}
        <div
          className={
            config.layout === "two"
              ? "grid gap-x-5 gap-y-5 sm:grid-cols-2 sm:[grid-template-rows:repeat(auto-fill,auto)]"
              : "flex flex-col gap-5"
          }
        >
          {fields.map((field) => {
            const name = fieldName(field.label);
            const type = fieldType(field);
            const error = errors[name] ?? "";
            const required = isRequired(field);
            const max = limit(field.max);
            const wide = type === "textarea" || type === "checkbox";
            const describedBy = [field.help.trim() !== "" ? `${fieldId(name)}-help` : "", error !== "" ? `${fieldId(name)}-error` : ""]
              .filter(Boolean)
              .join(" ");

            if (type === "checkbox") {
              return (
                <div key={name} className={config.layout === "two" ? "sm:col-span-2" : ""}>
                  <div className="flex items-start gap-3">
                    <input
                      id={fieldId(name)}
                      name={name}
                      type="checkbox"
                      checked={checkedOf(field)}
                      aria-describedby={describedBy || undefined}
                      aria-invalid={error !== "" || undefined}
                      onChange={(event) => {
                        setChecks((current) => ({ ...current, [name]: event.target.checked }));
                        if (config.validateOn !== "submit" || error !== "") check(field, { checked: event.target.checked });
                      }}
                      className={`mt-0.5 size-6 shrink-0 accent-(--fm-accent) ${focus}`}
                    />
                    <label htmlFor={fieldId(name)} className="text-pretty">
                      {field.label}
                    </label>
                  </div>
                  {error !== "" && (
                    <p id={`${fieldId(name)}-error`} className="mt-1 text-sm font-medium text-(--fm-error)">
                      <span className="sr-only">{config.errorPrefix} </span>
                      {error}
                    </p>
                  )}
                </div>
              );
            }

            return (
              <div
                key={name}
                className={`grid content-start gap-y-1 sm:[grid-template-rows:subgrid] sm:row-span-3 ${
                  wide && config.layout === "two" ? "sm:col-span-2" : ""
                }`}
              >
                <div>
                  <label htmlFor={fieldId(name)} className="block font-medium">
                    {field.label}
                    {config.marker === "optional" && !required && <span className="text-(--fm-muted)"> {config.optionalText}</span>}
                    {config.marker === "required" && required && <span className="text-(--fm-muted)"> {config.requiredText}</span>}
                  </label>
                  {field.help.trim() !== "" && (
                    <p id={`${fieldId(name)}-help`} className="mt-0.5 text-sm text-(--fm-muted)">
                      {field.help}
                    </p>
                  )}
                </div>

                {type === "textarea" ? (
                  <textarea
                    id={fieldId(name)}
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
                    className={`${control} ${error !== "" ? "border-2 border-(--fm-error)" : "border-(--fm-line)"}`}
                  />
                ) : type === "select" ? (
                  <select
                    id={fieldId(name)}
                    name={name}
                    value={valueOf(field)}
                    aria-describedby={describedBy || undefined}
                    aria-invalid={error !== "" || undefined}
                    onChange={(event) => {
                      setValues((current) => ({ ...current, [name]: event.target.value }));
                      if (config.validateOn !== "submit" || error !== "") check(field, { value: event.target.value });
                    }}
                    onBlur={() => config.validateOn === "blur" && check(field)}
                    className={`${control} ${error !== "" ? "border-2 border-(--fm-error)" : "border-(--fm-line)"}`}
                  >
                    <option value="">{config.chooseOneText}</option>
                    {choices(field).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={fieldId(name)}
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
                    className={`${control} ${error !== "" ? "border-2 border-(--fm-error)" : "border-(--fm-line)"}`}
                  />
                )}

                {/* The message line: the error sits under its field, where every other design
                    system puts it, and the counter shares the line once there is something to
                    count. Both live in one row so the grid stays aligned. */}
                <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1 text-sm">
                  {error !== "" ? (
                    <p id={`${fieldId(name)}-error`} className="font-medium text-(--fm-error)">
                      <span className="sr-only">{config.errorPrefix} </span>
                      {error}
                    </p>
                  ) : (
                    <span />
                  )}
                  {config.counter && max !== null && (type === "text" || type === "textarea") && valueOf(field) !== "" && (
                    <p aria-live="polite" className="ml-auto text-(--fm-muted)">
                      {fill(config.remainingText, { count: Math.max(0, max - valueOf(field).length) })}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div>
          <button
            type="submit"
            aria-disabled={sending || undefined}
            className={`cursor-pointer rounded-(--fm-radius) bg-(--fm-accent) px-5 py-3 font-semibold text-(--fm-on-accent) aria-disabled:cursor-wait ${focus}`}
          >
            {sending ? config.sendingText : config.submitText}
          </button>
          {failed && (
            <p role="alert" className="mt-3 font-medium text-(--fm-error)">
              {config.sendErrorText}
            </p>
          )}
        </div>
      </form>
    </section>
  );
}
