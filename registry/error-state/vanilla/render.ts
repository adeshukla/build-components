import { escapeHtml, htmlPage, luminance, themedColour } from "@/lib/html";
import type { ErrorStateConfig } from "../react/error-state";

const palettes = {
  light: { surface: "#ffffff", sunk: "#fdf2f1", text: "#16121f", muted: "#4d4a57", line: "#e6b9b4" },
  dark: { surface: "#141019", sunk: "#2a1b1d", text: "#f6f5fa", muted: "#c5b8b8", line: "#6b3a38" },
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

export function renderErrorStateMarkup(config: ErrorStateConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--est-accent: ${config.accentColor}`,
    `--est-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--est-on-accent: ${luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff"}`,
    ...(config.theme === "system" ? [] : Object.entries(palette).map(([key, value]) => `--est-${key}: ${themedColour(key, value, dark)}`)),
  ].join("; ");

  const details = config.showDetails
    ? `              <details class="est-details">
                <summary class="est-summary">${escapeHtml(config.detailsLabel)}</summary>
                <p class="est-detail-text">${escapeHtml(config.detailsText)}</p>
              </details>`
    : "";

  return `    <div class="est est--theme-${config.theme}" style="${vars}" data-error-state>
      <button class="est-trigger" type="button" data-trigger>${escapeHtml(config.triggerLabel)}</button>

      <!--
        A focusable region with a heading, not role="alert": an alert reads the whole panel over whatever
        else is happening, and gives no way to get back to it afterwards.
      -->
      <div class="est-panel" tabindex="-1" role="group" aria-labelledby="est-heading" hidden data-panel>
        <div class="est-inner">
          <svg class="est-mark" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 1.5 20.5h21L12 2Zm0 5.5 1 7h-2l1-7Zm0 9.25a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3Z"></path></svg>
          <div>
            <${config.headingLevel} class="est-heading" id="est-heading">${escapeHtml(config.heading)}</${config.headingLevel}>
            <!-- What happened, then what to do about it. A heading alone leaves nobody anywhere to go. -->
            <p class="est-message">${escapeHtml(config.message)}</p>
            <p class="est-advice">${escapeHtml(config.advice)}</p>

            <div class="est-actions">
              <button class="est-retry" type="button" data-retry>${escapeHtml(config.retryLabel)}</button>
            </div>

${details}
          </div>
        </div>
      </div>

      <p class="est-status" role="status" data-status></p>
    </div>`;
}

export function renderErrorStateHtml(config: ErrorStateConfig) {
  return htmlPage({ title: "Error state", slug: "error-state", body: renderErrorStateMarkup(config), script: true });
}
