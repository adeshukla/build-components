"use client";

import { useId, useRef, useState, useSyncExternalStore, type CSSProperties, type FormEvent } from "react";

export type FormConfig = {
  title: string;
  submitText: string;
  successMessage: string;
  nameLabel: string;
  emailLabel: string;
  phoneField: boolean;
  phoneLabel: string;
  phoneRequired: boolean;
  messageField: boolean;
  messageLabel: string;
  messageMinLength: number;
  consentField: boolean;
  consentLabel: string;
  validateOn: "blur" | "submit";
  errorSummary: boolean;
  optionalMarker: boolean;
  layout: "one" | "two";
  theme: "light" | "dark" | "system";
  accentColor: string;
  radius: number;
};

// @config-start
const defaultConfig: FormConfig = {
  title: "Send us a message",
  submitText: "Send message",
  successMessage: "Thanks. Your message has been sent.",
  nameLabel: "Full name",
  emailLabel: "Email address",
  phoneField: true,
  phoneLabel: "Phone number",
  phoneRequired: false,
  messageField: true,
  messageLabel: "Message",
  messageMinLength: 20,
  consentField: true,
  consentLabel: "I agree to be contacted about this enquiry",
  validateOn: "blur",
  errorSummary: true,
  optionalMarker: true,
  layout: "two",
  theme: "light",
  accentColor: "#2563eb",
  radius: 8,
};
// @config-end

export type FormValues = { name: string; email: string; phone: string; message: string; consent: boolean };
type FieldName = keyof FormValues;
type Errors = Partial<Record<FieldName, string>>;

const emptyValues: FormValues = { name: "", email: "", phone: "", message: "", consent: false };
const order: FieldName[] = ["name", "email", "phone", "message", "consent"];

const palettes = {
  light: { surface: "#ffffff", sunk: "#f5f4f9", text: "#16121f", muted: "#4d4a57", border: "#6f6b7a", error: "#b3261e", errorBg: "#fdf2f2", success: "#0f6b45", successBg: "#eaf6f0" },
  dark: { surface: "#141019", sunk: "#1d1826", text: "#f6f5fa", muted: "#b6b3c2", border: "#8d8a99", error: "#ff8a8a", errorBg: "#2a1414", success: "#6ee7a8", successBg: "#10251c" },
};

const darkMedia = {
  subscribe: (onChange: () => void) => {
    const list = window.matchMedia("(prefers-color-scheme: dark)");
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  },
  get: () => window.matchMedia("(prefers-color-scheme: dark)").matches,
};

// WCAG relative luminance, used to keep button text readable on any accent colour.
function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Every message names the problem and what to do about it. */
export function validateField(field: FieldName, values: FormValues, config: FormConfig): string {
  const value = values[field];
  if (field === "name") {
    return typeof value === "string" && value.trim() === "" ? `Enter your ${config.nameLabel.toLowerCase()}.` : "";
  }
  if (field === "email") {
    const email = String(value).trim();
    if (email === "") return `Enter your ${config.emailLabel.toLowerCase()}.`;
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
      ? ""
      : "Enter an email address in the correct format, like name@example.com.";
  }
  if (field === "phone") {
    if (!config.phoneField) return "";
    const phone = String(value).trim();
    if (phone === "") return config.phoneRequired ? `Enter your ${config.phoneLabel.toLowerCase()}.` : "";
    const digits = phone.replace(/[^0-9]/g, "");
    return /^\+?[0-9\s()-]+$/.test(phone) && digits.length >= 7
      ? ""
      : "Enter a phone number using only digits, spaces, brackets, + or -, like +44 20 7946 0000.";
  }
  if (field === "message") {
    if (!config.messageField || config.messageMinLength === 0) return "";
    const message = String(value).trim();
    if (message === "") return `Enter your ${config.messageLabel.toLowerCase()}.`;
    return message.length < config.messageMinLength
      ? `Your ${config.messageLabel.toLowerCase()} must be at least ${config.messageMinLength} characters. You have written ${message.length}.`
      : "";
  }
  if (field === "consent") {
    return config.consentField && value !== true ? "Select the checkbox to agree before sending." : "";
  }
  return "";
}

function validateAll(values: FormValues, config: FormConfig): Errors {
  const errors: Errors = {};
  for (const field of order) {
    const message = validateField(field, values, config);
    if (message) errors[field] = message;
  }
  return errors;
}

export function ContactForm({
  config = defaultConfig,
  onSubmit,
}: {
  config?: FormConfig;
  /** Called with the values once everything is valid. Wire it to your own endpoint. */
  onSubmit?: (values: FormValues) => void;
}) {
  const id = useId();
  const [values, setValues] = useState<FormValues>(emptyValues);
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLParagraphElement>(null);

  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const accentLuminance = luminance(config.accentColor);
  const style = {
    "--fm-accent": config.accentColor,
    "--fm-on-accent": accentLuminance > 0.179 ? "#000000" : "#ffffff",
    "--fm-ring": accentLuminance <= 0.35 || dark ? config.accentColor : palette.text,
    "--fm-radius": `${config.radius}px`,
    "--fm-surface": palette.surface,
    "--fm-sunk": palette.sunk,
    "--fm-text": palette.text,
    "--fm-muted": palette.muted,
    "--fm-border": palette.border,
    "--fm-error": palette.error,
    "--fm-error-bg": palette.errorBg,
    "--fm-success": palette.success,
    "--fm-success-bg": palette.successBg,
  } as CSSProperties;

  const shown = order.filter(
    (field) =>
      (field !== "phone" || config.phoneField) &&
      (field !== "message" || config.messageField) &&
      (field !== "consent" || config.consentField),
  );
  const labels: Record<FieldName, string> = {
    name: config.nameLabel,
    email: config.emailLabel,
    phone: config.phoneLabel,
    message: config.messageLabel,
    consent: config.consentLabel,
  };
  const optional: Record<FieldName, boolean> = {
    name: false,
    email: false,
    phone: !config.phoneRequired,
    message: config.messageMinLength === 0,
    consent: false,
  };
  const listed = shown.filter((field) => errors[field]);

  function change(field: FieldName, value: string | boolean) {
    const next = { ...values, [field]: value };
    setValues(next);
    // Once a field is marked wrong, correcting it clears the message as you type.
    if (errors[field]) setErrors({ ...errors, [field]: validateField(field, next, config) || undefined });
  }

  function blur(field: FieldName) {
    if (config.validateOn !== "blur") return;
    const message = validateField(field, values, config);
    setErrors({ ...errors, [field]: message || undefined });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = validateAll(values, config);
    setErrors(next);
    const firstBad = shown.find((field) => next[field]);
    if (firstBad) {
      // Move to the summary when there is one, otherwise straight to the first problem.
      requestAnimationFrame(() =>
        config.errorSummary ? summaryRef.current?.focus() : document.getElementById(`${id}-${firstBad}`)?.focus(),
      );
      return;
    }
    onSubmit?.(values);
    setValues(emptyValues);
    setSent(true);
    requestAnimationFrame(() => successRef.current?.focus());
  }

  const fieldClass = (field: FieldName) =>
    `mt-1.5 block w-full rounded-(--fm-radius) border bg-(--fm-surface) px-3 py-2.5 text-(--fm-text) outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--fm-ring) ${errors[field] ? "border-2 border-(--fm-error)" : "border-(--fm-border)"}`;

  return (
    <div style={style} className="text-(--fm-text)">
      <form noValidate onSubmit={submit} className="w-full max-w-2xl">
        <h2 className="text-2xl font-bold">{config.title}</h2>

        {sent && (
          <p
            ref={successRef}
            tabIndex={-1}
            role="status"
            className="mt-4 rounded-(--fm-radius) border border-(--fm-success) bg-(--fm-success-bg) px-4 py-3 font-medium text-(--fm-success) outline-none"
          >
            {config.successMessage}
          </p>
        )}

        {config.errorSummary && listed.length > 0 && (
          <div
            ref={summaryRef}
            tabIndex={-1}
            role="alert"
            aria-labelledby={`${id}-summary-title`}
            className="mt-4 rounded-(--fm-radius) border-2 border-(--fm-error) bg-(--fm-error-bg) p-4 outline-none"
          >
            <h3 id={`${id}-summary-title`} className="font-bold text-(--fm-error)">
              There is a problem
            </h3>
            <ul className="mt-2 space-y-1">
              {listed.map((field) => (
                <li key={field}>
                  <a
                    href={`#${id}-${field}`}
                    className="inline-block min-h-6 py-0.5 font-medium text-(--fm-error) underline"
                  >
                    {errors[field]}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className={`mt-6 grid gap-5 ${config.layout === "two" ? "sm:grid-cols-2" : ""}`}>
          {shown
            .filter((field) => field !== "consent")
            .map((field) => {
              const isMessage = field === "message";
              const describedBy = errors[field] ? `${id}-${field}-error` : undefined;
              return (
                <div key={field} className={isMessage && config.layout === "two" ? "sm:col-span-2" : ""}>
                  <label htmlFor={`${id}-${field}`} className="font-medium">
                    {labels[field]}
                    {config.optionalMarker && optional[field] && (
                      <span className="font-normal text-(--fm-muted)"> (optional)</span>
                    )}
                  </label>
                  {errors[field] && (
                    <p id={`${id}-${field}-error`} className="mt-1 font-medium text-(--fm-error)">
                      <span className="sr-only">Error: </span>
                      {errors[field]}
                    </p>
                  )}
                  {isMessage ? (
                    <textarea
                      id={`${id}-${field}`}
                      name={field}
                      rows={5}
                      value={values.message}
                      aria-invalid={errors[field] ? true : undefined}
                      aria-describedby={describedBy}
                      onChange={(event) => change(field, event.target.value)}
                      onBlur={() => blur(field)}
                      className={`${fieldClass(field)} resize-y`}
                    />
                  ) : (
                    <input
                      id={`${id}-${field}`}
                      name={field}
                      type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
                      autoComplete={field === "email" ? "email" : field === "phone" ? "tel" : "name"}
                      value={String(values[field])}
                      aria-invalid={errors[field] ? true : undefined}
                      aria-describedby={describedBy}
                      onChange={(event) => change(field, event.target.value)}
                      onBlur={() => blur(field)}
                      className={fieldClass(field)}
                    />
                  )}
                </div>
              );
            })}
        </div>

        {config.consentField && (
          <div className="mt-5">
            {errors.consent && (
              <p id={`${id}-consent-error`} className="mb-1 font-medium text-(--fm-error)">
                <span className="sr-only">Error: </span>
                {errors.consent}
              </p>
            )}
            <label className="flex items-start gap-3">
              <input
                id={`${id}-consent`}
                name="consent"
                type="checkbox"
                checked={values.consent}
                aria-invalid={errors.consent ? true : undefined}
                aria-describedby={errors.consent ? `${id}-consent-error` : undefined}
                onChange={(event) => change("consent", event.target.checked)}
                onBlur={() => blur("consent")}
                className="mt-1 size-5 shrink-0 accent-(--fm-accent)"
              />
              {config.consentLabel}
            </label>
          </div>
        )}

        <button
          type="submit"
          className="mt-7 min-h-11 cursor-pointer rounded-(--fm-radius) bg-(--fm-accent) px-5 font-semibold text-(--fm-on-accent) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--fm-ring)"
        >
          {config.submitText}
        </button>
      </form>
    </div>
  );
}
