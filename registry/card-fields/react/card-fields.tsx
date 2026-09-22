"use client";

import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
  type CSSProperties,
  type FormEvent,
} from "react";

export type CardFieldsConfig = {
  title: string;
  amount: string;
  buttonText: string;
  showName: boolean;
  showPostcode: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: CardFieldsConfig = {
  title: "Payment details",
  amount: "£49.00",
  buttonText: "Pay",
  showName: true,
  showPostcode: true,
  theme: "light",
  accentColor: "#2563eb",
};
// @config-end

type Field = "name" | "number" | "expiry" | "cvc" | "postcode";

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", muted: "#4d4a57", border: "#737373", error: "#b3261e", success: "#146c2e" },
  dark: { surface: "#141019", text: "#f6f5fa", muted: "#b6b3c2", border: "#8e8a99", error: "#ff6b6b", success: "#6fdc8c" },
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

/** The card type from its first digits. Named in words: no logos, no trademarks to license. */
function brandOf(digits: string) {
  if (/^3[47]/.test(digits)) return "American Express";
  if (/^4/.test(digits)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "Mastercard";
  return "";
}

/** Amex groups 4-6-5 and has 15 digits; the rest group in fours, up to 19. */
function formatNumber(digits: string) {
  if (brandOf(digits) === "American Express") {
    return [digits.slice(0, 4), digits.slice(4, 10), digits.slice(10, 15)].filter(Boolean).join(" ");
  }
  return (digits.slice(0, 19).match(/.{1,4}/g) ?? []).join(" ");
}

/** The Luhn checksum every card number carries, so most typos are caught before submitting. */
function luhn(digits: string) {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let digit = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) digit = digit * 2 > 9 ? digit * 2 - 9 : digit * 2;
    sum += digit;
  }
  return digits.length > 0 && sum % 10 === 0;
}

function formatExpiry(digits: string) {
  const clean = digits.slice(0, 4);
  return clean.length > 2 ? `${clean.slice(0, 2)}/${clean.slice(2)}` : clean;
}

/** Checked on leaving a field and on submit, never on every key press. `now` is passed in. */
function problem(field: Field, value: string, now: Date) {
  const digits = value.replace(/\D/g, "");
  if (field === "name") return value.trim() ? "" : "Enter the name on the card.";
  if (field === "postcode") return value.trim() ? "" : "Enter the postcode.";
  if (field === "number") {
    if (!digits) return "Enter the card number.";
    const length = brandOf(digits) === "American Express" ? [15] : [13, 16, 19];
    return length.includes(digits.length) && luhn(digits) ? "" : "Enter a valid card number. Check for a typo.";
  }
  if (field === "expiry") {
    if (!digits) return "Enter the expiry date.";
    const month = Number(digits.slice(0, 2));
    if (digits.length !== 4 || month < 1 || month > 12) return "Enter the expiry date as MM/YY, for example 04/29.";
    const year = 2000 + Number(digits.slice(2));
    // A card works until the end of its expiry month.
    return new Date(year, month, 1) <= now ? "This card has expired." : "";
  }
  return "";
}

export function CardFields({ config = defaultConfig }: { config?: CardFieldsConfig }) {
  const id = useId();
  const [values, setValues] = useState<Record<Field, string>>({ name: "", number: "", expiry: "", cvc: "", postcode: "" });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [done, setDone] = useState(false);
  const refs = useRef<Partial<Record<Field, HTMLInputElement | null>>>({});
  // Reformatting moves the caret to the end; this puts it back after the same number of digits.
  const caret = useRef<{ field: Field; digitsBefore: number } | null>(null);

  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const accentLuminance = luminance(config.accentColor);
  const style = {
    "--cf-accent": config.accentColor,
    "--cf-accent-text": readableAccent(config.accentColor, dark),
    "--cf-on-accent": accentLuminance > 0.179 ? "#000000" : "#ffffff",
    "--cf-surface": palette.surface,
    "--cf-text": palette.text,
    "--cf-muted": palette.muted,
    "--cf-border": palette.border,
    "--cf-error": palette.error,
    "--cf-success": palette.success,
  } as CSSProperties;

  const digits = values.number.replace(/\D/g, "");
  const brand = brandOf(digits);
  const cvcLength = brand === "American Express" ? 4 : 3;
  const fields: Field[] = [...(config.showName ? (["name"] as const) : []), "number", "expiry", "cvc", ...(config.showPostcode ? (["postcode"] as const) : [])];

  useLayoutEffect(() => {
    const pending = caret.current;
    if (!pending) return;
    caret.current = null;
    const input = refs.current[pending.field];
    if (!input) return;
    let position = 0;
    for (let seen = 0; position < input.value.length && seen < pending.digitsBefore; position++) {
      if (/\d/.test(input.value[position])) seen++;
    }
    input.setSelectionRange(position, position);
  }, [values]);

  function onFormatted(field: "number" | "expiry" | "cvc", event: ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const typed = input.value.replace(/\D/g, "");
    const digitsBefore = input.value.slice(0, input.selectionStart ?? input.value.length).replace(/\D/g, "").length;
    const next =
      field === "number" ? formatNumber(typed) : field === "expiry" ? formatExpiry(typed) : typed.slice(0, cvcLength);
    caret.current = { field, digitsBefore };
    update(field, next);
  }

  function check(field: Field, value = values[field]) {
    const message =
      field === "cvc"
        ? value.length === cvcLength
          ? ""
          : `Enter the ${cvcLength}-digit security code.`
        : problem(field, value, new Date());
    setErrors((before) => ({ ...before, [field]: message }));
    return message;
  }

  /**
   * A field already showing an error is checked again as you type, so the message goes away while
   * you fix it. Waiting for blur would make the form jump just as you reach for the Pay button.
   */
  function update(field: Field, value: string) {
    setValues((before) => ({ ...before, [field]: value }));
    setDone(false);
    if (errors[field]) check(field, value);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const found = fields.filter((field) => check(field) !== "");
    if (found.length) {
      refs.current[found[0]]?.focus();
      setDone(false);
      return;
    }
    // Demo only: a real form hands the details to the payment provider here.
    setDone(true);
  }

  const labels: Record<Field, { label: string; hint?: string; autoComplete: string; inputMode?: "numeric" }> = {
    name: { label: "Name on card", autoComplete: "cc-name" },
    number: { label: "Card number", autoComplete: "cc-number", inputMode: "numeric" },
    expiry: { label: "Expiry date", hint: "MM/YY", autoComplete: "cc-exp", inputMode: "numeric" },
    cvc: {
      label: "Security code",
      hint: brand === "American Express" ? "4 digits on the front" : "3 digits on the back",
      autoComplete: "cc-csc",
      inputMode: "numeric",
    },
    postcode: { label: "Postcode", autoComplete: "postal-code" },
  };

  function input(field: Field) {
    const meta = labels[field];
    const error = errors[field];
    const describedBy = [meta.hint && `${id}-${field}-hint`, field === "number" && brand && `${id}-brand`, error && `${id}-${field}-error`]
      .filter(Boolean)
      .join(" ");
    return (
      <div key={field} className={field === "expiry" || field === "cvc" ? "" : "sm:col-span-2"}>
        <label htmlFor={`${id}-${field}`} className="block font-medium">
          {meta.label}
        </label>
        {meta.hint && (
          <p id={`${id}-${field}-hint`} className="text-sm text-(--cf-muted)">
            {meta.hint}
          </p>
        )}
        <div className="relative mt-1">
          <input
            ref={(element) => {
              refs.current[field] = element;
            }}
            id={`${id}-${field}`}
            name={field}
            type="text"
            autoComplete={meta.autoComplete}
            inputMode={meta.inputMode}
            spellCheck={false}
            value={values[field]}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy || undefined}
            onChange={(event) =>
              field === "number" || field === "expiry" || field === "cvc"
                ? onFormatted(field, event)
                : update(field, event.target.value)
            }
            onBlur={() => {
              if (values[field] !== "" || errors[field]) check(field);
            }}
            className={`h-11 w-full rounded-lg border bg-(--cf-surface) px-3 text-(--cf-text) tabular-nums outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--cf-accent-text) ${error ? "border-2 border-(--cf-error)" : "border-(--cf-border)"} ${field === "number" ? "pr-40" : ""}`}
          />
          {field === "number" && brand && (
            <span id={`${id}-brand`} className="absolute top-1/2 right-3 -translate-y-1/2 text-sm font-medium text-(--cf-muted)">
              {brand}
            </span>
          )}
        </div>
        {error && (
          <p id={`${id}-${field}-error`} className="mt-1 text-sm font-medium text-(--cf-error)">
            <span className="sr-only">Error: </span>
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <form noValidate onSubmit={onSubmit} style={style} className="max-w-md bg-(--cf-surface) text-(--cf-text)">
      <fieldset>
        <legend className="text-lg font-semibold">{config.title}</legend>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">{fields.map(input)}</div>
      </fieldset>
      <button
        type="submit"
        className="mt-6 min-h-11 w-full cursor-pointer rounded-lg bg-(--cf-accent) px-4 font-semibold text-(--cf-on-accent) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--cf-accent-text)"
      >
        {config.buttonText} {config.amount}
      </button>
      <p role="status" className="mt-3 text-sm font-medium text-(--cf-success) empty:hidden">
        {done ? "Card details look right. This demo sends nothing." : ""}
      </p>
    </form>
  );
}
