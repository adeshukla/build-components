import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { TimelineConfig } from "../react/timeline";

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
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

export function renderTimelineMarkup(config: TimelineConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--tl-accent: ${config.accentColor}`,
    `--tl-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...Object.entries(palette).map(([key, value]) => `--tl-${key}: ${value}`),
  ].join("; ");

  const entries = config.entries.filter((entry) => entry.what.trim() !== "");
  const ordered = config.newestFirst ? entries : [...entries].reverse();
  const limit = Math.max(1, config.initialCount);
  const hidden = Math.max(0, ordered.length - limit);

  const items = ordered
    .map(
      (entry, index) => `        <li class="tl-entry"${index >= limit ? " hidden" : ""} data-entry>
          <span class="tl-rail" aria-hidden="true"><span class="tl-dot"></span><span class="tl-thread"></span></span>
          <div class="tl-body">
            <p class="tl-what"><span class="tl-who">${escapeHtml(entry.who)}</span> ${escapeHtml(entry.what)}</p>
            <!-- A real time element: the readable text stays, and the machine-readable stamp goes in the attribute. -->
            <time class="tl-when" datetime="${escapeHtml(entry.datetime)}">${escapeHtml(entry.when)}</time>
          </div>
        </li>`,
    )
    .join("\n");

  return `    <div class="tl tl--theme-${config.theme}" style="${vars}" data-timeline data-total="${ordered.length}">
      <h2 class="tl-heading">${escapeHtml(config.heading)}</h2>
      <ol class="tl-list">
${items}
      </ol>
      <button class="tl-more" type="button"${hidden > 0 ? "" : " hidden"} data-more>${escapeHtml(config.moreText)} (${hidden})</button>
      <!-- The list grew below the button that grew it: say how much arrived. -->
      <p class="tl-status" role="status" data-status></p>
    </div>`;
}

export function renderTimelineHtml(config: TimelineConfig) {
  return htmlPage({ title: "Activity timeline", slug: "timeline", body: renderTimelineMarkup(config), script: true });
}
