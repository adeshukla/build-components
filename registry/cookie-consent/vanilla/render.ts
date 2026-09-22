import { escapeHtml, htmlPage, luminance, safeHref } from "@/lib/html";
import type { CookieConsentConfig } from "../react/cookie-consent";

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", muted: "#4d4a57", border: "#737373", line: "#d9d5e4", hover: "#eeecf5" },
  dark: { surface: "#1c1826", text: "#f6f5fa", muted: "#b6b3c2", border: "#8e8a99", line: "#3a3448", hover: "#2a2438" },
};

/** Darkens or lightens the accent until it clears 4.5:1 against the surface it sits on. */
function readableAccent(hex: string, onDark: boolean) {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const surface = onDark ? 0.08 : 1;
  for (let step = 0; step <= 20; step++) {
    const shifted = channels.map((c) => Math.round(onDark ? c + (255 - c) * (step / 20) : c * (1 - step / 20)));
    const value = `#${shifted.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
    const l = luminance(value);
    const contrast = (Math.max(l, surface) + 0.05) / (Math.min(l, surface) + 0.05);
    if (contrast >= 4.5) return value;
  }
  return onDark ? "#ffffff" : "#000000";
}

/**
 * The banner ships hidden and the script shows it only when no choice has been saved, so returning
 * visitors never see it flash.
 */
export function renderCookieConsentMarkup(config: CookieConsentConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--cc-accent: ${config.accentColor}`,
    `--cc-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--cc-on-accent: ${luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff"}`,
    ...Object.entries(palette).map(([key, value]) => `--cc-${key}: ${value}`),
  ].join("; ");
  const categories = config.categories.filter((category) => category.key.trim() && category.name.trim());
  const policy = config.policyText.trim()
    ? ` <a class="cc-link" href="${escapeHtml(safeHref(config.policyUrl))}">${escapeHtml(config.policyText)}</a>`
    : "";
  const rows = categories
    .map(
      (category, index) => `            <li>
              <label class="cc-option">
                <input type="checkbox" name="${escapeHtml(category.key)}" aria-describedby="cookie-note-${index}">
                <span><span class="cc-option-name">${escapeHtml(category.name)}</span><span class="cc-note" id="cookie-note-${index}">${escapeHtml(category.description)}</span></span>
              </label>
            </li>`,
    )
    .join("\n");

  return `    <div class="cc cc--${config.position} cc--theme-${config.theme}" style="${vars}" data-cookie-consent data-storage-key="${escapeHtml(config.storageKey)}">
      <section class="cc-banner" aria-labelledby="cookie-banner-title" hidden data-banner>
        <div class="cc-banner-inner">
          <div class="cc-text">
            <h2 class="cc-title" id="cookie-banner-title">${escapeHtml(config.title)}</h2>
            <p class="cc-body">${escapeHtml(config.body)}${policy}</p>
          </div>
          <div class="cc-actions">
            <button class="cc-button cc-button--choice" type="button" data-accept>Accept all</button>
            <button class="cc-button cc-button--choice" type="button" data-reject>Reject all</button>
${categories.length ? `            <button class="cc-button cc-button--quiet" type="button" aria-haspopup="dialog" data-choose>Choose cookies</button>\n` : ""}          </div>
        </div>
      </section>
${config.showReopen ? `      <button class="cc-button cc-button--quiet" type="button" aria-haspopup="dialog" hidden data-reopen>Cookie settings</button>\n` : ""}      <dialog class="cc-dialog" aria-labelledby="cookie-dialog-title">
        <form method="dialog" data-form>
          <h2 class="cc-title" id="cookie-dialog-title" tabindex="-1">Cookie preferences</h2>
          <p class="cc-body">Choose which cookies you allow. You can change this at any time.</p>
          <ul class="cc-options">
            <li>
              <label class="cc-option">
                <input type="checkbox" checked disabled aria-describedby="cookie-note-necessary">
                <span><span class="cc-option-name">Necessary</span><span class="cc-note" id="cookie-note-necessary">Needed for the site to work, such as remembering this choice. Always on.</span></span>
              </label>
            </li>
${rows}
          </ul>
          <div class="cc-dialog-actions">
            <button class="cc-button cc-button--quiet" type="button" data-cancel>Cancel</button>
            <button class="cc-button cc-button--choice" type="submit">Save choices</button>
          </div>
        </form>
      </dialog>
    </div>`;
}

export function renderCookieConsentHtml(config: CookieConsentConfig) {
  return htmlPage({ title: "Cookie consent", slug: "cookie-consent", body: renderCookieConsentMarkup(config), script: true });
}
