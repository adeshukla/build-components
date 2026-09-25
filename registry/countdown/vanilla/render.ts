import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { CountdownConfig } from "../react/countdown";

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

export function renderCountdownMarkup(config: CountdownConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--cn-accent: ${config.accentColor}`,
    `--cn-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...Object.entries(palette).map(([key, value]) => `--cn-${key}: ${value}`),
  ].join("; ");

  const units = ["days", "hours", "minutes", ...(config.showSeconds ? ["seconds"] : [])];
  const boxes = units
    .map(
      (name) => `        <li class="cn-box">
          <span class="cn-value" data-unit="${name}">0</span>
          <span class="cn-unit">${name}</span>
        </li>`,
    )
    .join("\n");

  return `    <div class="cn cn--theme-${config.theme}" style="${vars}" data-countdown data-target="${escapeHtml(config.target)}" data-finished="${escapeHtml(config.finishedText)}">
      <p class="cn-label">${escapeHtml(config.label)}</p>

      <!-- The time left is worked out in the browser: a server-rendered clock would already be wrong. -->
      <p class="cn-waiting" data-waiting>Working out the time left…</p>
      <ol class="cn-boxes" aria-hidden="true" hidden data-boxes>
${boxes}
      </ol>
      <p class="cn-done" hidden data-done>${escapeHtml(config.finishedText)}</p>

      <p class="cn-status" role="status" data-status></p>
    </div>`;
}

export function renderCountdownHtml(config: CountdownConfig) {
  return htmlPage({ title: "Countdown", slug: "countdown", body: renderCountdownMarkup(config), script: true });
}
