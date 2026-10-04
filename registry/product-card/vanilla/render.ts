import { escapeHtml, htmlPage, luminance, themedColour } from "@/lib/html";
import type { ProductCardConfig } from "../react/product-card";

/** Words with something put in them: "{count} left" (D94). */
const fill = (words: string, values: Record<string, string | number>) => words.replace(/\{(\w+)\}/g, (match, name) => String(values[name] ?? match));

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

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export function renderProductCardMarkup(config: ProductCardConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--pc-accent: ${config.accentColor}`,
    `--pc-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--pc-on-accent: ${luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff"}`,
    ...(config.theme === "system" ? [] : Object.entries(palette).map(([key, value]) => `--pc-${key}: ${themedColour(key, value, dark)}`)),
  ].join("; ");

  const options = config.options.filter((option) => option.label.trim() !== "");
  const groups = [...new Set(options.map((option) => option.group))];

  const fieldsets = groups
    .map((group) => {
      const inputs = options
        .filter((option) => option.group === group)
        .map((option) => {
          const out = option.stock === "out";
          return `          <label class="pc-option"><input class="pc-sr" type="radio" name="pc-${slug(group)}" value="${escapeHtml(option.label)}"${out ? " disabled" : ""} data-option data-group="${escapeHtml(group)}">${escapeHtml(option.label)}${out ? `<span class="pc-out">${escapeHtml(config.outText)}</span>` : ""}</label>`;
        })
        .join("\n");
      return `      <fieldset class="pc-group">
        <legend class="pc-legend">${escapeHtml(group)}</legend>
        <div class="pc-options">
${inputs}
        </div>
      </fieldset>`;
    })
    .join("\n");

  const needed = groups.join(` ${config.andText} `).toLowerCase();

  return `    <div class="pc pc--theme-${config.theme}" style="${vars}" data-product-card data-pick="${escapeHtml(config.pickText)}" data-and="${escapeHtml(config.andText)}" data-added="${escapeHtml(config.addedText)}" data-name="${escapeHtml(config.name)}" data-needed="${escapeHtml(needed)}">
      <h2 class="pc-name">${escapeHtml(config.name)}</h2>
${config.showPrice ? `      <p class="pc-price">${escapeHtml(config.price)}</p>\n` : ""}      <p class="pc-blurb">${escapeHtml(config.blurb)}</p>
${fieldsets}
      <button class="pc-add" type="button" disabled data-add>${escapeHtml(config.addText)}</button>
      <!-- What is still needed, then what happened — the button alone cannot say either. -->
      <p class="pc-status" role="status" data-status>${escapeHtml(fill(config.pickText, { missing: needed }))}</p>
    </div>`;
}

export function renderProductCardHtml(config: ProductCardConfig) {
  return htmlPage({ title: "Product card", slug: "product-card", body: renderProductCardMarkup(config), script: true });
}
