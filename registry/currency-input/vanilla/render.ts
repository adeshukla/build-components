import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { CurrencyInputConfig } from "../react/currency-input";

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", muted: "#4d4a57", border: "#737373", error: "#b3261e" },
  dark: { surface: "#141019", text: "#f6f5fa", muted: "#b6b3c2", border: "#8e8a99", error: "#ff6b6b" },
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

/** The same two helpers as the React file and the plain JS: money written by hand, not by locale. */
function format(amount: number, decimals: number) {
  const fixed = Math.abs(amount).toFixed(decimals);
  const [whole, part] = fixed.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${amount < 0 ? "-" : ""}${grouped}${part ? `.${part}` : ""}`;
}

function parse(text: string, allowNegative: boolean) {
  const cleaned = text.replace(/[^0-9.-]/g, "");
  const negative = allowNegative && cleaned.trim().startsWith("-");
  const digits = cleaned.replace(/-/g, "");
  if (digits === "" || digits === ".") return null;
  const value = Number(digits);
  return Number.isFinite(value) ? (negative ? -value : value) : null;
}

export function renderCurrencyInputMarkup(config: CurrencyInputConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--ci-accent: ${config.accentColor}`,
    `--ci-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...Object.entries(palette).map(([key, value]) => `--ci-${key}: ${value}`),
  ].join("; ");
  const decimals = Math.max(0, Math.min(4, Math.round(config.decimals)));
  const start = parse(config.start, config.allowNegative);
  const symbol = config.symbol.trim();
  const hint = config.hint.trim();
  const mark = symbol ? `<span class="ci-symbol" aria-hidden="true">${escapeHtml(symbol)}</span>` : "";

  return `    <div class="ci ci--theme-${config.theme}" style="${vars}" data-currency-input data-decimals="${decimals}" data-negative="${config.allowNegative}">
      <label class="ci-label" for="currency-input">${escapeHtml(config.label)}${symbol ? `<span class="ci-sr"> in ${escapeHtml(symbol)}</span>` : ""}</label>
${hint ? `      <p class="ci-hint" id="currency-hint">${escapeHtml(hint)}</p>\n` : ""}      <div class="ci-field">
${!config.symbolAfter && mark ? `        ${mark}\n` : ""}        <input class="ci-input" id="currency-input" type="text" inputmode="decimal" autocomplete="off" value="${start === null ? "" : escapeHtml(format(start, decimals))}"${hint ? ' aria-describedby="currency-hint"' : ""} data-input>
${config.symbolAfter && mark ? `        ${mark}\n` : ""}      </div>
      <p class="ci-error" id="currency-error" role="alert" data-error></p>
${config.name ? `      <input type="hidden" name="${escapeHtml(config.name)}" value="${start === null ? "" : start.toFixed(decimals)}" data-value>\n` : ""}    </div>`;
}

export function renderCurrencyInputHtml(config: CurrencyInputConfig) {
  return htmlPage({ title: "Currency input", slug: "currency-input", body: renderCurrencyInputMarkup(config), script: true });
}
