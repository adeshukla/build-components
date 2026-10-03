"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export type StickyHeaderConfig = {
  title: string;
  links: { label: string }[];
  actionLabel: string;
  shrink: boolean;
  hideOnScrollDown: boolean;
  threshold: number;
  demoSections: number;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: StickyHeaderConfig = {
  title: "Ledger",
  links: [{ label: "Overview" }, { label: "Entries" }, { label: "Reports" }, { label: "Settings" }],
  actionLabel: "New entry",
  shrink: true,
  hideOnScrollDown: true,
  threshold: 80,
  demoSections: 6,
  theme: "light",
  accentColor: "#1d4ed8",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
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

const stillMedia = {
  subscribe: (onChange: () => void) => {
    const list = window.matchMedia("(prefers-reduced-motion: reduce)");
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  },
  get: () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
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

export function StickyHeader({ config = defaultConfig }: { config?: StickyHeaderConfig }) {
  const [shrunk, setShrunk] = useState(false);
  const [away, setAway] = useState(false);
  const lastY = useRef(0);
  const scroller = useRef<HTMLDivElement | null>(null);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const still = useSyncExternalStore(stillMedia.subscribe, stillMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--sth-accent": config.accentColor,
    "--sth-accent-text": readableAccent(config.accentColor, dark),
    "--sth-on-accent": luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff",
    "--sth-surface": `var(--bc-${dark ? "dark" : "light"}-surface, ${palette.surface})`,
    "--sth-sunk": `var(--bc-${dark ? "dark" : "light"}-sunk, ${palette.sunk})`,
    "--sth-text": `var(--bc-${dark ? "dark" : "light"}-text, ${palette.text})`,
    "--sth-muted": `var(--bc-${dark ? "dark" : "light"}-muted, ${palette.muted})`,
    "--sth-line": `var(--bc-${dark ? "dark" : "light"}-line, ${palette.line})`,
  } as CSSProperties;

  useEffect(() => {
    const node = scroller.current;
    if (node === null) return;
    function onScroll() {
      const y = node === null ? 0 : node.scrollTop;
      const previous = lastY.current;
      setShrunk(config.shrink && y > config.threshold);
      // Shrinking the header shortens the content above, and the browser nudges scrollTop by a few
      // pixels to keep the view still. Those nudges arrive as scroll events going the other way, so a
      // header that reads every event as direction pops straight back the moment it shrinks. Only a
      // real move counts, and the last decisive position is what the next one is measured against.
      if (Math.abs(y - previous) < 8) return;
      lastY.current = y;
      // Hiding a header is motion in the way that matters, so under reduced motion it stays put.
      if (!config.hideOnScrollDown || still) {
        setAway(false);
        return;
      }
      setAway(y > config.threshold && y > previous);
    }
    node.addEventListener("scroll", onScroll, { passive: true });
    return () => node.removeEventListener("scroll", onScroll);
  }, [config.shrink, config.hideOnScrollDown, config.threshold, still]);

  const sections = Array.from({ length: Math.max(config.demoSections, 1) }, (_, index) => index + 1);

  return (
    <div style={style} className="bg-(--sth-surface) text-(--sth-text)">
      <div
        ref={scroller}
        data-scroller
        // scroll-padding-top keeps a heading jumped to from landing underneath the header.
        className="relative h-96 overflow-y-auto scroll-pt-28 rounded-[var(--bc-radius-sm,0.375rem)] border border-(--sth-line)"
      >
        <header
          data-shrunk={shrunk ? "true" : undefined}
          data-away={away ? "true" : undefined}
          // Focus anywhere inside brings it back: a keyboard moving up the page must not chase a
          // header that has hidden itself.
          onFocus={() => setAway(false)}
          className={`sticky top-0 z-20 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-(--sth-line) bg-(--sth-surface) px-4 ${
            still ? "" : "transition-[padding,transform] duration-200"
          } ${shrunk ? "py-2" : "py-4"} ${away ? "-translate-y-full" : "translate-y-0"}`}
        >
          <p className={`m-0 font-semibold ${shrunk ? "text-base" : "text-xl"}`}>{config.title}</p>
          <nav aria-label="Sections" className="order-3 w-full sm:order-none sm:w-auto">
            <ul className="flex list-none flex-wrap gap-x-4 p-0 text-sm">
              {config.links.map((link, index) => (
                <li key={link.label}>
                  {/* Real fragment links, so the scroll padding above has something to prove itself on. */}
                  <a
                    href={`#sth-section-${(index % Math.max(config.demoSections, 1)) + 1}`}
                    className="inline-flex min-h-11 items-center text-(--sth-muted) hover:text-(--sth-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--sth-accent-text)"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <button
            type="button"
            className="ml-auto inline-flex min-h-11 items-center rounded-[var(--bc-radius-button,0.375rem)] bg-(--sth-accent) px-4 text-sm font-medium text-(--sth-on-accent) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--sth-accent-text)"
          >
            {config.actionLabel}
          </button>
        </header>

        {/* Something to scroll. In your own page this is the page. */}
        <div className="grid gap-8 p-4">
          {sections.map((section) => (
            <section key={section} aria-labelledby={`sth-section-${section}`}>
              <h2 id={`sth-section-${section}`} tabIndex={-1} className="text-lg font-semibold">
                Section {section}
              </h2>
              <p className="mt-1 text-(--sth-muted)">
                Scroll down and the header shrinks; keep going and it steps out of the way. Tab back up and it
                returns before the focus reaches it.
              </p>
              <div aria-hidden="true" className="mt-3 h-28 rounded-[var(--bc-radius-sm,0.375rem)] bg-(--sth-sunk)" />
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
