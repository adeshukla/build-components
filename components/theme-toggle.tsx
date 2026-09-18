"use client";

import { useSyncExternalStore } from "react";

type Theme = "system" | "light" | "dark";

const listeners = new Set<() => void>();

function readTheme(): Theme {
  try {
    const stored = localStorage.getItem("theme");
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

function writeTheme(theme: Theme) {
  try {
    if (theme === "system") localStorage.removeItem("theme");
    else localStorage.setItem("theme", theme);
  } catch {
    // Private mode: the choice applies to this page only.
  }
  if (theme === "system") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const icons: Record<Theme, React.ReactNode> = {
  system: (
    <>
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 21h8" />
    </>
  ),
  light: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" />
    </>
  ),
  dark: <path d="M20 14.5A8 8 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />,
};

/** Three-state theme control: follow the system, or pin light or dark. */
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "system" as Theme);

  return (
    <fieldset className="flex items-center">
      <legend className="sr-only">Colour theme</legend>
      <div className="flex rounded-md border border-board-line bg-board-raised/60 p-0.5">
        {(["system", "light", "dark"] as const).map((value) => (
          <label key={value} className="relative cursor-pointer">
            <input
              type="radio"
              name="theme"
              value={value}
              checked={theme === value}
              onChange={() => writeTheme(value)}
              className="peer sr-only"
            />
            <span className="block rounded px-2 py-1.5 text-silk-muted transition-colors peer-checked:bg-pad peer-checked:text-board peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-pad hover:text-silk">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="size-4">
                {icons[value]}
              </svg>
              <span className="sr-only">{value === "system" ? "Follow system theme" : `${value} theme`}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
