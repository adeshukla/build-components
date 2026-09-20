"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export type HeaderConfig = {
  logoText: string;
  links: { label: string; href: string }[];
  ctaButton: boolean;
  ctaText: string;
  ctaHref: string;
  menuLabel: string;
  sticky: boolean;
  mobileBreakpoint: "sm" | "md" | "lg";
  skipLink: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
  radius: number;
  height: "compact" | "regular";
};

// @config-start
const defaultConfig: HeaderConfig = {
  logoText: "Northwind",
  links: [
    { label: "Work", href: "/work" },
    { label: "Services", href: "/services" },
    { label: "About", href: "/about" },
    { label: "Journal", href: "/journal" },
  ],
  ctaButton: true,
  ctaText: "Start a project",
  ctaHref: "/contact",
  menuLabel: "Menu",
  sticky: false,
  mobileBreakpoint: "md",
  skipLink: true,
  theme: "light",
  accentColor: "#2563eb",
  radius: 8,
  height: "regular",
};
// @config-end

// Static class pairs per breakpoint: Tailwind cannot build class names at runtime.
const breakpoints = {
  sm: { inline: "hidden sm:flex", trigger: "sm:hidden", panel: "sm:hidden" },
  md: { inline: "hidden md:flex", trigger: "md:hidden", panel: "md:hidden" },
  lg: { inline: "hidden lg:flex", trigger: "lg:hidden", panel: "lg:hidden" },
};
const heights = { compact: "h-14", regular: "h-16 sm:h-20" };

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

const pathStore = {
  subscribe: () => () => {},
  get: () => window.location.pathname,
};

// WCAG relative luminance, used to keep button text readable on any accent colour.
function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Relative, fragment, http(s), mailto and tel links only. */
function safeHref(value: string) {
  return /^(\/|#|https?:\/\/|mailto:|tel:)/i.test(value.trim()) ? value.trim() : "#";
}

export function SiteHeader({ config = defaultConfig }: { config?: HeaderConfig }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const path = useSyncExternalStore(pathStore.subscribe, pathStore.get, () => "");
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const accentLuminance = luminance(config.accentColor);
  const breakpoint = breakpoints[config.mobileBreakpoint];
  const links = config.links.filter((link) => link.label.trim() !== "");
  const style = {
    "--hd-accent": config.accentColor,
    "--hd-on-accent": accentLuminance > 0.179 ? "#000000" : "#ffffff",
    "--hd-ring": accentLuminance <= 0.35 || dark ? config.accentColor : palette.text,
    "--hd-radius": `${config.radius}px`,
    "--hd-surface": palette.surface,
    "--hd-text": palette.text,
    "--hd-muted": palette.muted,
    "--hd-line": palette.line,
    "--hd-hover": palette.hover,
  } as CSSProperties;

  const focusRing =
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--hd-ring)";
  const linkClass = `rounded-(--hd-radius) px-3 py-2 text-(--hd-muted) no-underline hover:bg-(--hd-hover) hover:text-(--hd-text) aria-[current=page]:font-semibold aria-[current=page]:text-(--hd-text) ${focusRing}`;
  const ctaClass = `inline-flex min-h-11 items-center rounded-(--hd-radius) bg-(--hd-accent) px-4 font-semibold text-(--hd-on-accent) no-underline ${focusRing}`;

  function close(returnFocus = true) {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }

  // Escape and outside clicks are handled on the document: Safari does not focus a button when it
  // is tapped, so a listener on the header alone would never hear the key.
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (!panelRef.current?.contains(target) && !triggerRef.current?.contains(target)) setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <header
      style={style}
      className={`w-full border-b border-(--hd-line) bg-(--hd-surface) text-(--hd-text) ${config.sticky ? "sticky top-0 z-40" : ""}`}
    >
      {config.skipLink && (
        <a
          href="#main"
          className={`absolute left-4 z-50 -translate-y-20 rounded-(--hd-radius) bg-(--hd-accent) px-4 py-2 font-semibold text-(--hd-on-accent) no-underline transition-transform focus:translate-y-3 ${focusRing}`}
        >
          Skip to content
        </a>
      )}
      <div className={`mx-auto flex w-full max-w-7xl items-center gap-6 px-4 sm:px-6 ${heights[config.height]}`}>
        <a href="/" className={`inline-flex min-h-6 items-center text-lg font-bold tracking-tight text-(--hd-text) no-underline ${focusRing}`}>
          {config.logoText}
        </a>

        <nav aria-label="Main" className={`ml-auto items-center gap-1 ${breakpoint.inline}`}>
          <ul className="flex items-center gap-1">
            {links.map((link) => (
              <li key={`${link.label}-${link.href}`}>
                <a
                  href={safeHref(link.href)}
                  aria-current={path === safeHref(link.href) ? "page" : undefined}
                  className={linkClass}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          {config.ctaButton && (
            <a href={safeHref(config.ctaHref)} className={`ml-3 ${ctaClass}`}>
              {config.ctaText}
            </a>
          )}
        </nav>

        <button
          ref={triggerRef}
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-menu`}
          onClick={() => setOpen(!open)}
          className={`ml-auto inline-flex min-h-11 items-center gap-2 rounded-(--hd-radius) px-3 font-medium ${breakpoint.trigger} ${focusRing}`}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-5">
            {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
          {config.menuLabel}
        </button>
      </div>

      <div
        ref={panelRef}
        id={`${id}-menu`}
        hidden={!open}
        className={`border-t border-(--hd-line) ${breakpoint.panel}`}
      >
        <nav aria-label="Main" className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6">
          <ul className="flex flex-col">
            {links.map((link) => (
              <li key={`${link.label}-${link.href}`}>
                <a
                  href={safeHref(link.href)}
                  aria-current={path === safeHref(link.href) ? "page" : undefined}
                  onClick={() => close(false)}
                  className={`block min-h-11 ${linkClass}`}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          {config.ctaButton && (
            <a href={safeHref(config.ctaHref)} onClick={() => close(false)} className={`mt-3 w-full justify-center ${ctaClass}`}>
              {config.ctaText}
            </a>
          )}
        </nav>
      </div>
    </header>
  );
}
