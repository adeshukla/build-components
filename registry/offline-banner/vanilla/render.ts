import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { OfflineBannerConfig } from "../react/offline-banner";

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

export function renderOfflineBannerMarkup(config: OfflineBannerConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--ob-accent: ${config.accentColor}`,
    `--ob-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--ob-on-accent: ${luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff"}`,
    ...Object.entries(palette).map(([key, value]) => `--ob-${key}: ${value}`),
  ].join("; ");

  const retry = config.showRetry
    ? `\n          <button class="ob-retry" type="button" data-retry>${escapeHtml(config.retryText)}</button>`
    : "";

  return `    <div class="ob ob--theme-${config.theme} ob--${config.position}" style="${vars}" data-offline-banner>
      <!-- Polite, not an alert: losing the connection is worth saying, not worth cutting someone off for. -->
      <div class="ob-region" role="status">
        <div class="ob-offline" hidden data-offline>
          <span>${escapeHtml(config.offlineText)}</span>${retry}
        </div>
        <div class="ob-online" hidden data-online>${escapeHtml(config.onlineText)}</div>
      </div>
${
  config.demoToggle
    ? `      <div class="ob-demo">
        <!-- For trying it out: the real thing runs off the browser's online and offline events. -->
        <button class="ob-toggle" type="button" data-toggle>Pretend to go offline</button>
      </div>\n`
    : ""
}      <p class="ob-note" role="status" data-note></p>
    </div>`;
}

export function renderOfflineBannerHtml(config: OfflineBannerConfig) {
  return htmlPage({ title: "Offline banner", slug: "offline-banner", body: renderOfflineBannerMarkup(config), script: true });
}
