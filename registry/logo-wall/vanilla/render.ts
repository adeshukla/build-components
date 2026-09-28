import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { LogoWallConfig } from "../react/logo-wall";

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

/** Only http(s) and same-site paths are let through, the same rule the React output uses. */
function safeUrl(value: string) {
  if (value.startsWith("/")) return value;
  try {
    const url = new URL(value, "https://example.com");
    return url.protocol === "http:" || url.protocol === "https:" ? value : "";
  } catch {
    return "";
  }
}

export function renderLogoWallMarkup(config: LogoWallConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--lw-accent: ${config.accentColor}`,
    `--lw-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...Object.entries(palette).map(([key, value]) => `--lw-${key}: ${value}`),
  ].join("; ");

  const quiet = config.headingLevel === "p";
  const items = config.items
    .map((item) => {
      const src = safeUrl(item.src);
      const href = safeUrl(item.href);
      // alt is the name, never the word "logo": a screen reader already says "image".
      const mark =
        src === ""
          ? `<span class="lw-name">${escapeHtml(item.name)}</span>`
          : `<img class="lw-mark" src="${escapeHtml(src)}" alt="${escapeHtml(item.name)}" loading="lazy" decoding="async">`;
      return `        <li class="lw-item">${href === "" ? mark : `<a class="lw-link" href="${escapeHtml(href)}">${mark}</a>`}</li>`;
    })
    .join("\n");

  return `    <div class="lw lw--theme-${config.theme}${config.grayscale ? " lw--grayscale" : ""}" style="${vars}">
      <${quiet ? "p" : config.headingLevel} class="lw-heading${quiet ? " lw-heading--quiet" : ""}" id="lw-heading">${escapeHtml(config.heading)}</${quiet ? "p" : config.headingLevel}>

      <!--
        A list, so a screen reader counts them. Each entry is the name in words: a wordmark is a picture
        of a name, and the name is what anyone needs.
      -->
      <!--
        The column count is what to do when there is room for it. Three across a phone gives each name
        about 90px, which breaks "Tailwind CSS" into three lines — so below the width they fit, the
        wall drops to two columns, and then to one.
      -->
      <ul class="lw-list" aria-labelledby="lw-heading" style="--lw-columns: ${Math.max(config.columns, 1)}; --lw-columns-narrow: ${Math.min(Math.max(config.columns, 1), 2)}">
${items}
      </ul>

      <p class="lw-note">These are the tools this page is built with, which is a claim about us. A &ldquo;trusted by&rdquo; wall is a claim about someone else — only put a name there with their permission.</p>
    </div>`;
}

export function renderLogoWallHtml(config: LogoWallConfig) {
  return htmlPage({ title: "Logo wall", slug: "logo-wall", body: renderLogoWallMarkup(config), script: false });
}
