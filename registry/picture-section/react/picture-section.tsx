"use client";

import { useSyncExternalStore, type CSSProperties } from "react";

export type PictureSectionConfig = {
  imageSrc: string;
  alt: string;
  caption: string;
  shape: "16-9" | "4-3" | "21-9" | "1-1";
  frame: boolean;
  theme: "light" | "dark" | "system";
};

// @config-start
const defaultConfig: PictureSectionConfig = {
  imageSrc: "",
  alt: "The team planning the week around one shared board",
  caption: "",
  shape: "16-9",
  frame: true,
  theme: "light",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", muted: "#4d4a57", line: "#d9d5e4" },
  dark: { surface: "#141019", sunk: "#1c1726", muted: "#b6b3c2", line: "#3a3448" },
};

const shapes = { "16-9": "16 / 9", "4-3": "4 / 3", "21-9": "21 / 9", "1-1": "1 / 1" };

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

/** Only http(s) and same-site paths are let through: a config value must never become a javascript: URL. */
function safeSrc(value: string) {
  if (value === "#") return ""; // what an unsafe address became
  if (value.startsWith("/")) return value;
  try {
    const url = new URL(value, "https://example.com");
    return url.protocol === "http:" || url.protocol === "https:" ? value : "";
  } catch {
    return "";
  }
}

export function PictureSection({ config = defaultConfig }: { config?: PictureSectionConfig }) {
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const picture = safeSrc(config.imageSrc);
  const style = {
    "--pc-surface": `var(--bc-${dark ? "dark" : "light"}-surface, ${palette.surface})`,
    "--pc-sunk": `var(--bc-${dark ? "dark" : "light"}-sunk, ${palette.sunk})`,
    "--pc-muted": `var(--bc-${dark ? "dark" : "light"}-muted, ${palette.muted})`,
    "--pc-line": `var(--bc-${dark ? "dark" : "light"}-line, ${palette.line})`,
  } as CSSProperties;
  const shape = { aspectRatio: shapes[config.shape] };
  const box = `block w-full ${config.frame ? "rounded-[var(--bc-radius-lg,0.75rem)] border border-(--pc-line)" : ""}`;

  return (
    <figure style={style} className="m-0 bg-(--pc-surface)">
      {picture ? (
        // eslint-disable-next-line @next/next/no-img-element -- a plain file: it must work in any React project
        <img src={picture} alt={config.alt} style={shape} className={`${box} object-cover`} />
      ) : (
        // A place for a picture, drawn rather than loaded: the exported file carries no image of ours.
        <div
          role="img"
          aria-label={config.alt || "Picture to come"}
          style={shape}
          className={`${box} bg-(--pc-sunk) bg-[repeating-linear-gradient(135deg,transparent_0_18px,rgb(0_0_0/0.04)_18px_36px)]`}
        />
      )}
      {config.caption.trim() !== "" && <figcaption className="mt-3 text-sm text-(--pc-muted)">{config.caption}</figcaption>}
    </figure>
  );
}
