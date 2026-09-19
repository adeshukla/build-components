import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { AccordionConfig } from "../react/accordion";

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#d9d5e4" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#3a3448" },
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

const icons = {
  chevron: `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>`,
  plus: `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>`,
};

/**
 * The accordion ships as real HTML with every section written into the page, so the content is
 * there before the script runs. The script only opens and closes the sections.
 */
export function renderAccordionMarkup(config: AccordionConfig) {
  const items = config.items.filter((item) => item.title.trim() !== "");
  if (items.length === 0) return "";
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--ac-accent: ${config.accentColor}`,
    `--ac-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--ac-radius: ${config.radius}px`,
    `--ac-surface: ${palette.surface}`,
    `--ac-sunk: ${palette.sunk}`,
    `--ac-text: ${palette.text}`,
    `--ac-muted: ${palette.muted}`,
    `--ac-line: ${palette.line}`,
  ].join("; ");
  const heading = config.headingLevel;

  const sections = items
    .map((item, index) => {
      const open = config.openFirst && index === 0;
      return `        <div class="ac-item">
          <${heading} class="ac-heading">
            <button class="ac-button" type="button" id="accordion-button-${index}" aria-expanded="${open}" aria-controls="accordion-panel-${index}">
              <span class="ac-title">${escapeHtml(item.title)}</span>
              <span class="ac-icon">${icons[config.icon]}</span>
            </button>
          </${heading}>
          <div class="ac-panel" id="accordion-panel-${index}" role="region" aria-labelledby="accordion-button-${index}"${open ? "" : " hidden"}>${escapeHtml(item.content)}</div>
        </div>`;
    })
    .join("\n");

  return `    <div class="ac ac--${config.look} ac--icon-${config.icon} ac--theme-${config.theme}" style="${vars}" data-accordion data-multiple="${config.allowMultiple}">
${sections}
    </div>`;
}

export function renderAccordionHtml(config: AccordionConfig) {
  return htmlPage({ title: "Accordion", slug: "accordion", body: renderAccordionMarkup(config), script: true });
}
