import { escapeHtml, htmlPage, luminance, themedColour } from "@/lib/html";
import type { SkipLinksConfig } from "../react/skip-links";

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

const withoutSkipTo = (label: string) => label.replace(/^Skip to /i, "");

export function renderSkipLinksMarkup(config: SkipLinksConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--sk-accent: ${config.accentColor}`,
    `--sk-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--sk-on-accent: ${luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff"}`,
    ...(config.theme === "system" ? [] : Object.entries(palette).map(([key, value]) => `--sk-${key}: ${themedColour(key, value, dark)}`)),
  ].join("; ");

  const links = config.links
    .map(
      (link) =>
        `        <a class="sk-link" href="#${escapeHtml(link.target)}" data-skip>${escapeHtml(link.label)}</a>`,
    )
    .join("\n");

  const targets = config.links
    .map(
      (link) => `        <section class="sk-target" id="${escapeHtml(link.target)}" tabindex="-1" aria-label="${escapeHtml(withoutSkipTo(link.label))}">
          <p class="sk-target-id">#${escapeHtml(link.target)}</p>
          <p class="sk-target-text">${escapeHtml(link.label.replace(/^Skip to /i, "Landing here skips to "))}</p>
        </section>`,
    )
    .join("\n");

  const modifiers = [
    `sk--theme-${config.theme}`,
    config.alwaysVisible ? "sk--always" : "",
    config.position === "top-centre" ? "sk--centre" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return `    <div class="sk ${modifiers}" style="${vars}" data-skip-links>
      <nav class="sk-nav" aria-label="${escapeHtml(config.navLabel)}">
${links}
      </nav>

      <!-- The demo page the links skip into. In your own page these are the landmarks you already have. -->
      <div class="sk-demo" data-demo>
        <h2 class="sk-demo-heading">${escapeHtml(config.demoHeading)}</h2>
        <p class="sk-demo-text">Press Tab from the very top of the page. Each target takes focus, so the next Tab carries on from there.</p>
        <div class="sk-targets">
${targets}
        </div>
      </div>
    </div>`;
}

export function renderSkipLinksHtml(config: SkipLinksConfig) {
  return htmlPage({ title: "Skip links", slug: "skip-links", body: renderSkipLinksMarkup(config), script: true });
}
