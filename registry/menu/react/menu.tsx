"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export type MenuItem = { label: string; href: string };

export type MenuConfig = {
  buttonText: string;
  items: MenuItem[];
  align: "start" | "end";
  chevron: boolean;
  typeAhead: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
  radius: number;
};

// @config-start
const defaultConfig: MenuConfig = {
  buttonText: "Actions",
  items: [
    { label: "Edit details", href: "" },
    { label: "Duplicate", href: "" },
    { label: "Move to archive", href: "" },
    { label: "Open in a new tab", href: "/preview" },
    { label: "Delete", href: "" },
  ],
  align: "start",
  chevron: true,
  typeAhead: true,
  theme: "light",
  accentColor: "#2563eb",
  radius: 10,
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", muted: "#4d4a57", line: "#d9d5e4", hover: "#f4f3f8" },
  dark: { surface: "#141019", text: "#f6f5fa", muted: "#b6b3c2", line: "#3a3448", hover: "#221d2e" },
};

const darkMedia = {
  subscribe: (onChange: () => void) => {
    const list = window.matchMedia("(prefers-color-scheme: dark)");
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  },
  get: () => window.matchMedia("(prefers-color-scheme: dark)").matches,
};

// WCAG relative luminance, used to keep text on the accent readable.
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

/** Relative, fragment, http(s), mailto and tel links only. */
function safeHref(value: string) {
  return /^(\/|#|https?:\/\/|mailto:|tel:)/i.test(value.trim()) ? value.trim() : "#";
}

export function Menu({
  config = defaultConfig,
  onChoose,
}: {
  config?: MenuConfig;
  /** Called with the item's label when one is picked, so the page can act on it. */
  onChoose?: (label: string) => void;
}) {
  const items = config.items.filter((item) => item.label.trim() !== "");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const wanted = useRef<number | null>(null);
  const typed = useRef<{ text: string; timer: ReturnType<typeof setTimeout> | undefined }>({
    text: "",
    timer: undefined,
  });
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;

  // Escape and outside clicks are handled on the document: Safari does not focus a button when
  // it is tapped, so a listener on the menu alone would never hear the key.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
    }
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  // Focus moves as soon as the menu is on the page, before the browser paints: waiting a frame
  // meant a fast keypress could land on nothing.
  useLayoutEffect(() => {
    if (!open || wanted.current === null) return;
    itemRefs.current[wanted.current]?.focus();
    wanted.current = null;
  }, [open]);

  function openMenu(index: number) {
    wanted.current = index < 0 ? items.length - 1 : index;
    setOpen(true);
  }

  function close() {
    setOpen(false);
    buttonRef.current?.focus();
  }

  function onItemKeyDown(event: React.KeyboardEvent, index: number) {
    const moves: Record<string, number> = {
      ArrowDown: (index + 1) % items.length,
      ArrowUp: (index - 1 + items.length) % items.length,
      Home: 0,
      End: items.length - 1,
    };
    if (event.key in moves) {
      event.preventDefault();
      itemRefs.current[moves[event.key]]?.focus();
      return;
    }
    if (event.key === "Tab") {
      setOpen(false); // Tab leaves the menu instead of walking through it.
      return;
    }
    // Type-ahead: typing letters jumps to the next item that starts with them. The buffer
    // clears itself after a pause instead of comparing clock readings.
    if (!config.typeAhead || event.key.length !== 1 || event.metaKey || event.ctrlKey) return;
    clearTimeout(typed.current.timer);
    typed.current.text += event.key;
    typed.current.timer = setTimeout(() => {
      typed.current.text = "";
    }, 600);
    const search = typed.current.text.toLowerCase();
    const order = [...items.slice(index + 1), ...items.slice(0, index + 1)];
    const found = order.find((item) => item.label.toLowerCase().startsWith(search));
    if (found) itemRefs.current[items.indexOf(found)]?.focus();
  }

  const style = {
    "--mn-accent-text": readableAccent(config.accentColor, dark),
    "--mn-radius": `${config.radius}px`,
    "--mn-surface": palette.surface,
    "--mn-text": palette.text,
    "--mn-muted": palette.muted,
    "--mn-line": palette.line,
    "--mn-hover": palette.hover,
  } as CSSProperties;
  const focus = "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--mn-accent-text)";

  if (items.length === 0) return null;

  return (
    <div ref={rootRef} style={style} className="relative inline-block bg-(--mn-surface) text-(--mn-text)">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="menu-list"
        onClick={() => (open ? setOpen(false) : openMenu(0))}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            openMenu(0);
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            openMenu(-1);
          }
        }}
        className={`flex cursor-pointer items-center gap-2 rounded-(--mn-radius) border border-(--mn-line) px-3 py-2 font-medium ${focus}`}
      >
        {config.buttonText}
        {config.chevron && (
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className={`size-4 transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        )}
      </button>

      <div
        id="menu-list"
        role="menu"
        aria-label={config.buttonText}
        hidden={!open}
        className={`absolute z-20 mt-1 min-w-52 rounded-(--mn-radius) border border-(--mn-line) bg-(--mn-surface) p-1 shadow-lg ${
          config.align === "end" ? "right-0" : "left-0"
        }`}
      >
        {items.map((item, index) => {
          const shared = {
            role: "menuitem",
            tabIndex: -1,
            ref: (node: HTMLElement | null) => {
              itemRefs.current[index] = node;
            },
            onKeyDown: (event: React.KeyboardEvent) => onItemKeyDown(event, index),
            className: `block w-full cursor-pointer rounded-[calc(var(--mn-radius)-4px)] px-3 py-2 text-left no-underline hover:bg-(--mn-hover) ${focus}`,
          };
          return item.href.trim() !== "" ? (
            <a key={index} {...shared} href={safeHref(item.href)} onClick={() => setOpen(false)}>
              {item.label}
            </a>
          ) : (
            <button
              key={index}
              {...shared}
              type="button"
              onClick={() => {
                onChoose?.(item.label);
                close();
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
