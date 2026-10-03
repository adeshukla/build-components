import { escapeHtml, htmlPage, luminance, themedColour } from "@/lib/html";
import type { PinPadConfig } from "../react/pin-pad";

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

/** The pad's own order, the same two layouts the React output offers. */
const rows = (layout: "phone" | "calculator") =>
  layout === "phone" ? ["1", "2", "3", "4", "5", "6", "7", "8", "9"] : ["7", "8", "9", "4", "5", "6", "1", "2", "3"];

export function renderPinPadMarkup(config: PinPadConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--pp-accent: ${config.accentColor}`,
    `--pp-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...(config.theme === "system" ? [] : Object.entries(palette).map(([key, value]) => `--pp-${key}: ${themedColour(key, value, dark)}`)),
  ].join("; ");

  const dots = Array.from({ length: config.length }, () => '<span class="pp-dot" data-dot></span>').join("");
  const digits = rows(config.layout)
    .map((digit) => `<button class="pp-key" type="button" data-digit="${digit}">${digit}</button>`)
    .join("\n          ");

  return `    <div class="pp pp--theme-${config.theme}" style="${vars}" data-pin-pad>
      <div role="group" aria-labelledby="pp-legend"${config.hint.trim() === "" ? "" : ' aria-describedby="pp-hint"'}>
        <p class="pp-legend" id="pp-legend">${escapeHtml(config.legend)}</p>
        ${config.hint.trim() === "" ? "" : `<p class="pp-hint" id="pp-hint">${escapeHtml(config.hint)}</p>`}

        <!-- A picture of how many digits are in. What is announced is the count, never the PIN. -->
        <div class="pp-dots" aria-hidden="true">${dots}</div>

        <input type="hidden" name="${escapeHtml(config.name)}" value="" data-value>

        <div class="pp-grid">
          ${digits}
          ${config.showClear ? `<button class="pp-key pp-key--word" type="button" data-clear>${escapeHtml(config.clearLabel)}</button>` : "<span></span>"}
          <button class="pp-key" type="button" data-digit="0">0</button>
          <button class="pp-key pp-key--word" type="button" aria-label="${escapeHtml(config.deleteLabel)}" data-delete><span aria-hidden="true">⌫</span></button>
        </div>

        <p class="pp-status" role="status" data-status></p>
      </div>
    </div>`;
}

export function renderPinPadHtml(config: PinPadConfig) {
  return htmlPage({ title: "PIN pad", slug: "pin-pad", body: renderPinPadMarkup(config), script: true });
}
