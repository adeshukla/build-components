import { escapeHtml, htmlPage, luminance, themedColour } from "@/lib/html";
import type { FaqConfig } from "../react/faq";

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

export function renderFaqMarkup(config: FaqConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--fq-accent: ${config.accentColor}`,
    `--fq-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...(config.theme === "system" ? [] : Object.entries(palette).map(([key, value]) => `--fq-${key}: ${themedColour(key, value, dark)}`)),
  ].join("; ");

  const items = config.items.filter((item) => item.question.trim() !== "");

  const body = items
    .map(
      (item, index) => `        <details class="fq-item"${config.openFirst && index === 0 ? " open" : ""}>
          <summary class="fq-question">${escapeHtml(item.question)}<span class="fq-sign" aria-hidden="true">+</span></summary>
          <p class="fq-answer">${escapeHtml(item.answer)}</p>
        </details>`,
    )
    .join("\n");

  return `    <div class="fq fq--theme-${config.theme}" style="${vars}" data-faq>
      <div class="fq-head">
        <div>
          <h2 class="fq-heading">${escapeHtml(config.heading)}</h2>
${config.intro.trim() === "" ? "" : `          <p class="fq-intro">${escapeHtml(config.intro)}</p>\n`}        </div>
${config.showToggleAll && items.length > 1 ? `        <button class="fq-toggle" type="button" aria-pressed="false" data-toggle-all>Open all</button>\n` : ""}      </div>

      <!-- Native details and summary: open and close, the keyboard, and find-on-page all come free. -->
      <div class="fq-list">
${body}
      </div>
    </div>`;
}

export function renderFaqHtml(config: FaqConfig) {
  return htmlPage({ title: "FAQ", slug: "faq", body: renderFaqMarkup(config), script: true });
}
