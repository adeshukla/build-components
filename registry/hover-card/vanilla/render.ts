import { escapeHtml, htmlPage, luminance, safeHref } from "@/lib/html";
import type { HoverCardConfig } from "../react/hover-card";

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#1b1624", sunk: "#272031", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
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

export function renderHoverCardMarkup(config: HoverCardConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--hc-accent: ${config.accentColor}`,
    `--hc-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...Object.entries(palette).map(([key, value]) => `--hc-${key}: ${value}`),
  ].join("; ");

  return `    <div class="hc hc--theme-${config.theme} hc--${config.placement}" style="${vars}" data-hover-card>
      <p class="hc-text">${escapeHtml(config.beforeText)}<span class="hc-holder" data-holder>
        <!--
          A real link, so the card is an extra rather than the only way to the information. Nothing
          inside the card is interactive: a tooltip must not hold controls, and a preview that needs its
          own buttons is a popover, not a hover card.
        -->
        <a class="hc-trigger" href="${safeHref(config.linkHref)}" data-trigger>${escapeHtml(config.triggerText)}</a>

        <span class="hc-card" id="hc-card" role="tooltip" hidden data-card>
          <span class="hc-card-title">${escapeHtml(config.cardTitle)}</span>
          <span class="hc-card-meta">${escapeHtml(config.cardMeta)}</span>
          <span class="hc-card-body">${escapeHtml(config.cardBody)}</span>
        </span>
      </span>${escapeHtml(config.afterText)}</p>
    </div>`;
}

export function renderHoverCardHtml(config: HoverCardConfig) {
  return htmlPage({ title: "Hover card", slug: "hover-card", body: renderHoverCardMarkup(config), script: true });
}
