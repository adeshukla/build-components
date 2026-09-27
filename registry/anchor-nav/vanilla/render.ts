import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { AnchorNavConfig } from "../react/anchor-nav";

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

export function renderAnchorNavMarkup(config: AnchorNavConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--an-accent: ${config.accentColor}`,
    `--an-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...Object.entries(palette).map(([key, value]) => `--an-${key}: ${value}`),
  ].join("; ");

  const links = config.sections
    .map(
      (section, index) =>
        `            <li><a class="an-link" href="#${escapeHtml(section.target)}"${index === 0 && config.markCurrent ? ' aria-current="true"' : ""} data-anchor>${
          config.numbered ? `<span class="an-number">${index + 1}.</span>` : ""
        }${escapeHtml(section.label)}</a></li>`,
    )
    .join("\n");

  const sections = config.sections
    .map(
      (section) => `          <section aria-labelledby="${escapeHtml(section.target)}">
            <h2 class="an-title" id="${escapeHtml(section.target)}" tabindex="-1">${escapeHtml(section.label)}</h2>
            <p class="an-text">${escapeHtml(section.body)}</p>
            <div class="an-block" aria-hidden="true"></div>
          </section>`,
    )
    .join("\n");

  return `    <div class="an an--theme-${config.theme}${config.sticky ? " an--sticky" : ""}" style="${vars}" data-anchor-nav>
      <div class="an-layout">
        <nav class="an-nav" aria-labelledby="an-heading">
          <h2 class="an-heading" id="an-heading">${escapeHtml(config.heading)}</h2>
          <ol class="an-list">
${links}
          </ol>
        </nav>

        <!-- The page the nav is about. In your own page these are the sections you already have. -->
        <div class="an-body">
${sections}
        </div>
      </div>
    </div>`;
}

export function renderAnchorNavHtml(config: AnchorNavConfig) {
  return htmlPage({ title: "Anchor navigation", slug: "anchor-nav", body: renderAnchorNavMarkup(config), script: true });
}
