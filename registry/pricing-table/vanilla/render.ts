import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { PricingTableConfig } from "../react/pricing-table";

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

/** "1 project; 5 GB" becomes two lines. Semicolons keep commas usable inside a feature. */
const featureList = (value: string) =>
  value
    .split(";")
    .map((feature) => feature.trim())
    .filter((feature) => feature !== "");

export function renderPricingTableMarkup(config: PricingTableConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--pt-accent: ${config.accentColor}`,
    `--pt-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--pt-on-accent: ${luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff"}`,
    ...Object.entries(palette).map(([key, value]) => `--pt-${key}: ${value}`),
  ].join("; ");

  const plans = config.plans.filter((plan) => plan.name.trim() !== "");

  const cycle = config.showCycle
    ? `      <!-- Real radios in a group: the cycle is a choice between two, not a switch with a hidden meaning. -->
      <fieldset class="pt-cycle">
        <legend class="pt-cycle-legend">Billing</legend>
        <div class="pt-switch">
          <label class="pt-option"><input type="radio" name="pt-cycle" class="pt-sr" value="monthly" checked data-cycle>${escapeHtml(config.monthlyLabel)}</label>
          <label class="pt-option"><input type="radio" name="pt-cycle" class="pt-sr" value="yearly" data-cycle>${escapeHtml(config.yearlyLabel)}</label>
        </div>
${config.yearlyNote.trim() !== "" ? `        <p class="pt-note" hidden data-note>${escapeHtml(config.yearlyNote)}</p>` : ""}
      </fieldset>\n`
    : "";

  const cards = plans
    .map((plan) => {
      const featured = plan.name === config.featured;
      const features = featureList(plan.features)
        .map((feature) => `            <li class="pt-feature"><span class="pt-tick" aria-hidden="true">✓</span>${escapeHtml(feature)}</li>`)
        .join("\n");
      return `        <li class="pt-plan${featured ? " pt-plan--featured" : ""}">
          <h3 class="pt-name">${escapeHtml(plan.name)}${featured ? `<span class="pt-badge">Most picked</span>` : ""}</h3>
          <p class="pt-blurb">${escapeHtml(plan.blurb)}</p>
          <p class="pt-price"><span data-amount data-monthly="${escapeHtml(plan.monthly)}" data-yearly="${escapeHtml(plan.yearly)}">${escapeHtml(config.currency)}${escapeHtml(plan.monthly)}</span><span class="pt-period" data-period>a month</span></p>
          <ul class="pt-features">
${features}
          </ul>
          <button class="pt-choose" type="button">${escapeHtml(config.chooseText)} ${escapeHtml(plan.name)}</button>
        </li>`;
    })
    .join("\n");

  return `    <div class="pt pt--theme-${config.theme}" style="${vars}" data-pricing-table data-currency="${escapeHtml(config.currency)}" data-monthly-label="${escapeHtml(config.monthlyLabel)}" data-yearly-label="${escapeHtml(config.yearlyLabel)}">
      <h2 class="pt-heading">${escapeHtml(config.heading)}</h2>
${cycle}      <ul class="pt-plans">
${cards}
      </ul>
      <!-- Every price on the page just changed: say it once rather than leaving it to be noticed. -->
      <p class="pt-status" role="status" data-status>Showing ${escapeHtml(config.monthlyLabel.toLowerCase())} prices</p>
    </div>`;
}

export function renderPricingTableHtml(config: PricingTableConfig) {
  return htmlPage({ title: "Pricing table", slug: "pricing-table", body: renderPricingTableMarkup(config), script: true });
}
