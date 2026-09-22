import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { CardFieldsConfig } from "../react/card-fields";

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", muted: "#4d4a57", border: "#737373", error: "#b3261e", success: "#146c2e" },
  dark: { surface: "#141019", text: "#f6f5fa", muted: "#b6b3c2", border: "#8e8a99", error: "#ff6b6b", success: "#6fdc8c" },
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

type Field = { key: string; label: string; hint?: string; autocomplete: string; numeric: boolean; half?: boolean };

/** The fields ship in the HTML with the right autocomplete values; the script formats and checks. */
export function renderCardFieldsMarkup(config: CardFieldsConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--cf-accent: ${config.accentColor}`,
    `--cf-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--cf-on-accent: ${luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff"}`,
    ...Object.entries(palette).map(([key, value]) => `--cf-${key}: ${value}`),
  ].join("; ");
  const fields: Field[] = [
    ...(config.showName ? [{ key: "name", label: "Name on card", autocomplete: "cc-name", numeric: false }] : []),
    { key: "number", label: "Card number", autocomplete: "cc-number", numeric: true },
    { key: "expiry", label: "Expiry date", hint: "MM/YY", autocomplete: "cc-exp", numeric: true, half: true },
    { key: "cvc", label: "Security code", hint: "3 digits on the back", autocomplete: "cc-csc", numeric: true, half: true },
    ...(config.showPostcode ? [{ key: "postcode", label: "Postcode", autocomplete: "postal-code", numeric: false }] : []),
  ];

  const inputs = fields
    .map((field) => {
      const hint = field.hint ? `\n          <p class="cf-hint" id="card-${field.key}-hint" data-hint>${field.hint}</p>` : "";
      const describedBy = field.hint ? ` aria-describedby="card-${field.key}-hint"` : "";
      const brand = field.key === "number" ? `\n            <span class="cf-brand" id="card-brand" data-brand></span>` : "";
      return `        <div class="cf-field${field.half ? " cf-field--half" : ""}" data-field="${field.key}">
          <label class="cf-label" for="card-${field.key}">${field.label}</label>${hint}
          <div class="cf-control">
            <input class="cf-input" id="card-${field.key}" name="${field.key}" type="text" autocomplete="${field.autocomplete}"${field.numeric ? ' inputmode="numeric"' : ""} spellcheck="false"${describedBy}>${brand}
          </div>
          <p class="cf-error" id="card-${field.key}-error" hidden></p>
        </div>`;
    })
    .join("\n");

  return `    <form class="cf cf--theme-${config.theme}" style="${vars}" novalidate data-card-fields>
      <fieldset class="cf-fieldset">
        <legend class="cf-title">${escapeHtml(config.title)}</legend>
        <div class="cf-grid">
${inputs}
        </div>
      </fieldset>
      <button class="cf-pay" type="submit">${escapeHtml(config.buttonText)} ${escapeHtml(config.amount)}</button>
      <p class="cf-done" role="status" data-done></p>
    </form>`;
}

export function renderCardFieldsHtml(config: CardFieldsConfig) {
  return htmlPage({ title: "Card payment fields", slug: "card-fields", body: renderCardFieldsMarkup(config), script: true });
}
