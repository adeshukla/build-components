"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export type MegaMenuItem = { menu: string; group: string; label: string; href: string; description: string };

export type MegaMenuConfig = {
  logoText: string;
  label: string;
  items: MegaMenuItem[];
  links: { label: string; href: string }[];
  openOn: "click" | "hover";
  panel: "aligned" | "full";
  columns: "2" | "3" | "4";
  descriptions: boolean;
  ctaButton: boolean;
  ctaText: string;
  ctaHref: string;
  theme: "light" | "dark" | "system";
  accentColor: string;
  radius: number;
};

// @config-start
const defaultConfig: MegaMenuConfig = {
  logoText: "Northwind",
  label: "Main",
  items: [
    { menu: "Products", group: "Build", label: "Editor", href: "/editor", description: "Set options and see the result" },
    { menu: "Products", group: "Build", label: "Registry", href: "/registry", description: "Install by URL" },
    { menu: "Products", group: "Ship", label: "Exports", href: "/exports", description: "React and plain HTML" },
    { menu: "Products", group: "Ship", label: "Tests", href: "/tests", description: "Keyboard and axe on every output" },
    { menu: "Solutions", group: "By team", label: "Design systems", href: "/design-systems", description: "One set of parts for everyone" },
    { menu: "Solutions", group: "By team", label: "Agencies", href: "/agencies", description: "Hand clients code they own" },
    { menu: "Solutions", group: "By need", label: "Accessibility", href: "/accessibility", description: "Patterns that pass an audit" },
  ],
  links: [
    { label: "Pricing", href: "/pricing" },
    { label: "Docs", href: "/docs" },
  ],
  openOn: "click",
  panel: "aligned",
  columns: "2",
  descriptions: true,
  ctaButton: true,
  ctaText: "Start free",
  ctaHref: "/signup",
  theme: "light",
  accentColor: "#2563eb",
  radius: 10,
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", muted: "#4d4a57", line: "#e4e1ec", hover: "#f4f3f8" },
  dark: { surface: "#141019", text: "#f6f5fa", muted: "#b6b3c2", line: "#2c2838", hover: "#221d2e" },
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

/** Rows are flat (one per link) so they stay easy to edit; the menus are rebuilt from them here. */
function groupItems(items: MegaMenuItem[]) {
  const menus: { name: string; groups: { name: string; links: MegaMenuItem[] }[] }[] = [];
  for (const item of items) {
    if (item.menu.trim() === "" || item.label.trim() === "") continue;
    let menu = menus.find((entry) => entry.name === item.menu);
    if (!menu) {
      menu = { name: item.menu, groups: [] };
      menus.push(menu);
    }
    let group = menu.groups.find((entry) => entry.name === item.group);
    if (!group) {
      group = { name: item.group, links: [] };
      menu.groups.push(group);
    }
    group.links.push(item);
  }
  return menus;
}

export function MegaMenu({ config = defaultConfig }: { config?: MegaMenuConfig }) {
  const [open, setOpen] = useState<string | null>(null);
  const rootRef = useRef<HTMLElement>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const accentLuminance = luminance(config.accentColor);
  const menus = groupItems(config.items);
  const links = config.links.filter((link) => link.label.trim() !== "");

  // Escape and outside clicks are handled on the document: Safari does not focus a button when it
  // is tapped, so a listener on the nav alone would never hear the key.
  useEffect(() => {
    if (open === null) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      const button = open === null ? null : buttonRefs.current[open];
      setOpen(null);
      button?.focus();
    }
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(null);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  const style = {
    "--mm-accent": config.accentColor,
    "--mm-accent-text": readableAccent(config.accentColor, dark),
    "--mm-on-accent": accentLuminance > 0.179 ? "#000000" : "#ffffff",
    "--mm-radius": `${config.radius}px`,
    "--mm-surface": palette.surface,
    "--mm-text": palette.text,
    "--mm-muted": palette.muted,
    "--mm-line": palette.line,
    "--mm-hover": palette.hover,
  } as CSSProperties;
  const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--mm-accent-text)";
  const top = `flex items-center gap-1 rounded-(--mm-radius) px-3 py-2 font-medium no-underline text-(--mm-text) hover:bg-(--mm-hover) ${focus}`;
  const columns = { "2": "sm:grid-cols-2", "3": "sm:grid-cols-3", "4": "sm:grid-cols-4" }[config.columns];

  return (
    <nav
      ref={rootRef}
      aria-label={config.label}
      style={style}
      className="relative bg-(--mm-surface) text-(--mm-text)"
      onMouseLeave={config.openOn === "hover" ? () => setOpen(null) : undefined}
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-(--mm-line) px-4 py-3">
        <span className="mr-2 font-semibold">{config.logoText}</span>

        {menus.map((menu) => {
          const expanded = open === menu.name;
          return (
            <div
              key={menu.name}
              className="static sm:relative"
              onMouseEnter={config.openOn === "hover" ? () => setOpen(menu.name) : undefined}
            >
              <button
                ref={(node) => {
                  buttonRefs.current[menu.name] = node;
                }}
                type="button"
                aria-expanded={expanded}
                aria-controls={`mega-panel-${menu.name.replace(/\W+/g, "-").toLowerCase()}`}
                onClick={() => setOpen(expanded ? null : menu.name)}
                onKeyDown={(event) => {
                  if (event.key !== "ArrowDown") return;
                  event.preventDefault();
                  setOpen(menu.name);
                  // Let the panel render before reaching into it for the first link.
                  requestAnimationFrame(() => {
                    rootRef.current?.querySelector<HTMLAnchorElement>(`[data-panel="${menu.name}"] a`)?.focus();
                  });
                }}
                className={`cursor-pointer ${top} ${expanded ? "bg-(--mm-hover)" : ""}`}
              >
                {menu.name}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className={`size-4 transition-transform duration-200 motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              <div
                id={`mega-panel-${menu.name.replace(/\W+/g, "-").toLowerCase()}`}
                data-panel={menu.name}
                hidden={!expanded}
                // Below the whole bar by default, so a wrapped bar never gets covered; once there
                // is room, an aligned panel drops under its own button instead.
                className={`absolute inset-x-4 top-full z-10 mt-1 rounded-(--mm-radius) border border-(--mm-line) bg-(--mm-surface) p-5 shadow-lg ${
                  config.panel === "full" ? "" : "sm:inset-x-auto sm:top-auto sm:left-0 sm:min-w-[34rem]"
                }`}
              >
                <div className={`grid gap-x-8 gap-y-6 ${columns}`}>
                  {menu.groups.map((group) => (
                    <div key={group.name}>
                      {group.name.trim() !== "" && (
                        <p className="mb-2 text-xs font-semibold tracking-wide text-(--mm-muted) uppercase">
                          {group.name}
                        </p>
                      )}
                      <ul className="flex list-none flex-col gap-1 p-0">
                        {group.links.map((link, index) => (
                          <li key={index}>
                            <a
                              href={safeHref(link.href)}
                              onClick={() => setOpen(null)}
                              className={`block rounded-(--mm-radius) px-2 py-2 no-underline hover:bg-(--mm-hover) ${focus}`}
                            >
                              <span className="block font-medium text-(--mm-text)">{link.label}</span>
                              {config.descriptions && link.description.trim() !== "" && (
                                <span className="block text-sm text-(--mm-muted)">{link.description}</span>
                              )}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        {links.map((link, index) => (
          <a key={index} href={safeHref(link.href)} className={top}>
            {link.label}
          </a>
        ))}

        {config.ctaButton && (
          <a
            href={safeHref(config.ctaHref)}
            className={`ml-auto rounded-(--mm-radius) bg-(--mm-accent) px-4 py-2 font-semibold text-(--mm-on-accent) no-underline ${focus}`}
          >
            {config.ctaText}
          </a>
        )}
      </div>
    </nav>
  );
}
