import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { HowItWorksConfig } from "../react/how-it-works";

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

export function renderHowItWorksMarkup(config: HowItWorksConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--hw-accent: ${config.accentColor}`,
    `--hw-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--hw-on-accent: ${luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff"}`,
    ...Object.entries(palette).map(([key, value]) => `--hw-${key}: ${value}`),
  ].join("; ");

  const steps = config.steps
    .filter((step) => step.title.trim() !== "")
    .map(
      (step, index) => `        <li class="hw-step">
          <div class="hw-rail">
${config.showNumbers ? `            <!-- The number repeats what the list already says, for people reading it as a picture. -->
            <span class="hw-number" aria-hidden="true">${index + 1}</span>\n` : ""}${config.showConnector ? `            <span class="hw-thread" aria-hidden="true"></span>\n` : ""}          </div>
          <div class="hw-body">
            <h3 class="hw-title">${escapeHtml(step.title)}</h3>
            <p class="hw-text">${escapeHtml(step.text)}</p>
${step.meta.trim() === "" ? "" : `            <p class="hw-meta">${escapeHtml(step.meta)}</p>\n`}          </div>
        </li>`,
    )
    .join("\n");

  return `    <section class="hw hw--theme-${config.theme} hw--${config.layout}" style="${vars}" aria-labelledby="how-heading" data-how-it-works>
      <h2 class="hw-heading" id="how-heading">${escapeHtml(config.heading)}</h2>
${config.intro.trim() === "" ? "" : `      <p class="hw-intro">${escapeHtml(config.intro)}</p>\n`}      <ol class="hw-list">
${steps}
      </ol>
    </section>`;
}

export function renderHowItWorksHtml(config: HowItWorksConfig) {
  return htmlPage({ title: "How it works", slug: "how-it-works", body: renderHowItWorksMarkup(config), script: false });
}
