import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { TourConfig } from "../react/tour";

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", border: "#737373", line: "#d9d5e4", hover: "#eeecf5" },
  dark: { surface: "#1c1826", sunk: "#141019", text: "#f6f5fa", muted: "#b6b3c2", border: "#8e8a99", line: "#3a3448", hover: "#2a2438" },
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
 * The start button and an empty step ship in the HTML; the steps wait in a JSON block (with "<"
 * escaped), so editing the tour is one edit and needs no build step.
 */
export function renderTourMarkup(config: TourConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--to-accent: ${config.accentColor}`,
    `--to-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--to-on-accent: ${luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff"}`,
    ...Object.entries(palette).map(([key, value]) => `--to-${key}: ${value}`),
  ].join("; ");
  const steps = config.steps.filter((step) => step.title.trim() !== "");

  const demo = config.showDemo
    ? `      <!-- Example page to point the tour at. Delete it and point each step's target at your own elements. -->
      <div class="to-demo">
        <label class="to-sr" for="tour-search">Search</label>
        <input class="to-search" id="tour-search" type="search" placeholder="Search">
        <button class="to-button to-button--main" id="tour-new" type="button">New project</button>
        <button class="to-button to-button--quiet" id="tour-filters" type="button">Filters</button>
        <a class="to-button to-button--quiet" id="tour-help" href="#help">Help</a>
      </div>
`
    : "";

  return `    <div class="to to--theme-${config.theme}" style="${vars}" data-tour data-progress="${config.showProgress}">
${demo}      <button class="to-button to-button--quiet" type="button" aria-haspopup="dialog" data-start>${escapeHtml(config.startText)}</button>
      <div class="to-ring" aria-hidden="true" hidden data-ring></div>
      <div class="to-step" role="dialog" aria-modal="false" aria-labelledby="tour-title" aria-describedby="tour-body" hidden data-step>
        <p class="to-progress" data-count></p>
        <p class="to-title" id="tour-title" tabindex="-1"></p>
        <p class="to-body" id="tour-body"></p>
        <div class="to-actions">
          <button class="to-button to-skip" type="button" data-skip>Skip tour</button>
          <span class="to-nav">
            <button class="to-button to-button--quiet" type="button" data-back>Back</button>
            <button class="to-button to-button--main" type="button" data-next>Next</button>
          </span>
        </div>
      </div>
      <script type="application/json" data-steps>${JSON.stringify(steps).replace(/</g, "\\u003c")}</script>
    </div>`;
}

export function renderTourHtml(config: TourConfig) {
  return htmlPage({ title: "Guided tour", slug: "tour", body: renderTourMarkup(config), script: true });
}
