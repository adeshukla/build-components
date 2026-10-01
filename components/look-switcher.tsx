"use client";

import { useEffect, useSyncExternalStore } from "react";

/*
 * Development only (D77): tries the layouts on the real pages before one is chosen. The choice is kept
 * in this browser and applied by the root layout's inline script, so it holds across pages. Removed once
 * a look is picked.
 */

const looks = [
  { value: "now", label: "Now", note: "1280px" },
  { value: "wide", label: "Wide", note: "1536px, airy" },
  { value: "clean", label: "Clean", note: "1440px, flat" },
];

const store = {
  subscribe: (onChange: () => void) => {
    window.addEventListener("storage", onChange);
    window.addEventListener("look-change", onChange);
    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener("look-change", onChange);
    };
  },
  get: () => {
    try {
      return localStorage.getItem("look") ?? "now";
    } catch {
      return "now";
    }
  },
};

export function LookSwitcher() {
  const look = useSyncExternalStore(store.subscribe, store.get, () => "now");

  useEffect(() => {
    document.documentElement.dataset.look = look;
  }, [look]);

  function choose(value: string) {
    try {
      localStorage.setItem("look", value);
    } catch {
      // Storage blocked: a development tool can live without it.
    }
    window.dispatchEvent(new Event("look-change"));
  }

  return (
    <fieldset className="glass fixed bottom-4 left-4 z-50 flex items-center gap-1 rounded-full p-1 text-sm shadow-lg">
      <legend className="sr-only">Layout to try (development only)</legend>
      {looks.map((option) => (
        <label key={option.value} className="relative cursor-pointer">
          <input
            type="radio"
            name="look"
            value={option.value}
            checked={look === option.value}
            onChange={() => choose(option.value)}
            className="peer sr-only"
          />
          <span className="flex min-h-9 flex-col justify-center rounded-full px-3.5 leading-tight text-ink-muted peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent">
            <span className="font-medium">{option.label}</span>
            <span className="text-[0.625rem]">{option.note}</span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}
