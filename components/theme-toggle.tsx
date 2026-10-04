"use client";

import { useId, useSyncExternalStore } from "react";

type Theme = "light" | "dark";

const listeners = new Set<() => void>();
const darkQuery = () => window.matchMedia("(prefers-color-scheme: dark)");
const systemTheme = (): Theme => (darkQuery().matches ? "dark" : "light");

/** A pinned choice if there is one, otherwise whatever the system says. */
function readTheme(): Theme {
  try {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // Storage blocked: follow the system.
  }
  return systemTheme();
}

function writeTheme(theme: Theme) {
  // Picking what the system already says means "follow the system", so nothing is pinned.
  const pin = theme === systemTheme() ? null : theme;
  try {
    if (pin) localStorage.setItem("theme", pin);
    else localStorage.removeItem("theme");
  } catch {
    // Private mode: the choice applies to this page only.
  }
  if (pin) document.documentElement.dataset.theme = pin;
  else delete document.documentElement.dataset.theme;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // While nothing is pinned, the site follows the system as it changes, and the control has to as well.
  const query = darkQuery();
  query.addEventListener("change", listener);
  return () => {
    listeners.delete(listener);
    query.removeEventListener("change", listener);
  };
}

const icons: Record<Theme, React.ReactNode> = {
  light: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" />
    </>
  ),
  dark: <path d="M20 14.5A8 8 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />,
};

/** Light or dark. The site opens in the system's theme; picking the other one pins it. */
export function ThemeToggle() {
  // The header renders this twice (desktop and phone menu): one shared name would make them one radio group.
  const name = useId();
  // Unknown on the server, so neither is checked until the page hydrates.
  const theme = useSyncExternalStore(subscribe, readTheme, () => null);

  return (
    <fieldset className="flex items-center">
      <legend className="sr-only">Colour theme</legend>
      <div className="flex rounded-md border border-rule bg-wash p-0.5">
        {(["light", "dark"] as const).map((value) => (
          <label key={value} className="relative cursor-pointer">
            <input
              type="radio"
              name={name}
              value={value}
              checked={theme === value}
              onChange={() => writeTheme(value)}
              className="peer sr-only"
            />
            <span className="block rounded px-2 py-1.5 text-ink-muted transition-colors peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-accent hover:text-ink">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="size-4">
                {icons[value]}
              </svg>
              <span className="sr-only">{`${value} theme`}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
