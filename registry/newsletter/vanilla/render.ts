import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { NewsletterConfig } from "../react/newsletter";

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6", error: "#b42318" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459", error: "#ff9d95" },
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

export function renderNewsletterMarkup(config: NewsletterConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--nl-accent: ${config.accentColor}`,
    `--nl-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--nl-on-accent: ${luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff"}`,
    ...Object.entries(palette).map(([key, value]) => `--nl-${key}: ${value}`),
  ].join("; ");

  const consent = config.requireConsent
    ? `        <label class="nl-consent">
          <input class="nl-box" type="checkbox" name="consent" data-consent>
          <span>${escapeHtml(config.consentText)}</span>
        </label>\n`
    : "";

  return `    <section class="nl nl--theme-${config.theme} nl--${config.layout}" style="${vars}" aria-labelledby="nl-heading" data-newsletter data-success="${escapeHtml(config.successText)}">
      <h2 class="nl-heading" id="nl-heading">${escapeHtml(config.heading)}</h2>
${config.copy.trim() === "" ? "" : `      <p class="nl-copy">${escapeHtml(config.copy)}</p>\n`}
      <!-- novalidate: the browser's own bubble cannot be read back, so the message is ours. -->
      <form class="nl-form" novalidate data-form>
        <div class="nl-row">
          <div class="nl-field-wrap">
            <label class="nl-label" for="nl-email">${escapeHtml(config.emailLabel)}</label>
            <input class="nl-field" id="nl-email" name="${escapeHtml(config.name)}" type="email" autocomplete="email" inputmode="email"${config.placeholder.trim() === "" ? "" : ` placeholder="${escapeHtml(config.placeholder)}"`}${config.note.trim() === "" ? "" : ' aria-describedby="nl-note"'} data-email>
          </div>
          <button class="nl-button" type="submit">${escapeHtml(config.buttonText)}</button>
        </div>

${consent}${config.note.trim() === "" ? "" : `        <p class="nl-note" id="nl-note">${escapeHtml(config.note)}</p>\n`}        <p class="nl-error" id="nl-error" role="alert" hidden data-error></p>
      </form>

      <!-- The form stays where it is and the outcome is said, rather than the form vanishing. -->
      <p class="nl-status" role="status" data-status></p>
    </section>`;
}

export function renderNewsletterHtml(config: NewsletterConfig) {
  return htmlPage({ title: "Newsletter signup", slug: "newsletter", body: renderNewsletterMarkup(config), script: true });
}
