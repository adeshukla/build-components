"use client";

import { useSyncExternalStore, type CSSProperties } from "react";

export type ComparisonTableConfig = {
  caption: string;
  plans: { name: string; note: string }[];
  rows: { feature: string; a: string; b: string; c: string }[];
  highlight: string;
  yesText: string;
  noText: string;
  theme: "light" | "dark" | "system";
  accentColor: string;
  featureHeader: string;
  featuredText: string;
};

// @config-start
const defaultConfig: ComparisonTableConfig = {
  caption: "What each plan includes",
  plans: [
    { name: "Solo", note: "One person" },
    { name: "Crew", note: "Up to ten" },
    { name: "Fleet", note: "Whole company" },
  ],
  rows: [
    { feature: "Projects", a: "1", b: "10", c: "Unlimited" },
    { feature: "File storage", a: "5 GB", b: "100 GB", c: "1 TB" },
    { feature: "Shared boards", a: "no", b: "yes", c: "yes" },
    { feature: "Single sign-on", a: "no", b: "no", c: "yes" },
    { feature: "Audit log", a: "no", b: "no", c: "yes" },
    { feature: "Email support", a: "yes", b: "yes", c: "yes" },
    { feature: "Priority support", a: "no", b: "no", c: "yes" },
  ],
  highlight: "Crew",
  yesText: "Yes",
  noText: "No",
  theme: "light",
  accentColor: "#0f766e",
  featureHeader: "Feature",
  featuredText: "Most picked",
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

export function ComparisonTable({ config = defaultConfig }: { config?: ComparisonTableConfig }) {
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--cp-accent": config.accentColor,
    "--cp-accent-text": readableAccent(config.accentColor, dark),
    "--cp-surface": `var(--bc-${dark ? "dark" : "light"}-surface, ${palette.surface})`,
    "--cp-sunk": `var(--bc-${dark ? "dark" : "light"}-sunk, ${palette.sunk})`,
    "--cp-text": `var(--bc-${dark ? "dark" : "light"}-text, ${palette.text})`,
    "--cp-muted": `var(--bc-${dark ? "dark" : "light"}-muted, ${palette.muted})`,
    "--cp-line": `var(--bc-${dark ? "dark" : "light"}-line, ${palette.line})`,
  } as CSSProperties;

  const plans = config.plans.filter((plan) => plan.name.trim() !== "").slice(0, 3);
  const rows = config.rows.filter((row) => row.feature.trim() !== "");

  /** "yes" and "no" become words, so the table reads the same out loud as it looks. */
  function cell(value: string) {
    const said = value.trim().toLowerCase();
    if (said === "yes") return { text: config.yesText, mark: "✓", tone: "yes" as const };
    if (said === "no") return { text: config.noText, mark: "✕", tone: "no" as const };
    return { text: value, mark: "", tone: "text" as const };
  }

  return (
    <div style={style} className="bg-(--cp-surface) text-(--cp-text)">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <caption className="pb-3 text-start font-medium">{config.caption}</caption>
          <thead>
            <tr>
              <th scope="col" className="w-2/5 border-b border-(--cp-line) p-3 text-start align-bottom">
                {config.featureHeader}
              </th>
              {plans.map((plan) => {
                const featured = plan.name === config.highlight;
                return (
                  <th
                    key={plan.name}
                    scope="col"
                    className={`border-b border-(--cp-line) p-3 text-start align-bottom ${featured ? "bg-(--cp-sunk)" : ""}`}
                  >
                    <span className="block font-semibold">{plan.name}</span>
                    {plan.note.trim() !== "" && <span className="block text-xs font-normal text-(--cp-muted)">{plan.note}</span>}
                    {/* The highlight is said in words as well as painted. */}
                    {featured && <span className="block text-xs font-medium text-(--cp-accent-text)">{config.featuredText}</span>}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.feature} className="border-b border-(--cp-line) last:border-0">
                <th scope="row" className="p-3 text-start font-medium">
                  {row.feature}
                </th>
                {[row.a, row.b, row.c].slice(0, plans.length).map((value, index) => {
                  const shown = cell(value);
                  const featured = plans[index].name === config.highlight;
                  return (
                    <td key={plans[index].name} className={`p-3 ${featured ? "bg-(--cp-sunk)" : ""}`}>
                      {shown.mark !== "" && (
                        <span aria-hidden="true" className={`me-1 ${shown.tone === "yes" ? "text-(--cp-accent-text)" : "text-(--cp-muted)"}`}>
                          {shown.mark}
                        </span>
                      )}
                      <span className={shown.tone === "no" ? "text-(--cp-muted)" : ""}>{shown.text}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
