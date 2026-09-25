import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { QuantityConfig } from "../react/quantity";

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", muted: "#4d4a57", border: "#737373", hover: "#eeecf5" },
  dark: { surface: "#141019", text: "#f6f5fa", muted: "#b6b3c2", border: "#8e8a99", hover: "#2a2438" },
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

export function renderQuantityMarkup(config: QuantityConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--qt-accent: ${config.accentColor}`,
    `--qt-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...Object.entries(palette).map(([key, value]) => `--qt-${key}: ${value}`),
  ].join("; ");
  const min = config.min;
  const max = Math.max(min, config.max);
  const step = Math.max(1, config.step);
  const value = Math.min(max, Math.max(min, config.start));
  const unit = config.unit.trim();
  const hint = config.hint.trim();
  const noun = config.label.toLowerCase();

  return `    <div class="qt qt--theme-${config.theme}" style="${vars}" data-quantity data-unit="${escapeHtml(unit)}">
      <label class="qt-label" for="quantity-input">${escapeHtml(config.label)}${unit ? ` <span class="qt-unit">(${escapeHtml(unit)})</span>` : ""}</label>
${hint ? `      <p class="qt-hint" id="quantity-hint">${escapeHtml(hint)}</p>\n` : ""}      <div class="qt-group">
        <button class="qt-step" type="button" aria-label="Fewer ${escapeHtml(noun)}"${value <= min ? ' aria-disabled="true"' : ""} data-less>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/></svg>
        </button>
        <input class="qt-input" id="quantity-input" type="number" inputmode="numeric"${config.name ? ` name="${escapeHtml(config.name)}"` : ""} value="${value}" min="${min}" max="${max}" step="${step}"${hint ? ' aria-describedby="quantity-hint"' : ""} data-input>
        <button class="qt-step" type="button" aria-label="More ${escapeHtml(noun)}"${value >= max ? ' aria-disabled="true"' : ""} data-more>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>
      <p class="qt-sr" role="status" data-status></p>
    </div>`;
}

export function renderQuantityHtml(config: QuantityConfig) {
  return htmlPage({ title: "Quantity stepper", slug: "quantity", body: renderQuantityMarkup(config), script: true });
}
