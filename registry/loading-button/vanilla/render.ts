import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { LoadingButtonConfig } from "../react/loading-button";

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6", error: "#b42318" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459", error: "#ff9d95" },
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

export function renderLoadingButtonMarkup(config: LoadingButtonConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--lbn-accent: ${config.accentColor}`,
    `--lbn-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--lbn-on-accent: ${luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff"}`,
    ...Object.entries(palette).map(([key, value]) => `--lbn-${key}: ${value}`),
  ].join("; ");

  // The widest label sets the width, so the button does not jump as the words change.
  const widest = Math.max(config.idleLabel.length, config.busyLabel.length, config.retryLabel.length);
  const spinner = config.showSpinner
    ? `<svg class="lbn-spinner" viewBox="0 0 16 16" aria-hidden="true" hidden data-spinner><circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="2" opacity="0.35"></circle><path d="M8 1.5a6.5 6.5 0 0 1 6.5 6.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path></svg>`
    : "";

  return `    <div class="lbn lbn--theme-${config.theme}${config.fullWidth ? " lbn--wide" : ""}" style="${vars}" data-loading-button>
      <button class="lbn-button" type="button" style="min-width: ${(widest * 0.62 + 3).toFixed(2)}rem" data-phase="idle" data-button>
        ${spinner}<span data-label>${escapeHtml(config.idleLabel)}</span>
      </button>

      <!-- The outcome is words in a polite region: a button that has stopped spinning is not a message. -->
      <p class="lbn-outcome" role="status" data-outcome="idle"></p>
    </div>`;
}

export function renderLoadingButtonHtml(config: LoadingButtonConfig) {
  return htmlPage({ title: "Loading button", slug: "loading-button", body: renderLoadingButtonMarkup(config), script: true });
}
