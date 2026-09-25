import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { LanguageSwitcherConfig } from "../react/language-switcher";

const palettes = {
  light: { surface: "#ffffff", hover: "#eeecf5", text: "#16121f", muted: "#4d4a57", border: "#737373", line: "#d9d5e4" },
  dark: { surface: "#1c1826", hover: "#2a2438", text: "#f6f5fa", muted: "#b6b3c2", border: "#8e8a99", line: "#3a3448" },
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

const safeHref = (value: string) => (/^(\/|#|https?:\/\/)/i.test(value.trim()) ? value.trim() : "#");
const TICK =
  '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m5 12 5 5L20 7"/></svg>';

export function renderLanguageSwitcherMarkup(config: LanguageSwitcherConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--ls-accent: ${config.accentColor}`,
    `--ls-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...Object.entries(palette).map(([key, value]) => `--ls-${key}: ${value}`),
  ].join("; ");
  const languages = config.languages.filter((language) => language.name.trim() !== "" && language.code.trim() !== "");
  const current = languages.find((language) => language.code === config.currentCode) ?? languages[0];

  // Links, not buttons: changing language is going to another page.
  const items = languages
    .map((language) => {
      const here = current && language.code === current.code;
      const trailing = here ? TICK : config.showCode ? `<span class="ls-code" aria-hidden="true">${escapeHtml(language.code)}</span>` : "";
      return `          <li><a class="ls-link" href="${escapeHtml(safeHref(language.url))}" lang="${escapeHtml(language.code)}" hreflang="${escapeHtml(language.code)}"${here ? ' aria-current="true"' : ""}>${escapeHtml(language.name)}${trailing}</a></li>`;
    })
    .join("\n");

  return `    <div class="ls ls--theme-${config.theme}" style="${vars}" data-language-switcher>
      <button class="ls-button" type="button" aria-expanded="false" aria-controls="language-list" data-button>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 0c2.5 2.4 3.8 5.5 3.8 9s-1.3 6.6-3.8 9c-2.5-2.4-3.8-5.5-3.8-9S9.5 5.4 12 3ZM3.3 9h17.4M3.3 15h17.4"/></svg>
        <span class="ls-sr">${escapeHtml(config.label)}: </span>
        <span lang="${escapeHtml(current?.code ?? "")}">${escapeHtml(current?.name ?? "")}</span>
${config.showCode && current ? `        <span class="ls-code" aria-hidden="true">${escapeHtml(current.code)}</span>\n` : ""}      </button>
      <ul class="ls-list" id="language-list" hidden data-list>
${items}
      </ul>
    </div>`;
}

export function renderLanguageSwitcherHtml(config: LanguageSwitcherConfig) {
  return htmlPage({ title: "Language switcher", slug: "language-switcher", body: renderLanguageSwitcherMarkup(config), script: true });
}
