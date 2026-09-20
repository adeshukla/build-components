"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export type SidebarItem = { section: string; label: string; href: string; badge: string };

export type SidebarConfig = {
  label: string;
  items: SidebarItem[];
  activeHref: string;
  toggleText: string;
  collapsible: boolean;
  mobileBreakpoint: "sm" | "md" | "lg";
  width: number;
  badges: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
  radius: number;
};

// @config-start
const defaultConfig: SidebarConfig = {
  label: "Workspace",
  items: [
    { section: "Work", label: "Overview", href: "/overview", badge: "" },
    { section: "Work", label: "Orders", href: "/orders", badge: "12" },
    { section: "Work", label: "Customers", href: "/customers", badge: "" },
    { section: "Library", label: "Products", href: "/products", badge: "" },
    { section: "Library", label: "Collections", href: "/collections", badge: "3" },
    { section: "Settings", label: "Team", href: "/team", badge: "" },
    { section: "Settings", label: "Billing", href: "/billing", badge: "" },
  ],
  activeHref: "/orders",
  toggleText: "Menu",
  collapsible: true,
  mobileBreakpoint: "md",
  width: 260,
  badges: true,
  theme: "light",
  accentColor: "#2563eb",
  radius: 10,
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#d9d5e4", hover: "#f0eff6" },
  dark: { surface: "#141019", sunk: "#1c1726", text: "#f6f5fa", muted: "#b6b3c2", line: "#3a3448", hover: "#221d2e" },
};

const widths = { sm: 640, md: 768, lg: 1024 };

const darkMedia = {
  subscribe: (onChange: () => void) => {
    const list = window.matchMedia("(prefers-color-scheme: dark)");
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  },
  get: () => window.matchMedia("(prefers-color-scheme: dark)").matches,
};

/** True while the screen is narrower than the breakpoint, so the sidebar becomes a drawer. */
function phoneMedia(width: number) {
  return {
    subscribe: (onChange: () => void) => {
      const list = window.matchMedia(`(max-width: ${width - 1}px)`);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    get: () => window.matchMedia(`(max-width: ${width - 1}px)`).matches,
  };
}

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

/** Rows are flat so they stay easy to edit; the sections are rebuilt from them here. */
function groupItems(items: SidebarItem[]) {
  const sections: { name: string; links: SidebarItem[] }[] = [];
  for (const item of items) {
    if (item.label.trim() === "") continue;
    let section = sections.find((entry) => entry.name === item.section);
    if (!section) {
      section = { name: item.section, links: [] };
      sections.push(section);
    }
    section.links.push(item);
  }
  return sections;
}

export function Sidebar({ config = defaultConfig }: { config?: SidebarConfig }) {
  const sections = groupItems(config.items);
  const [closed, setClosed] = useState<string[]>([]);
  const [drawer, setDrawer] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const media = phoneMedia(widths[config.mobileBreakpoint]);
  const phone = useSyncExternalStore(media.subscribe, media.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;

  // Escape and outside clicks are handled on the document: Safari does not focus a button when
  // it is tapped, so a listener on the drawer alone would never hear the key.
  useEffect(() => {
    if (!drawer) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setDrawer(false);
      toggleRef.current?.focus();
    }
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setDrawer(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [drawer]);

  const style = {
    "--sb-accent": config.accentColor,
    "--sb-accent-text": readableAccent(config.accentColor, dark),
    "--sb-radius": `${config.radius}px`,
    "--sb-width": `${config.width}px`,
    "--sb-surface": palette.surface,
    "--sb-sunk": palette.sunk,
    "--sb-text": palette.text,
    "--sb-muted": palette.muted,
    "--sb-line": palette.line,
    "--sb-hover": palette.hover,
  } as CSSProperties;
  const focus = "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--sb-accent-text)";

  const list = (
    <nav aria-label={config.label} className="flex flex-col gap-4">
      {sections.map((section) => {
        const open = !closed.includes(section.name);
        const id = `sidebar-${section.name.replace(/\W+/g, "-").toLowerCase()}`;
        return (
          <div key={section.name}>
            {section.name.trim() !== "" &&
              (config.collapsible ? (
                <h2 className="m-0">
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={id}
                    onClick={() =>
                      setClosed(open ? [...closed, section.name] : closed.filter((entry) => entry !== section.name))
                    }
                    className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-(--sb-radius) px-3 py-2 text-xs font-semibold tracking-wide text-(--sb-muted) uppercase hover:bg-(--sb-hover) ${focus}`}
                  >
                    {section.name}
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      className={`size-4 transition-transform duration-200 motion-reduce:transition-none ${open ? "" : "-rotate-90"}`}
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                </h2>
              ) : (
                <h2 className="px-3 py-2 text-xs font-semibold tracking-wide text-(--sb-muted) uppercase">
                  {section.name}
                </h2>
              ))}

            {/* A display class beats the hidden attribute, so the class has to go too. */}
            <ul
              id={id}
              hidden={config.collapsible && !open}
              className={`list-none flex-col gap-0.5 p-0 ${config.collapsible && !open ? "hidden" : "flex"}`}
            >
              {section.links.map((item, index) => {
                const active = item.href.trim() !== "" && item.href === config.activeHref;
                return (
                  <li key={index}>
                    <a
                      href={safeHref(item.href)}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setDrawer(false)}
                      className={`flex items-center justify-between gap-2 rounded-(--sb-radius) px-3 py-2 no-underline ${focus} ${
                        active
                          ? "bg-(--sb-sunk) font-semibold text-(--sb-accent-text)"
                          : "text-(--sb-text) hover:bg-(--sb-hover)"
                      }`}
                    >
                      {item.label}
                      {config.badges && item.badge.trim() !== "" && (
                        <span className="rounded-full bg-(--sb-sunk) px-2 py-0.5 text-xs font-medium text-(--sb-muted)">
                          {item.badge}
                          <span className="sr-only"> waiting</span>
                        </span>
                      )}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );

  if (sections.length === 0) return null;

  // On a phone the sidebar is a drawer behind a button; from the breakpoint up it is just there.
  if (phone) {
    return (
      <div ref={rootRef} style={style} className="bg-(--sb-surface) text-(--sb-text)">
        <button
          ref={toggleRef}
          type="button"
          aria-expanded={drawer}
          aria-controls="sidebar-drawer"
          onClick={() => setDrawer(!drawer)}
          className={`flex cursor-pointer items-center gap-2 rounded-(--sb-radius) border border-(--sb-line) px-3 py-2 font-medium ${focus}`}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-5">
            {drawer ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
          {config.toggleText}
        </button>

        <div id="sidebar-drawer" hidden={!drawer} className="mt-2 rounded-(--sb-radius) border border-(--sb-line) p-2">
          {list}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      style={style}
      className="w-(--sb-width) shrink-0 rounded-(--sb-radius) border border-(--sb-line) bg-(--sb-surface) p-2 text-(--sb-text)"
    >
      {list}
    </div>
  );
}
