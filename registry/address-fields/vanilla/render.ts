import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { AddressFieldsConfig } from "../react/address-fields";

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

export function renderAddressFieldsMarkup(config: AddressFieldsConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--af-accent: ${config.accentColor}`,
    `--af-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...Object.entries(palette).map(([key, value]) => `--af-${key}: ${value}`),
  ].join("; ");

  const first = config.countries[0];
  const required = config.requireCore ? " required" : "";
  const options = config.countries
    .map((item) => `<option value="${escapeHtml(item.code)}">${escapeHtml(item.name)}</option>`)
    .join("");

  // Every field carries the autocomplete token for its own purpose, which is what lets a browser fill
  // the block in one go (WCAG 1.3.5).
  const countryBlock = `          <div>
            <label class="af-label" for="af-country">${escapeHtml(config.countryLabel)}</label>
            <select class="af-select" id="af-country" name="${escapeHtml(config.name)}Country" autocomplete="country" data-country>${options}</select>
          </div>`;

  return `    <div class="af af--theme-${config.theme}" style="${vars}" data-address-fields>
      <fieldset class="af-set">
        <legend class="af-legend">${escapeHtml(config.legend)}</legend>
        ${config.hint.trim() === "" ? "" : `<p class="af-hint">${escapeHtml(config.hint)}</p>`}

        <div class="af-grid">
${config.countryFirst ? countryBlock : ""}
          <div>
            <label class="af-label" for="af-line1">${escapeHtml(config.line1Label)}</label>
            <input class="af-input" id="af-line1" name="${escapeHtml(config.name)}Line1" type="text" autocomplete="address-line1"${required}>
          </div>
${
  config.showLine2
    ? `          <div>
            <label class="af-label" for="af-line2">${escapeHtml(config.line2Label)} <span class="af-optional">(optional)</span></label>
            <input class="af-input" id="af-line2" name="${escapeHtml(config.name)}Line2" type="text" autocomplete="address-line2">
          </div>`
    : ""
}
          <div>
            <label class="af-label" for="af-city">${escapeHtml(config.cityLabel)}</label>
            <input class="af-input" id="af-city" name="${escapeHtml(config.name)}City" type="text" autocomplete="address-level2"${required}>
          </div>

          <div data-region-row${first && first.regionLabel.trim() !== "" ? "" : " hidden"}>
            <label class="af-label" for="af-region" data-region-label>${escapeHtml(first ? first.regionLabel : "")}</label>
            <input class="af-input" id="af-region" name="${escapeHtml(config.name)}Region" type="text" autocomplete="address-level1">
          </div>

          <div class="af-short">
            <label class="af-label" for="af-postcode" data-postcode-label>${escapeHtml(first ? first.postcodeLabel : "Postcode")}</label>
            <input class="af-input af-postcode" id="af-postcode" name="${escapeHtml(config.name)}Postcode" type="text" autocomplete="postal-code" inputmode="text"${required}>
          </div>
${config.countryFirst ? "" : countryBlock}
        </div>

        <p class="af-status" role="status" data-status></p>
      </fieldset>
    </div>`;
}

export function renderAddressFieldsHtml(config: AddressFieldsConfig) {
  return htmlPage({ title: "Address fields", slug: "address-fields", body: renderAddressFieldsMarkup(config), script: true });
}
