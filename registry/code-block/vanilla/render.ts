import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { CodeBlockConfig } from "../react/code-block";

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#141019", sunk: "#1c1826", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
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

export function renderCodeBlockMarkup(config: CodeBlockConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--cb-accent: ${config.accentColor}`,
    `--cb-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...Object.entries(palette).map(([key, value]) => `--cb-${key}: ${value}`),
  ].join("; ");

  const lines = config.lines
    .map(
      (line, index) =>
        `<span class="cb-line">${config.showLineNumbers ? `<span class="cb-number" aria-hidden="true">${index + 1}</span>` : ""}${line.text === "" ? "&nbsp;" : escapeHtml(line.text)}</span>`,
    )
    .join("");

  const wrapButton = config.wrapToggle
    ? `          <button class="cb-button" type="button" aria-pressed="false" data-wrap>Wrap lines</button>\n`
    : "";

  return `    <div class="cb cb--theme-${config.theme}" style="${vars}" data-code-block>
      <div class="cb-bar">
        <p class="cb-title">${escapeHtml(config.title)}</p>
        <div class="cb-buttons">
${wrapButton}          <button class="cb-button" type="button" data-copy data-copied="${escapeHtml(config.copiedText)}">${escapeHtml(config.copyText)}</button>
        </div>
      </div>

      <div class="cb-scroll" role="region" aria-label="${escapeHtml(config.title)} code" tabindex="0">
        <pre class="cb-pre" data-pre><code data-code>${lines}</code></pre>
      </div>

      <p class="cb-status" role="status" data-status></p>
    </div>`;
}

export function renderCodeBlockHtml(config: CodeBlockConfig) {
  return htmlPage({ title: "Code block", slug: "code-block", body: renderCodeBlockMarkup(config), script: true });
}
