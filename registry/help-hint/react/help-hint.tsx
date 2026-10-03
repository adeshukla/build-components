"use client";

import { useId, useState, useSyncExternalStore, type CSSProperties } from "react";

export type HelpHintConfig = {
  label: string;
  shortHint: string;
  helpTitle: string;
  helpText: string;
  exampleText: string;
  buttonLabel: string;
  placeholder: string;
  name: string;
  startOpen: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: HelpHintConfig = {
  label: "National Insurance number",
  shortHint: "It is on your payslip, P60 or letters about tax.",
  helpTitle: "Where to find it",
  helpText: "Two letters, six digits and one more letter. It is printed on your payslip, on a P60, and on letters from HMRC about tax, pensions or benefits.",
  exampleText: "For example, QQ 12 34 56 C",
  buttonLabel: "Help with this answer",
  placeholder: "",
  name: "nino",
  startOpen: false,
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

export function HelpHint({ config = defaultConfig }: { config?: HelpHintConfig }) {
  const id = useId();
  const [open, setOpen] = useState(config.startOpen);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--hlp-accent": config.accentColor,
    "--hlp-accent-text": readableAccent(config.accentColor, dark),
    "--hlp-surface": `var(--bc-${dark ? "dark" : "light"}-surface, ${palette.surface})`,
    "--hlp-sunk": `var(--bc-${dark ? "dark" : "light"}-sunk, ${palette.sunk})`,
    "--hlp-text": `var(--bc-${dark ? "dark" : "light"}-text, ${palette.text})`,
    "--hlp-muted": `var(--bc-${dark ? "dark" : "light"}-muted, ${palette.muted})`,
    "--hlp-line": `var(--bc-${dark ? "dark" : "light"}-line, ${palette.line})`,
  } as CSSProperties;

  // The help joins the field's description while it is open, so it is read as part of the question
  // rather than as loose text somewhere on the page.
  const described = [`${id}-hint`, config.exampleText.trim() === "" ? "" : `${id}-example`, open ? `${id}-help` : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div style={style} className="bg-(--hlp-surface) p-1 text-(--hlp-text)">
      <label htmlFor={`${id}-field`} className="block font-medium">
        {config.label}
      </label>

      <p id={`${id}-hint`} className="mt-1 text-sm text-(--hlp-muted)">
        {config.shortHint}
      </p>

      {/*
        A disclosure, not a tooltip. Help that has to be hovered cannot be read twice, cannot be copied
        from, and vanishes the moment the pointer moves — and on a touch screen it barely exists.
      */}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`${id}-help`}
        onClick={() => setOpen(!open)}
        className="mt-1 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-(--hlp-accent-text) underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--hlp-accent-text)"
      >
        <span
          aria-hidden="true"
          className="grid size-5 place-items-center rounded-full border border-current text-xs font-bold"
        >
          ?
        </span>
        {config.buttonLabel}
      </button>

      <div
        id={`${id}-help`}
        data-help
        hidden={!open}
        className="mt-2 border-l-4 border-(--hlp-accent) bg-(--hlp-sunk) px-3 py-2"
      >
        <p className="font-medium">{config.helpTitle}</p>
        <p className="mt-1 text-sm text-(--hlp-muted)">{config.helpText}</p>
      </div>

      {config.exampleText.trim() !== "" && (
        <p id={`${id}-example`} className="mt-2 font-mono text-xs text-(--hlp-muted)">
          {config.exampleText}
        </p>
      )}

      <input
        id={`${id}-field`}
        name={config.name}
        type="text"
        placeholder={config.placeholder === "" ? undefined : config.placeholder}
        aria-describedby={described}
        className="mt-2 min-h-11 w-full max-w-72 rounded-[var(--bc-radius-sm,0.375rem)] border border-(--hlp-line) bg-(--hlp-sunk) px-3 text-(--hlp-text) uppercase focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--hlp-accent-text)"
      />
    </div>
  );
}
