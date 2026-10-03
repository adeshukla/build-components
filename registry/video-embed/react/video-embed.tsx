"use client";

import { useId, useState, useSyncExternalStore, type CSSProperties } from "react";

export type VideoEmbedConfig = {
  title: string;
  embedUrl: string;
  watchUrl: string;
  providerName: string;
  posterSrc: string;
  playLabel: string;
  durationText: string;
  privacyNote: string;
  aspect: "16-9" | "4-3" | "1-1";
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: VideoEmbedConfig = {
  title: "Building an accessible date picker, start to finish",
  embedUrl: "",
  watchUrl: "",
  providerName: "the video host",
  posterSrc: "",
  playLabel: "Play",
  durationText: "24 minutes",
  privacyNote: "Nothing is requested from the video host until you press play.",
  aspect: "16-9",
  theme: "light",
  accentColor: "#b42318",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#1b1624", onSunk: "#f6f5fa", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#141019", sunk: "#0f0c14", onSunk: "#f6f5fa", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
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

const ratios = { "16-9": "16 / 9", "4-3": "4 / 3", "1-1": "1 / 1" };

/** Only http(s) and same-site paths are let through: a config value must never become a javascript: URL. */
export function safeUrl(value: string) {
  if (value.startsWith("/")) return value;
  try {
    const url = new URL(value, "https://example.com");
    return url.protocol === "http:" || url.protocol === "https:" ? value : "";
  } catch {
    return "";
  }
}

/**
 * A YouTube or Vimeo page link (what people copy from the address bar) becomes its embed address, on
 * YouTube's no-cookie host. Anything else is used as given. Ids are checked, so nothing else gets through.
 */
export function toEmbedUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^(www|m)\./, "");
    const id = (candidate: string | null | undefined) => (candidate && /^[\w-]{6,20}$/.test(candidate) ? candidate : "");
    const youtube = (videoId: string) => (videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : value);
    if (host === "youtu.be") return youtube(id(url.pathname.slice(1)));
    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      if (url.searchParams.get("v")) return youtube(id(url.searchParams.get("v")));
      const [, kind, videoId] = url.pathname.split("/");
      if (kind === "shorts" || kind === "live") return youtube(id(videoId));
    }
    if (host === "vimeo.com") {
      const videoId = url.pathname.split("/")[1];
      if (/^\d{4,12}$/.test(videoId)) return `https://player.vimeo.com/video/${videoId}`;
    }
  } catch {
    // Not a full address: used as given, and safeUrl decides.
  }
  return value;
}

export function VideoEmbed({ config = defaultConfig }: { config?: VideoEmbedConfig }) {
  const id = useId();
  const [playing, setPlaying] = useState(false);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--vid-accent": config.accentColor,
    "--vid-accent-text": readableAccent(config.accentColor, dark),
    "--vid-on-accent": luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff",
    "--vid-surface": `var(--bc-${dark ? "dark" : "light"}-surface, ${palette.surface})`,
    "--vid-sunk": `var(--bc-${dark ? "dark" : "light"}-sunk, ${palette.sunk})`,
    "--vid-on-sunk": palette.onSunk,
    "--vid-text": `var(--bc-${dark ? "dark" : "light"}-text, ${palette.text})`,
    "--vid-muted": `var(--bc-${dark ? "dark" : "light"}-muted, ${palette.muted})`,
    "--vid-line": `var(--bc-${dark ? "dark" : "light"}-line, ${palette.line})`,
  } as CSSProperties;

  const embed = safeUrl(toEmbedUrl(config.embedUrl));
  const watch = safeUrl(config.watchUrl);
  const poster = safeUrl(config.posterSrc);

  return (
    <div style={style} className="bg-(--vid-surface) p-1 text-(--vid-text)">
      <figure className="m-0 max-w-2xl">
        <div
          data-frame
          className="relative w-full overflow-hidden rounded-[var(--bc-radius-md,0.5rem)] bg-(--vid-sunk)"
          style={{ aspectRatio: ratios[config.aspect] }}
        >
          {!playing ? (
            <>
              {poster === "" ? (
                <div
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(135deg, color-mix(in oklab, var(--vid-accent) 26%, transparent) 0 16px, transparent 16px 32px)",
                  }}
                />
              ) : (
                // The poster is decoration: the button beside it already carries the video's name.
                // eslint-disable-next-line @next/next/no-img-element -- this file is exported for any project, so it must not depend on next/image.
                <img src={poster} alt="" className="absolute inset-0 size-full object-cover" loading="lazy" decoding="async" />
              )}

              {/*
                A real button, named with the video. "Play" on its own is what a screen reader would
                otherwise read out on a page with four videos on it.
              */}
              <button
                type="button"
                onClick={() => setPlaying(true)}
                aria-label={`${config.playLabel}: ${config.title}${config.durationText === "" ? "" : `, ${config.durationText}`}`}
                data-play
                className="absolute inset-0 grid place-items-center focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-(--vid-on-sunk)"
              >
                <span className="grid size-16 place-items-center rounded-full bg-(--vid-accent) text-(--vid-on-accent) shadow-lg">
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="size-7 fill-current">
                    <path d="M8 5l12 7-12 7V5Z" />
                  </svg>
                </span>
              </button>
            </>
          ) : embed === "" ? (
            // Nothing to load. It says so rather than showing an empty black box.
            <p className="absolute inset-0 grid place-items-center p-4 text-center font-mono text-sm text-(--vid-on-sunk)">
              [TODO: set embedUrl to your video&apos;s embed address]
            </p>
          ) : (
            // The frame is only created once it has been asked for, and it is titled: an untitled frame
            // is announced as "frame" and nothing else.
            <iframe
              src={embed}
              title={config.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              data-frame
              className="absolute inset-0 size-full border-0"
            />
          )}
        </div>

        <figcaption className="mt-3">
          <p className="m-0 font-medium" id={`${id}-title`}>
            {config.title}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-(--vid-muted)">
            {config.durationText !== "" && <span>{config.durationText}</span>}
            {config.durationText !== "" && watch !== "" && <span aria-hidden="true">·</span>}
            {watch !== "" && (
              // A direct link as well, so the video is reachable even where the frame is blocked.
              <a
                href={watch}
                className="text-(--vid-accent-text) underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--vid-accent-text)"
              >
                {`Watch on ${config.providerName}`}
              </a>
            )}
          </p>
          {config.privacyNote !== "" && !playing && (
            <p className="mt-1 text-xs text-(--vid-muted)">{config.privacyNote}</p>
          )}
        </figcaption>
      </figure>
    </div>
  );
}
