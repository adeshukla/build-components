import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { VideoEmbedConfig } from "../react/video-embed";

const palettes = {
  light: { surface: "#ffffff", sunk: "#1b1624", "on-sunk": "#f6f5fa", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#141019", sunk: "#0f0c14", "on-sunk": "#f6f5fa", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
};

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

/** Only http(s) and same-site paths are let through, the same rule the React output uses. */
function safeUrl(value: string) {
  if (value.startsWith("/")) return value;
  try {
    const url = new URL(value, "https://example.com");
    return url.protocol === "http:" || url.protocol === "https:" ? value : "";
  } catch {
    return "";
  }
}

export function renderVideoEmbedMarkup(config: VideoEmbedConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--vid-accent: ${config.accentColor}`,
    `--vid-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--vid-on-accent: ${luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff"}`,
    ...Object.entries(palette).map(([key, value]) => `--vid-${key}: ${value}`),
  ].join("; ");

  const watch = safeUrl(config.watchUrl);
  const poster = safeUrl(config.posterSrc);
  const name = `${config.playLabel}: ${config.title}${config.durationText === "" ? "" : `, ${config.durationText}`}`;
  const dot = '<span aria-hidden="true">·</span>';

  return `    <div class="vid vid--theme-${config.theme} vid--${config.aspect}" style="${vars}" data-video-embed>
      <figure class="vid-figure">
        <div class="vid-frame" data-frame>
          ${
            poster === ""
              ? '<div class="vid-poster" aria-hidden="true" data-poster></div>'
              : // The poster is decoration: the button beside it already carries the video's name.
                `<img class="vid-poster" src="${escapeHtml(poster)}" alt="" loading="lazy" decoding="async" data-poster>`
          }

          <!--
            A real button, named with the video. "Play" on its own is what a screen reader would otherwise
            read out on a page with four videos on it.
          -->
          <button class="vid-play" type="button" aria-label="${escapeHtml(name)}" data-play>
            <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l12 7-12 7V5Z"></path></svg></span>
          </button>

          <!-- Nothing to load. It says so rather than showing an empty black box. -->
          <p class="vid-todo" hidden data-todo>[TODO: set embedUrl to your video's embed address]</p>
        </div>

        <figcaption class="vid-caption">
          <p class="vid-title">${escapeHtml(config.title)}</p>
          <p class="vid-meta">
            ${config.durationText === "" ? "" : `<span>${escapeHtml(config.durationText)}</span>`}
            ${config.durationText !== "" && watch !== "" ? dot : ""}
            <!-- A direct link as well, so the video is reachable even where the frame is blocked. -->
            ${watch === "" ? "" : `<a class="vid-watch" href="${escapeHtml(watch)}">Watch on ${escapeHtml(config.providerName)}</a>`}
          </p>
          ${config.privacyNote === "" ? "" : `<p class="vid-note" data-note>${escapeHtml(config.privacyNote)}</p>`}
        </figcaption>
      </figure>
    </div>`;
}

export function renderVideoEmbedHtml(config: VideoEmbedConfig) {
  return htmlPage({ title: "Click-to-load video", slug: "video-embed", body: renderVideoEmbedMarkup(config), script: true });
}
