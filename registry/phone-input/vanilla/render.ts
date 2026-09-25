import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { PhoneInputConfig } from "../react/phone-input";

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", border: "#737373", error: "#b3261e" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", border: "#8e8a99", error: "#ff6b6b" },
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

export function renderPhoneInputMarkup(config: PhoneInputConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--ph-accent: ${config.accentColor}`,
    `--ph-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...Object.entries(palette).map(([key, value]) => `--ph-${key}: ${value}`),
  ].join("; ");
  const countries = config.countries.filter((country) => country.name.trim() !== "" && country.dial.trim() !== "");
  const startName = countries.some((country) => country.name === config.startCountry) ? config.startCountry : countries[0]?.name;
  const hint = config.hint.trim();

  const options = countries
    .map(
      (country) => `          <option value="${escapeHtml(country.name)}" data-dial="${escapeHtml(country.dial)}" data-groups="${escapeHtml(country.groups)}"${country.name === startName ? " selected" : ""}>${escapeHtml(country.name)} (${escapeHtml(country.dial)})</option>`,
    )
    .join("\n");

  return `    <div class="ph ph--theme-${config.theme}" style="${vars}" data-phone-input>
      <label class="ph-label" for="phone-number">${escapeHtml(config.label)}</label>
${hint ? `      <p class="ph-hint" id="phone-hint">${escapeHtml(hint)}</p>\n` : ""}      <div class="ph-field">
        <select class="ph-country" aria-label="Country code" data-country>
${options}
        </select>
        <input class="ph-number" id="phone-number" type="tel" inputmode="tel" autocomplete="tel-national"${hint ? ' aria-describedby="phone-hint"' : ""} data-number>
      </div>
      <p class="ph-error" id="phone-error" role="alert" data-error></p>
${config.name ? `      <input type="hidden" name="${escapeHtml(config.name)}" data-value>\n` : ""}    </div>`;
}

export function renderPhoneInputHtml(config: PhoneInputConfig) {
  return htmlPage({ title: "Phone input", slug: "phone-input", body: renderPhoneInputMarkup(config), script: true });
}
