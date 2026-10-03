"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export type CommandMenuConfig = {
  triggerLabel: string;
  hotkey: string;
  placeholder: string;
  commands: { group: string; label: string; shortcut: string }[];
  emptyText: string;
  showShortcuts: boolean;
  showHint: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: CommandMenuConfig = {
  triggerLabel: "Commands",
  hotkey: "k",
  placeholder: "Type a command",
  commands: [
    { group: "This page", label: "Copy the React file", shortcut: "C" },
    { group: "This page", label: "Copy the install command", shortcut: "I" },
    { group: "This page", label: "Reset every option", shortcut: "R" },
    { group: "Go to", label: "Parts catalogue", shortcut: "G then P" },
    { group: "Go to", label: "Accessibility statement", shortcut: "G then A" },
    { group: "Appearance", label: "Switch to dark", shortcut: "" },
    { group: "Appearance", label: "Follow the device", shortcut: "" },
  ],
  emptyText: "No command matches that.",
  showShortcuts: true,
  showHint: true,
  theme: "light",
  accentColor: "#7c3aed",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#1b1624", sunk: "#272031", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
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

/** Matches on every word, in any order, so "copy react" finds "Copy the React file". */
export function matchesQuery(command: { group: string; label: string }, query: string) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = `${command.label} ${command.group}`.toLowerCase();
  return words.every((word) => haystack.includes(word));
}

export function CommandMenu({ config = defaultConfig }: { config?: CommandMenuConfig }) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [ran, setRan] = useState("");
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--cmd-accent": config.accentColor,
    "--cmd-accent-text": readableAccent(config.accentColor, dark),
    "--cmd-on-accent": luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff",
    "--cmd-surface": `var(--bc-${dark ? "dark" : "light"}-surface, ${palette.surface})`,
    "--cmd-sunk": `var(--bc-${dark ? "dark" : "light"}-sunk, ${palette.sunk})`,
    "--cmd-text": `var(--bc-${dark ? "dark" : "light"}-text, ${palette.text})`,
    "--cmd-muted": `var(--bc-${dark ? "dark" : "light"}-muted, ${palette.muted})`,
    "--cmd-line": `var(--bc-${dark ? "dark" : "light"}-line, ${palette.line})`,
  } as CSSProperties;

  const shown = config.commands.filter((command) => matchesQuery(command, query));
  // Grouped for the eye; one flat list of options for the keyboard, which is what aria-activedescendant
  // walks. Each row carries its flat index, so the two orderings can never drift apart.
  const groups: { name: string; items: { command: (typeof shown)[number]; index: number }[] }[] = [];
  shown.forEach((command, index) => {
    const last = groups[groups.length - 1];
    if (last !== undefined && last.name === command.group) last.items.push({ command, index });
    else groups.push({ name: command.group, items: [{ command, index }] });
  });

  const open = (from: HTMLElement | null) => {
    // Safari does not focus a button when it is clicked, so the opener is passed in rather than read
    // from document.activeElement.
    opener.current = from;
    setQuery("");
    setActive(0);
    setRan("");
    dialog.current?.showModal();
  };

  const close = () => {
    // Focus cannot leave a modal dialog that is still open, so it closes first.
    dialog.current?.close();
    opener.current?.focus();
  };

  const run = (label: string) => {
    setRan(label);
    close();
  };

  const hotkey = config.hotkey.trim().toLowerCase();
  useEffect(() => {
    if (hotkey === "") return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== hotkey || !(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      if (dialog.current?.open === true) close();
      else open(document.getElementById(`${id}-trigger`));
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [hotkey, id]);

  const optionId = (index: number) => `${id}-option-${index}`;

  return (
    <div style={style} className="bg-(--cmd-surface) text-(--cmd-text)">
      <button
        id={`${id}-trigger`}
        type="button"
        onClick={(event) => open(event.currentTarget)}
        className="inline-flex min-h-11 items-center gap-3 rounded-[var(--bc-radius-sm,0.375rem)] border border-(--cmd-line) bg-(--cmd-sunk) px-4 font-medium text-(--cmd-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--cmd-accent-text)"
      >
        {config.triggerLabel}
        {config.showHint && hotkey !== "" && (
          <kbd className="rounded-[var(--bc-radius-xs,0.25rem)] border border-(--cmd-line) px-1.5 py-0.5 font-mono text-xs text-(--cmd-muted)">
            Ctrl {hotkey.toUpperCase()}
          </kbd>
        )}
      </button>

      <p role="status" className="mt-3 text-sm text-(--cmd-muted)">
        {ran === "" ? "" : `Ran: ${ran}`}
      </p>

      <dialog
        ref={dialog}
        aria-label={config.triggerLabel}
        onCancel={(event) => {
          // Escape is handled here so focus goes back to the opener rather than nowhere.
          event.preventDefault();
          close();
        }}
        onClick={(event) => {
          if (event.target === dialog.current) close();
        }}
        className="m-0 mx-auto mt-[10vh] w-[min(34rem,calc(100vw-2rem))] rounded-[var(--bc-radius-lg,0.75rem)] border border-(--cmd-line) bg-(--cmd-surface) p-0 text-(--cmd-text) backdrop:bg-black/40"
      >
        <div className="border-b border-(--cmd-line) p-3">
          <label htmlFor={`${id}-input`} className="sr-only">
            {config.placeholder}
          </label>
          <input
            id={`${id}-input`}
            type="text"
            role="combobox"
            autoComplete="off"
            aria-expanded={shown.length > 0}
            aria-controls={`${id}-list`}
            aria-activedescendant={shown.length > 0 ? optionId(Math.min(active, shown.length - 1)) : undefined}
            placeholder={config.placeholder}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActive((current) => (shown.length === 0 ? 0 : (current + 1) % shown.length));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActive((current) => (shown.length === 0 ? 0 : (current - 1 + shown.length) % shown.length));
              } else if (event.key === "Home") {
                event.preventDefault();
                setActive(0);
              } else if (event.key === "End") {
                event.preventDefault();
                setActive(Math.max(shown.length - 1, 0));
              } else if (event.key === "Enter") {
                event.preventDefault();
                const chosen = shown[Math.min(active, shown.length - 1)];
                if (chosen !== undefined) run(chosen.label);
              }
            }}
            className="min-h-11 w-full bg-transparent px-2 text-(--cmd-text) outline-none placeholder:text-(--cmd-muted)"
          />
        </div>

        {/*
          A listbox may only own options, and groups of options. The group heading is therefore a
          picture of the group's own aria-label, and the empty message lives outside the listbox —
          both were non-option children otherwise.
        */}
        <div
          id={`${id}-list`}
          role={shown.length > 0 ? "listbox" : undefined}
          aria-label={shown.length > 0 ? config.triggerLabel : undefined}
          className="max-h-72 overflow-y-auto p-2"
        >
          {groups.map((group) => (
            <div key={group.name} role="group" aria-label={group.name}>
              <p aria-hidden="true" className="px-2 pt-2 pb-1 font-mono text-xs tracking-wide text-(--cmd-muted) uppercase">
                {group.name}
              </p>
              {group.items.map(({ command, index }) => {
                const here = index === Math.min(active, shown.length - 1);
                return (
                  <div
                    key={command.label}
                    id={optionId(index)}
                    role="option"
                    aria-selected={here}
                    // The pointer sets the active option too, so hovering and arrowing agree.
                    onMouseMove={() => setActive(index)}
                    onClick={() => run(command.label)}
                    className={`flex min-h-11 cursor-pointer items-center justify-between gap-4 rounded-[var(--bc-radius-sm,0.375rem)] px-2 ${
                      here ? "bg-(--cmd-accent) text-(--cmd-on-accent)" : ""
                    }`}
                  >
                    <span>{command.label}</span>
                    {config.showShortcuts && command.shortcut !== "" && (
                      <kbd
                        className={`shrink-0 rounded-[var(--bc-radius-xs,0.25rem)] border px-1.5 py-0.5 font-mono text-xs ${
                          here ? "border-current/40 text-(--cmd-on-accent)" : "border-(--cmd-line) text-(--cmd-muted)"
                        }`}
                      >
                        {command.shortcut}
                      </kbd>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {shown.length === 0 && (
          <p role="status" className="px-4 py-4 text-sm text-(--cmd-muted)">
            {config.emptyText}
          </p>
        )}
      </dialog>
    </div>
  );
}
