"use client";

import { useSyncExternalStore, type CSSProperties } from "react";

export type AnnouncementBarConfig = {
  message: string;
  linkText: string;
  linkHref: string;
  tone: "accent" | "dark" | "subtle";
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: AnnouncementBarConfig = {
  message: "Shared boards are here: plan a week together.",
  linkText: "See what is new",
  linkHref: "/changelog",
  tone: "accent",
  theme: "light",
  accentColor: "#2563eb",
};
// @config-end

const palettes = {
  light: { sunk: "#f4f3f8", text: "#16121f", line: "#d9d5e4" },
  dark: { sunk: "#1c1726", text: "#f6f5fa", line: "#3a3448" },
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

/** Relative, fragment, http(s), mailto and tel links only. */
function safeHref(value: string) {
  return /^(\/|#|https?:\/\/|mailto:|tel:)/i.test(value.trim()) ? value.trim() : "#";
}

export function AnnouncementBar({ config = defaultConfig }: { config?: AnnouncementBarConfig }) {
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  // On the accent, text is black or white, whichever reads; dark is near-black with white text.
  const onAccent = luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff";
  const ground = config.tone === "accent" ? config.accentColor : config.tone === "dark" ? "#16121f" : "var(--ab-sunk)";
  const ink = config.tone === "accent" ? onAccent : config.tone === "dark" ? "#ffffff" : "var(--ab-text)";
  const style = {
    "--ab-sunk": `var(--bc-${dark ? "dark" : "light"}-sunk, ${palette.sunk})`,
    "--ab-text": `var(--bc-${dark ? "dark" : "light"}-text, ${palette.text})`,
    "--ab-line": `var(--bc-${dark ? "dark" : "light"}-line, ${palette.line})`,
    background: ground,
    color: ink,
  } as CSSProperties;

  return (
    // A landmark of its own, so it is named and can be skipped; it sits above the site's header.
    <aside aria-label="Announcement" style={style} className={`px-4 py-2.5 text-center text-sm ${config.tone === "subtle" ? "border-b border-(--ab-line)" : ""}`}>
      <p className="m-0">
        {config.message}
        {config.linkText.trim() !== "" && (
          <>
            {" "}
            <a
              href={safeHref(config.linkHref)}
              className="font-semibold whitespace-nowrap underline underline-offset-4 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
              style={{ color: ink }}
            >
              {config.linkText}
              <span aria-hidden="true"> →</span>
            </a>
          </>
        )}
      </p>
    </aside>
  );
}
