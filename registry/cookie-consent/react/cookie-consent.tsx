"use client";

import { useEffect, useId, useRef, useSyncExternalStore, type CSSProperties, type KeyboardEvent } from "react";

export type CookieConsentConfig = {
  title: string;
  body: string;
  policyText: string;
  policyUrl: string;
  categories: { key: string; name: string; description: string }[];
  position: "bottom" | "corner";
  storageKey: string;
  showReopen: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

/** What is saved, and what the "cookie-consent" event carries: one true/false per category. */
export type ConsentChoice = { categories: Record<string, boolean>; savedAt: string };

// @config-start
const defaultConfig: CookieConsentConfig = {
  title: "Cookies on this site",
  body: "We use cookies the site needs to work. With your permission we'd also like to use cookies to see how the site is used and to improve it.",
  policyText: "Read the cookie policy",
  policyUrl: "/cookies",
  categories: [
    { key: "analytics", name: "Analytics", description: "Counts visits and shows which pages are used, so we can improve them." },
    { key: "marketing", name: "Marketing", description: "Remembers your visit so ads elsewhere can be more relevant." },
  ],
  position: "bottom",
  storageKey: "cookie-consent",
  showReopen: true,
  theme: "light",
  accentColor: "#2563eb",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", muted: "#4d4a57", border: "#737373", line: "#d9d5e4", hover: "#eeecf5" },
  dark: { surface: "#1c1826", text: "#f6f5fa", muted: "#b6b3c2", border: "#8e8a99", line: "#3a3448", hover: "#2a2438" },
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
  const surface = onDark ? 0.08 : 1;
  for (let step = 0; step <= 20; step++) {
    const shifted = channels.map((c) => Math.round(onDark ? c + (255 - c) * (step / 20) : c * (1 - step / 20)));
    const value = `#${shifted.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
    const l = luminance(value);
    const contrast = (Math.max(l, surface) + 0.05) / (Math.min(l, surface) + 0.05);
    if (contrast >= 4.5) return value;
  }
  return onDark ? "#ffffff" : "#000000";
}

const safeHref = (value: string) => (/^(\/|#|https?:\/\/|mailto:|tel:)/i.test(value.trim()) ? value.trim() : "#");

// The saved choice is read with useSyncExternalStore, so the server renders nothing and the browser
// decides; saving fires an event so every copy on the page updates. Storage can be blocked (private
// windows, sandboxed frames), so reads and writes fall back to memory.
const CHANGE = "cookie-consent";
let memory: Record<string, string> = {};
function readStored(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return memory[key] ?? null;
  }
}
function writeStored(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    memory = { ...memory, [key]: value };
  }
}
function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE, onChange);
  };
}

export function CookieConsent({
  config = defaultConfig,
  onChange,
}: {
  config?: CookieConsentConfig;
  /** Called after every saved choice. Load optional scripts only once their category is true. */
  onChange?: (choice: ConsentChoice) => void;
}) {
  const id = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const reopenRef = useRef<HTMLButtonElement>(null);
  const focusReopen = useRef(false);
  const stored = useSyncExternalStore(subscribe, () => readStored(config.storageKey), () => undefined);
  const categories = config.categories.filter((category) => category.key.trim() && category.name.trim());

  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const accentLuminance = luminance(config.accentColor);
  const style = {
    "--cc-accent": config.accentColor,
    "--cc-accent-text": readableAccent(config.accentColor, dark),
    "--cc-on-accent": accentLuminance > 0.179 ? "#000000" : "#ffffff",
    "--cc-surface": palette.surface,
    "--cc-text": palette.text,
    "--cc-muted": palette.muted,
    "--cc-border": palette.border,
    "--cc-line": palette.line,
    "--cc-hover": palette.hover,
  } as CSSProperties;

  let saved: ConsentChoice | null = null;
  try {
    saved = stored ? (JSON.parse(stored) as ConsentChoice) : null;
  } catch {
    saved = null;
  }

  // The banner disappears when a choice is saved; put focus somewhere sensible instead of losing it.
  useEffect(() => {
    if (!focusReopen.current || !saved) return;
    focusReopen.current = false;
    reopenRef.current?.focus();
  });

  if (stored === undefined) return null;

  function save(choices: Record<string, boolean>) {
    const choice: ConsentChoice = { categories: choices, savedAt: new Date().toISOString() };
    focusReopen.current = true;
    writeStored(config.storageKey, JSON.stringify(choice));
    window.dispatchEvent(new CustomEvent(CHANGE, { detail: choice }));
    onChange?.(choice);
  }

  const every = (value: boolean) => Object.fromEntries(categories.map((category) => [category.key, value]));

  function openPreferences() {
    // Start from what is saved, not from boxes ticked and then cancelled last time.
    dialogRef.current?.querySelector("form")?.reset();
    dialogRef.current?.showModal();
    titleRef.current?.focus();
  }

  function onDialogKey(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const items = [...event.currentTarget.querySelectorAll<HTMLElement>("button, a[href], input:not(:disabled)")];
    const index = items.indexOf(document.activeElement as HTMLElement);
    if (event.shiftKey && index <= 0) {
      event.preventDefault();
      items[items.length - 1]?.focus();
    } else if (!event.shiftKey && index === items.length - 1) {
      event.preventDefault();
      items[0]?.focus();
    }
  }

  const button = "min-h-10 cursor-pointer rounded-lg px-4 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--cc-accent-text)";
  // Accept and reject look the same on purpose: refusing must be as easy as agreeing.
  const choiceButton = `${button} bg-(--cc-accent) text-(--cc-on-accent)`;
  const quietButton = `${button} border border-(--cc-border) bg-transparent text-(--cc-text) hover:bg-(--cc-hover)`;

  return (
    <div style={style} className="text-(--cc-text)">
      {!saved && (
        <section
          aria-labelledby={`${id}-banner-title`}
          className={`fixed z-40 border border-(--cc-line) bg-(--cc-surface) p-5 shadow-2xl ${config.position === "corner" ? "right-4 bottom-4 left-4 max-w-md rounded-xl sm:left-auto" : "inset-x-0 bottom-0 border-x-0 border-b-0"}`}
        >
          <div className={config.position === "bottom" ? "mx-auto flex max-w-5xl flex-col gap-4 lg:flex-row lg:items-end lg:justify-between" : "flex flex-col gap-4"}>
            <div className="max-w-2xl">
              <h2 id={`${id}-banner-title`} className="text-lg font-semibold">
                {config.title}
              </h2>
              <p className="mt-1 text-sm text-(--cc-muted)">
                {config.body}{" "}
                {config.policyText.trim() !== "" && (
                  <a href={safeHref(config.policyUrl)} className="inline-block py-1 font-medium text-(--cc-accent-text) underline underline-offset-2">
                    {config.policyText}
                  </a>
                )}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button type="button" onClick={() => save(every(true))} className={choiceButton}>
                Accept all
              </button>
              <button type="button" onClick={() => save(every(false))} className={choiceButton}>
                Reject all
              </button>
              {categories.length > 0 && (
                <button type="button" aria-haspopup="dialog" onClick={openPreferences} className={quietButton}>
                  Choose cookies
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {saved && config.showReopen && (
        <button ref={reopenRef} type="button" aria-haspopup="dialog" onClick={openPreferences} className={quietButton}>
          Cookie settings
        </button>
      )}

      <dialog
        ref={dialogRef}
        aria-labelledby={`${id}-title`}
        onKeyDown={onDialogKey}
        onClose={() => {
          if (!focusReopen.current) reopenRef.current?.focus();
        }}
        className="m-auto max-h-[calc(100%-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-auto rounded-xl border-0 bg-(--cc-surface) p-0 text-(--cc-text) shadow-2xl backdrop:bg-black/50"
      >
        <form
          method="dialog"
          onSubmit={(event) => {
            const data = new FormData(event.currentTarget);
            save(Object.fromEntries(categories.map((category) => [category.key, data.has(category.key)])));
          }}
          className="p-6"
        >
          <h2 ref={titleRef} id={`${id}-title`} tabIndex={-1} className="text-lg font-semibold outline-none">
            Cookie preferences
          </h2>
          <p className="mt-1 text-sm text-(--cc-muted)">Choose which cookies you allow. You can change this at any time.</p>
          <ul className="mt-4 divide-y divide-(--cc-line) border-y border-(--cc-line)">
            <li>
              <label className="flex items-start gap-3 py-3">
                <input type="checkbox" checked readOnly disabled aria-describedby={`${id}-necessary-note`} className="mt-1 size-5 shrink-0 accent-(--cc-accent)" />
                <span>
                  <span className="block font-medium">Necessary</span>
                  <span id={`${id}-necessary-note`} className="block text-sm text-(--cc-muted)">
                    Needed for the site to work, such as remembering this choice. Always on.
                  </span>
                </span>
              </label>
            </li>
            {categories.map((category) => (
              <li key={category.key}>
                <label className="flex cursor-pointer items-start gap-3 py-3">
                  <input
                    type="checkbox"
                    name={category.key}
                    defaultChecked={saved?.categories[category.key] === true}
                    aria-describedby={`${id}-${category.key}-note`}
                    className="mt-1 size-5 shrink-0 accent-(--cc-accent) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--cc-accent-text)"
                  />
                  <span>
                    <span className="block font-medium">{category.name}</span>
                    <span id={`${id}-${category.key}-note`} className="block text-sm text-(--cc-muted)">
                      {category.description}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => dialogRef.current?.close()} className={quietButton}>
              Cancel
            </button>
            <button type="submit" className={choiceButton}>
              Save choices
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
