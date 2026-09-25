import { escapeHtml, htmlPage } from "@/lib/html";
import type { ColorPickerConfig } from "../react/color-picker";

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", muted: "#4d4a57", border: "#737373", line: "#d9d5e4" },
  dark: { surface: "#141019", text: "#f6f5fa", muted: "#b6b3c2", border: "#8e8a99", line: "#3a3448" },
};

const isHex = (value: string) => /^#[0-9a-f]{6}$/i.test(value.trim());

export function renderColorPickerMarkup(config: ColorPickerConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = Object.entries(palette).map(([key, value]) => `--cp-${key}: ${value}`).join("; ");
  const swatches = config.swatches.filter((swatch) => swatch.name.trim() !== "" && isHex(swatch.hex));
  const start = isHex(config.startHex) ? config.startHex.toLowerCase() : (swatches[0]?.hex.toLowerCase() ?? "#2563eb");
  const named = swatches.find((swatch) => swatch.hex.toLowerCase() === start);

  const items = swatches
    .map((swatch) => {
      const hex = swatch.hex.toLowerCase();
      return `          <label class="cp-swatch">
            <input class="cp-input" type="radio" name="colour-swatch" value="${hex}" data-name="${escapeHtml(swatch.name)}"${hex === start ? " checked" : ""}>
            <span class="cp-sr">${escapeHtml(swatch.name)}</span>
            <span class="cp-dot" aria-hidden="true" style="background-color: ${hex}"></span>
          </label>`;
    })
    .join("\n");

  return `    <div class="cp cp--theme-${config.theme}" style="${vars}" data-color-picker>
      <fieldset class="cp-fieldset">
        <legend class="cp-legend">${escapeHtml(config.label)}</legend>
        <div class="cp-swatches">
${items}
        </div>
      </fieldset>
${
    config.allowCustom
      ? `      <p class="cp-custom">
        <label class="cp-custom-label" for="colour-custom">Any other colour</label>
        <input class="cp-custom-input" id="colour-custom" type="color" value="${start}" data-custom>
      </p>\n`
      : ""
  }${config.showHex ? `      <p class="cp-chosen">Chosen: <span class="cp-hex" data-hex>${start}</span><span class="cp-name" data-name>${named ? ` · ${escapeHtml(named.name)}` : ""}</span></p>\n` : ""}      <p class="cp-sr" role="status" data-status></p>
${config.name ? `      <input type="hidden" name="${escapeHtml(config.name)}" value="${start}" data-value>\n` : ""}    </div>`;
}

export function renderColorPickerHtml(config: ColorPickerConfig) {
  return htmlPage({ title: "Colour picker", slug: "color-picker", body: renderColorPickerMarkup(config), script: true });
}
