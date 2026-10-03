"use client";

import { useId, useState, useSyncExternalStore, type CSSProperties } from "react";

export type AddressFieldsConfig = {
  legend: string;
  hint: string;
  name: string;
  countries: { code: string; name: string; postcodeLabel: string; regionLabel: string }[];
  countryLabel: string;
  line1Label: string;
  line2Label: string;
  cityLabel: string;
  showLine2: boolean;
  countryFirst: boolean;
  requireCore: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: AddressFieldsConfig = {
  legend: "Delivery address",
  hint: "Your browser can fill this in for you.",
  name: "address",
  countries: [
    { code: "GB", name: "United Kingdom", postcodeLabel: "Postcode", regionLabel: "County" },
    { code: "IE", name: "Ireland", postcodeLabel: "Eircode", regionLabel: "County" },
    { code: "US", name: "United States", postcodeLabel: "ZIP code", regionLabel: "State" },
    { code: "DE", name: "Germany", postcodeLabel: "Postal code", regionLabel: "" },
  ],
  countryLabel: "Country",
  line1Label: "Address line 1",
  line2Label: "Address line 2",
  cityLabel: "Town or city",
  showLine2: true,
  countryFirst: true,
  requireCore: true,
  theme: "light",
  accentColor: "#1d4ed8",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
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

export function AddressFields({ config = defaultConfig }: { config?: AddressFieldsConfig }) {
  const id = useId();
  const [code, setCode] = useState(config.countries[0]?.code ?? "");
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--af-accent": config.accentColor,
    "--af-accent-text": readableAccent(config.accentColor, dark),
    "--af-surface": `var(--bc-${dark ? "dark" : "light"}-surface, ${palette.surface})`,
    "--af-sunk": `var(--bc-${dark ? "dark" : "light"}-sunk, ${palette.sunk})`,
    "--af-text": `var(--bc-${dark ? "dark" : "light"}-text, ${palette.text})`,
    "--af-muted": `var(--bc-${dark ? "dark" : "light"}-muted, ${palette.muted})`,
    "--af-line": `var(--bc-${dark ? "dark" : "light"}-line, ${palette.line})`,
  } as CSSProperties;

  const country = config.countries.find((item) => item.code === code) ?? config.countries[0];
  const field =
    "mt-2 min-h-11 w-full rounded-[var(--bc-radius-sm,0.375rem)] border border-(--af-line) bg-(--af-sunk) px-3 text-(--af-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--af-accent-text)";
  const labelClass = "block text-sm font-medium";

  // Every field carries the autocomplete token for its own purpose, which is what lets a browser or a
  // password manager fill the block in one go (WCAG 1.3.5).
  const countryBlock = (
    <div>
      <label htmlFor={`${id}-country`} className={labelClass}>
        {config.countryLabel}
      </label>
      <select
        id={`${id}-country`}
        name={`${config.name}Country`}
        autoComplete="country"
        value={code}
        onChange={(event) => setCode(event.target.value)}
        className={field}
      >
        {config.countries.map((item) => (
          <option key={item.code} value={item.code}>
            {item.name}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div style={style} className="bg-(--af-surface) text-(--af-text)">
      <fieldset className="m-0 border-0 p-0">
        <legend className="p-0 font-medium">{config.legend}</legend>
        {config.hint.trim() !== "" && <p className="mt-1 text-sm text-(--af-muted)">{config.hint}</p>}

        <div className="mt-3 grid max-w-xl gap-4">
          {config.countryFirst && countryBlock}

          <div>
            <label htmlFor={`${id}-line1`} className={labelClass}>
              {config.line1Label}
            </label>
            <input
              id={`${id}-line1`}
              name={`${config.name}Line1`}
              type="text"
              autoComplete="address-line1"
              required={config.requireCore}
              className={field}
            />
          </div>

          {config.showLine2 && (
            <div>
              <label htmlFor={`${id}-line2`} className={labelClass}>
                {config.line2Label} <span className="font-normal text-(--af-muted)">(optional)</span>
              </label>
              <input id={`${id}-line2`} name={`${config.name}Line2`} type="text" autoComplete="address-line2" className={field} />
            </div>
          )}

          <div>
            <label htmlFor={`${id}-city`} className={labelClass}>
              {config.cityLabel}
            </label>
            <input
              id={`${id}-city`}
              name={`${config.name}City`}
              type="text"
              autoComplete="address-level2"
              required={config.requireCore}
              className={field}
            />
          </div>

          {/* A region field is not universal: it appears only for the countries that have one. */}
          {country?.regionLabel.trim() !== "" && (
            <div>
              <label htmlFor={`${id}-region`} className={labelClass}>
                {country?.regionLabel}
              </label>
              <input id={`${id}-region`} name={`${config.name}Region`} type="text" autoComplete="address-level1" className={field} />
            </div>
          )}

          <div className="max-w-56">
            <label htmlFor={`${id}-postcode`} className={labelClass}>
              {country?.postcodeLabel}
            </label>
            <input
              id={`${id}-postcode`}
              name={`${config.name}Postcode`}
              type="text"
              autoComplete="postal-code"
              // A mixed postcode is letters as well as digits: a numeric keyboard would be wrong here.
              inputMode="text"
              required={config.requireCore}
              className={`${field} uppercase`}
            />
          </div>

          {!config.countryFirst && countryBlock}
        </div>

        <p role="status" className="mt-3 text-sm text-(--af-muted)">
          {country === undefined ? "" : `Addressed for ${country.name}. The postcode field is called ${country.postcodeLabel}.`}
        </p>
      </fieldset>
    </div>
  );
}
