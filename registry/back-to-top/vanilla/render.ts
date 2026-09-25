import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { BackToTopConfig } from "../react/back-to-top";

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", border: "#737373" },
  dark: { surface: "#1c1826", text: "#f6f5fa", border: "#8e8a99" },
};

export function renderBackToTopMarkup(config: BackToTopConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--bt-accent: ${config.accentColor}`,
    `--bt-on-accent: ${luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff"}`,
    ...Object.entries(palette).map(([key, value]) => `--bt-${key}: ${value}`),
  ].join("; ");

  // Example page content, so there is something to scroll. Delete it in your own page.
  const filler = config.showDemo
    ? `      <div class="bt-page">
        <h1 class="bt-heading" id="top" tabindex="-1">Page heading</h1>
${Array.from({ length: 16 }, (_, index) => `        <p class="bt-filler">Section ${index + 1}. A page needs some length before a back-to-top button earns its place, so here is a paragraph of it. Keep scrolling and the button turns up in the corner.</p>`).join("\n")}
      </div>\n`
    : "";

  return `    <div class="bt bt--${config.position} bt--theme-${config.theme}" style="${vars}" data-back-to-top data-after="${Math.max(0, config.showAfter)}"${config.targetId ? ` data-target="${escapeHtml(config.targetId)}"` : ""}>
${filler}      <button class="bt-button" type="button" hidden data-button>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 15 6-6 6 6"/></svg>
        <span class="${config.showLabel ? "bt-text" : "bt-sr"}">${escapeHtml(config.text)}</span>
      </button>
    </div>`;
}

export function renderBackToTopHtml(config: BackToTopConfig) {
  return htmlPage({ title: "Back to top", slug: "back-to-top", body: renderBackToTopMarkup(config), script: true });
}
