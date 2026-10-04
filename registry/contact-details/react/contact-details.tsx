"use client";

import { useId, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";

export type ContactDetailsConfig = {
  heading: string;
  headingLevel: "h2" | "h3";
  intro: string;
  email: string;
  phone: string;
  address: string;
  hours: string;
  mapText: string;
  mapHref: string;
  theme: "light" | "dark" | "system";
  accentColor: string;
  emailTerm: string;
  phoneTerm: string;
  addressTerm: string;
  hoursTerm: string;
};

// @config-start
const defaultConfig: ContactDetailsConfig = {
  heading: "Get in touch",
  headingLevel: "h2",
  intro: "Write, call or come by. We answer every message within two working days.",
  email: "hello@example.com",
  phone: "+1 555 0100",
  address: "[TODO: street and number]\n[TODO: town and postcode]",
  hours: "Monday to Friday, 9:00 to 17:00",
  mapText: "Open in a map",
  mapHref: "",
  theme: "light",
  accentColor: "#2563eb",
  emailTerm: "Email",
  phoneTerm: "Phone",
  addressTerm: "Address",
  hoursTerm: "Opening hours",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", muted: "#4d4a57", line: "#d9d5e4" },
  dark: { surface: "#141019", text: "#f6f5fa", muted: "#b6b3c2", line: "#3a3448" },
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

/** Relative, fragment, http(s), mailto and tel links only. */
function safeHref(value: string) {
  return /^(\/|#|https?:\/\/|mailto:|tel:)/i.test(value.trim()) ? value.trim() : "#";
}

/** A phone number as a tel: link: the digits, and a leading + if there is one. */
export const telOf = (phone: string) => `tel:${phone.trim().startsWith("+") ? "+" : ""}${phone.replace(/\D/g, "")}`;

export function ContactDetails({ config = defaultConfig }: { config?: ContactDetailsConfig }) {
  const id = useId();
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const Heading = config.headingLevel;
  const style = {
    "--cd-accent-text": readableAccent(config.accentColor, dark),
    "--cd-surface": `var(--bc-${dark ? "dark" : "light"}-surface, ${palette.surface})`,
    "--cd-text": `var(--bc-${dark ? "dark" : "light"}-text, ${palette.text})`,
    "--cd-muted": `var(--bc-${dark ? "dark" : "light"}-muted, ${palette.muted})`,
    "--cd-line": `var(--bc-${dark ? "dark" : "light"}-line, ${palette.line})`,
  } as CSSProperties;
  const link =
    "font-medium text-(--cd-accent-text) underline underline-offset-4 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--cd-accent-text)";
  const rows = [
    config.email.trim() && { term: config.emailTerm, detail: <a href={`mailto:${config.email.trim()}`} className={link}>{config.email}</a> },
    config.phone.trim() && { term: config.phoneTerm, detail: <a href={telOf(config.phone)} className={link}>{config.phone}</a> },
    config.address.trim() && { term: config.addressTerm, detail: <span className="whitespace-pre-line">{config.address}</span> },
    config.hours.trim() && { term: config.hoursTerm, detail: config.hours },
  ].filter(Boolean) as { term: string; detail: ReactNode }[];

  return (
    <section aria-labelledby={`${id}-heading`} style={style} className="bg-(--cd-surface) text-(--cd-text)">
      <Heading id={`${id}-heading`} className="text-3xl font-bold tracking-tight text-balance">
        {config.heading}
      </Heading>
      {config.intro.trim() !== "" && <p className="mt-3 max-w-2xl text-lg text-(--cd-muted)">{config.intro}</p>}
      <address className="mt-6 not-italic">
        <dl className="m-0 grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.term} className="min-w-0 border-t border-(--cd-line) pt-4">
              <dt className="text-sm font-semibold text-(--cd-muted)">{row.term}</dt>
              <dd className="m-0 mt-1 text-lg break-words">{row.detail}</dd>
            </div>
          ))}
        </dl>
        {config.mapHref.trim() !== "" && config.mapText.trim() !== "" && (
          <p className="mt-6">
            <a href={safeHref(config.mapHref)} className={link}>
              {config.mapText}
            </a>
          </p>
        )}
      </address>
    </section>
  );
}
