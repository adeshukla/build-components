"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export type MenuBarConfig = {
  label: string;
  items: { menu: string; item: string; shortcut: string }[];
  showShortcuts: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: MenuBarConfig = {
  label: "Document",
  items: [
    { menu: "File", item: "New draft", shortcut: "Ctrl N" },
    { menu: "File", item: "Open recent", shortcut: "" },
    { menu: "File", item: "Export as Markdown", shortcut: "" },
    { menu: "Edit", item: "Undo", shortcut: "Ctrl Z" },
    { menu: "Edit", item: "Redo", shortcut: "Ctrl Y" },
    { menu: "Edit", item: "Find in document", shortcut: "Ctrl F" },
    { menu: "View", item: "Outline", shortcut: "" },
    { menu: "View", item: "Word count", shortcut: "" },
    { menu: "View", item: "Full screen", shortcut: "F11" },
  ],
  showShortcuts: true,
  theme: "light",
  accentColor: "#1d4ed8",
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

/** Runs of items with the same menu name become one menu, in the order they are listed. */
export function toMenus(items: MenuBarConfig["items"]) {
  const menus: { name: string; items: MenuBarConfig["items"] }[] = [];
  for (const entry of items) {
    const last = menus[menus.length - 1];
    if (last !== undefined && last.name === entry.menu) last.items.push(entry);
    else menus.push({ name: entry.menu, items: [entry] });
  }
  return menus;
}

/** The key as the reader means it (D93): in a right-to-left page, Left goes forward and Right goes back. */
function keyOf(event: { key: string; target: EventTarget | null }) {
  const rtl = event.target instanceof Element && getComputedStyle(event.target).direction === "rtl";
  const swapped: Record<string, string> = { ArrowLeft: "ArrowRight", ArrowRight: "ArrowLeft" };
  return rtl ? (swapped[event.key] ?? event.key) : event.key;
}

export function MenuBar({ config = defaultConfig }: { config?: MenuBarConfig }) {
  const menus = toMenus(config.items);
  const [openAt, setOpenAt] = useState<number | null>(null);
  const [focusAt, setFocusAt] = useState(0);
  const [chosen, setChosen] = useState("");
  const root = useRef<HTMLDivElement | null>(null);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--mb-accent": config.accentColor,
    "--mb-accent-text": readableAccent(config.accentColor, dark),
    "--mb-on-accent": luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff",
    "--mb-surface": `var(--bc-${dark ? "dark" : "light"}-surface, ${palette.surface})`,
    "--mb-sunk": `var(--bc-${dark ? "dark" : "light"}-sunk, ${palette.sunk})`,
    "--mb-text": `var(--bc-${dark ? "dark" : "light"}-text, ${palette.text})`,
    "--mb-muted": `var(--bc-${dark ? "dark" : "light"}-muted, ${palette.muted})`,
    "--mb-line": `var(--bc-${dark ? "dark" : "light"}-line, ${palette.line})`,
  } as CSSProperties;

  const itemsIn = (index: number) =>
    Array.from(root.current?.querySelectorAll<HTMLElement>(`[data-menu="${index}"] [role="menuitem"]`) ?? []);

  /**
   * Where focus should go once React has rendered. A submenu is not in the DOM until the state lands,
   * and a frame is not a promise that it will be: the effect below runs after the commit, every time.
   */
  const wanted = useRef<{ kind: "top" | "item"; index: number; place?: "first" | "last" } | null>(null);
  useEffect(() => {
    const want = wanted.current;
    if (want === null) return;
    wanted.current = null;
    if (want.kind === "top") {
      root.current?.querySelectorAll<HTMLElement>("[data-top]")[want.index]?.focus();
      return;
    }
    const list = Array.from(root.current?.querySelectorAll<HTMLElement>(`[data-menu="${want.index}"] [role="menuitem"]`) ?? []);
    (want.place === "last" ? list[list.length - 1] : list[0])?.focus();
  });

  const openMenu = (index: number, place: "first" | "last") => {
    wanted.current = { kind: "item", index, place };
    setOpenAt(index);
    setFocusAt(index);
  };

  const closeMenu = (back: boolean) => {
    if (back) wanted.current = { kind: "top", index: focusAt };
    setOpenAt(null);
  };

  const moveTop = (to: number, keepOpen: boolean) => {
    const next = (to + menus.length) % menus.length;
    if (keepOpen) {
      openMenu(next, "first");
      return;
    }
    wanted.current = { kind: "top", index: next };
    setFocusAt(next);
    setOpenAt(null);
  };

  // Escape and outside clicks are heard on the document: Safari does not focus a clicked button, so
  // listening on the component's own root would miss them. Attached once, so nothing depends on the
  // order two effects run in.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (keyOf(event) !== "Escape") return;
      setOpenAt((current) => {
        if (current === null) return null;
        wanted.current = { kind: "top", index: current };
        return null;
      });
    }
    function onPointerDown(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpenAt(null);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  const choose = (label: string) => {
    setChosen(label);
    closeMenu(true);
  };

  /** Type a letter to jump to the next item starting with it — the APG's own type-ahead. */
  const typeAhead = (list: HTMLElement[], from: number, key: string) => {
    const lower = key.toLowerCase();
    for (let step = 1; step <= list.length; step++) {
      const at = list[(from + step) % list.length];
      if (at.textContent?.trim().toLowerCase().startsWith(lower) === true) {
        at.focus();
        return true;
      }
    }
    return false;
  };

  return (
    <div ref={root} style={style} className="bg-(--mb-surface) text-(--mb-text)">
      <div
        role="menubar"
        aria-label={config.label}
        aria-orientation="horizontal"
        className="flex flex-wrap items-center gap-1 rounded-[var(--bc-radius-sm,0.375rem)] border border-(--mb-line) bg-(--mb-sunk) p-1"
      >
        {menus.map((menu, index) => (
          <div key={menu.name} className="relative">
            <button
              type="button"
              role="menuitem"
              data-top
              aria-haspopup="true"
              aria-expanded={openAt === index}
              // One tab stop for the whole bar: the arrows move inside it, which is what a menubar is.
              tabIndex={focusAt === index ? 0 : -1}
              onClick={() => (openAt === index ? closeMenu(false) : openMenu(index, "first"))}
              onKeyDown={(event) => {
                if (keyOf(event) === "ArrowRight") {
                  event.preventDefault();
                  moveTop(index + 1, openAt !== null);
                } else if (keyOf(event) === "ArrowLeft") {
                  event.preventDefault();
                  moveTop(index - 1, openAt !== null);
                } else if (keyOf(event) === "ArrowDown" || keyOf(event) === "Enter" || keyOf(event) === " ") {
                  event.preventDefault();
                  openMenu(index, "first");
                } else if (keyOf(event) === "ArrowUp") {
                  event.preventDefault();
                  openMenu(index, "last");
                } else if (keyOf(event) === "Home") {
                  event.preventDefault();
                  moveTop(0, false);
                } else if (keyOf(event) === "End") {
                  event.preventDefault();
                  moveTop(menus.length - 1, false);
                }
              }}
              className={`flex min-h-11 items-center gap-1.5 rounded-[var(--bc-radius-xs,0.25rem)] px-3 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--mb-accent-text) ${
                openAt === index ? "bg-(--mb-accent) text-(--mb-on-accent)" : "text-(--mb-text)"
              }`}
            >
              {menu.name}
            </button>

            {openAt === index && (
              <div
                role="menu"
                aria-label={menu.name}
                data-menu={index}
                className="absolute top-full left-0 z-30 mt-1 min-w-56 rounded-[var(--bc-radius-sm,0.375rem)] border border-(--mb-line) bg-(--mb-surface) p-1 shadow-lg"
              >
                {menu.items.map((entry, at) => (
                  <button
                    key={entry.item}
                    type="button"
                    role="menuitem"
                    tabIndex={-1}
                    onClick={() => choose(entry.item)}
                    onKeyDown={(event) => {
                      const list = itemsIn(index);
                      if (keyOf(event) === "ArrowDown") {
                        event.preventDefault();
                        list[(at + 1) % list.length]?.focus();
                      } else if (keyOf(event) === "ArrowUp") {
                        event.preventDefault();
                        list[(at - 1 + list.length) % list.length]?.focus();
                      } else if (keyOf(event) === "Home") {
                        event.preventDefault();
                        list[0]?.focus();
                      } else if (keyOf(event) === "End") {
                        event.preventDefault();
                        list[list.length - 1]?.focus();
                      } else if (keyOf(event) === "ArrowRight") {
                        // From inside a menu, sideways means the next menu — opened, as the APG has it.
                        event.preventDefault();
                        moveTop(index + 1, true);
                      } else if (keyOf(event) === "ArrowLeft") {
                        event.preventDefault();
                        moveTop(index - 1, true);
                      } else if (keyOf(event) === "Tab") {
                        // Tab leaves the whole bar rather than walking the menu it opened.
                        setOpenAt(null);
                      } else if (keyOf(event).length === 1 && /\S/.test(keyOf(event))) {
                        if (typeAhead(list, at, keyOf(event))) event.preventDefault();
                      }
                    }}
                    className="flex w-full min-h-11 items-center justify-between gap-6 rounded-[var(--bc-radius-xs,0.25rem)] px-3 text-left hover:bg-(--mb-sunk) focus-visible:bg-(--mb-sunk) focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-(--mb-accent-text)"
                  >
                    <span>{entry.item}</span>
                    {config.showShortcuts && entry.shortcut !== "" && (
                      <kbd className="shrink-0 font-mono text-xs text-(--mb-muted)">{entry.shortcut}</kbd>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <p role="status" className="mt-3 text-sm text-(--mb-muted)">
        {chosen === "" ? "" : `Chose: ${chosen}`}
      </p>
    </div>
  );
}
