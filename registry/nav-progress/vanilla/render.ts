import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { NavProgressConfig } from "../react/nav-progress";

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

export function renderNavProgressMarkup(config: NavProgressConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--np-accent: ${config.accentColor}`,
    `--np-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...Object.entries(palette).map(([key, value]) => `--np-${key}: ${value}`),
  ].join("; ");

  return `    <div class="np np--theme-${config.theme} np--${config.position}" style="${vars}" data-nav-progress>
      ${config.showBar ? `<div class="np-track" style="height: ${config.thickness}px" aria-hidden="true" hidden data-track></div>` : ""}

      <div class="np-body">
        <button class="np-trigger" type="button" aria-describedby="np-state" data-trigger>${escapeHtml(config.triggerLabel)}</button>

        <!--
          The announcement is the accessible part of a navigation indicator. A route change gives a
          screen reader nothing by itself, which is why the words matter more than the bar.
        -->
        <p class="np-state" id="np-state" role="status" data-phase="idle" data-state></p>

        <div class="np-skeleton" aria-hidden="true"><span></span><span></span><span></span></div>
      </div>
    </div>`;
}

export function renderNavProgressHtml(config: NavProgressConfig) {
  return htmlPage({ title: "Navigation progress", slug: "nav-progress", body: renderNavProgressMarkup(config), script: true });
}
