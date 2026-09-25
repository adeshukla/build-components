"use client";

import { useId, useState, useSyncExternalStore, type CSSProperties } from "react";

export type PricingTableConfig = {
  heading: string;
  plans: { name: string; monthly: string; yearly: string; blurb: string; features: string }[];
  featured: string;
  currency: string;
  showCycle: boolean;
  monthlyLabel: string;
  yearlyLabel: string;
  yearlyNote: string;
  chooseText: string;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: PricingTableConfig = {
  heading: "Plans",
  plans: [
    {
      name: "Solo",
      monthly: "9",
      yearly: "90",
      blurb: "For one person and one project.",
      features: "1 project; 5 GB of files; Email support",
    },
    {
      name: "Crew",
      monthly: "29",
      yearly: "290",
      blurb: "For a small team that ships together.",
      features: "10 projects; 100 GB of files; Shared boards; Email support",
    },
    {
      name: "Fleet",
      monthly: "79",
      yearly: "790",
      blurb: "For several teams under one roof.",
      features: "Unlimited projects; 1 TB of files; Shared boards; Single sign-on; Priority support",
    },
  ],
  featured: "Crew",
  currency: "£",
  showCycle: true,
  monthlyLabel: "Monthly",
  yearlyLabel: "Yearly",
  yearlyNote: "Two months off when you pay for a year.",
  chooseText: "Choose",
  theme: "light",
  accentColor: "#0f766e",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
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

/** "1 project; 5 GB" becomes two lines. Semicolons keep commas usable inside a feature. */
const featureList = (value: string) =>
  value
    .split(";")
    .map((feature) => feature.trim())
    .filter((feature) => feature !== "");

export function PricingTable({ config = defaultConfig }: { config?: PricingTableConfig }) {
  const id = useId();
  const [yearly, setYearly] = useState(false);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--pt-accent": config.accentColor,
    "--pt-accent-text": readableAccent(config.accentColor, dark),
    "--pt-on-accent": luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff",
    "--pt-surface": palette.surface,
    "--pt-sunk": palette.sunk,
    "--pt-text": palette.text,
    "--pt-muted": palette.muted,
    "--pt-line": palette.line,
  } as CSSProperties;

  const plans = config.plans.filter((plan) => plan.name.trim() !== "");
  const period = yearly ? "a year" : "a month";

  return (
    <div style={style} className="bg-(--pt-surface) text-(--pt-text)">
      <h2 className="text-xl font-semibold">{config.heading}</h2>

      {config.showCycle && (
        // Real radios in a group: the cycle is a choice between two, not a switch with a hidden meaning.
        <fieldset className="mt-3 border-0 p-0">
          <legend className="text-sm text-(--pt-muted)">Billing</legend>
          <div className="mt-1 inline-flex rounded-full border border-(--pt-line) p-1">
            {[
              { label: config.monthlyLabel, value: false },
              { label: config.yearlyLabel, value: true },
            ].map((option) => (
              <label
                key={option.label}
                className={`inline-flex min-h-11 cursor-pointer items-center rounded-full px-4 text-sm has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-(--pt-accent-text) ${
                  yearly === option.value ? "bg-(--pt-accent) font-medium text-(--pt-on-accent)" : "text-(--pt-text)"
                }`}
              >
                <input
                  type="radio"
                  name={`${id}-cycle`}
                  checked={yearly === option.value}
                  onChange={() => setYearly(option.value)}
                  className="sr-only"
                />
                {option.label}
              </label>
            ))}
          </div>
          {yearly && config.yearlyNote.trim() !== "" && <p className="mt-2 text-sm text-(--pt-muted)">{config.yearlyNote}</p>}
        </fieldset>
      )}

      <ul className="mt-4 grid list-none gap-4 p-0 sm:grid-cols-3">
        {plans.map((plan) => {
          const featured = plan.name === config.featured;
          return (
            <li
              key={plan.name}
              className={`flex flex-col rounded-xl border p-4 ${featured ? "border-(--pt-accent) bg-(--pt-sunk)" : "border-(--pt-line)"}`}
            >
              <h3 className="flex items-baseline gap-2 text-lg font-semibold">
                {plan.name}
                {/* Said in words, not only shown in a colour. */}
                {featured && (
                  <span className="rounded-full bg-(--pt-accent) px-2 py-0.5 text-xs font-medium text-(--pt-on-accent)">Most picked</span>
                )}
              </h3>
              <p className="mt-1 text-sm text-(--pt-muted)">{plan.blurb}</p>
              <p className="mt-3 text-2xl font-semibold">
                <span>{`${config.currency}${yearly ? plan.yearly : plan.monthly}`}</span>
                <span className="ml-1 text-sm font-normal text-(--pt-muted)">{period}</span>
              </p>
              <ul className="mt-3 grid list-none gap-1 p-0 text-sm">
                {featureList(plan.features).map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span aria-hidden="true" className="text-(--pt-accent-text)">
                      ✓
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className={`mt-4 min-h-11 cursor-pointer rounded-md px-4 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--pt-accent-text) ${
                  featured ? "bg-(--pt-accent) text-(--pt-on-accent)" : "border border-(--pt-line)"
                }`}
              >
                {`${config.chooseText} ${plan.name}`}
              </button>
            </li>
          );
        })}
      </ul>

      {/* Every price on the page just changed: say it once rather than leaving it to be noticed. */}
      <p role="status" className="mt-3 text-sm text-(--pt-muted)">
        {yearly ? `Showing ${config.yearlyLabel.toLowerCase()} prices` : `Showing ${config.monthlyLabel.toLowerCase()} prices`}
      </p>
    </div>
  );
}
