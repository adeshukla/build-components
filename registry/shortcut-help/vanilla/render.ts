import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { ShortcutHelpConfig } from "../react/shortcut-help";

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#1c1826", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
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

/** "g then h" becomes two keys with the word between them, as it is written in the list. */
function keys(value: string) {
  return value
    .split(" then ")
    .map((part) => `<kbd class="sh-key">${escapeHtml(part)}</kbd>`)
    .join('<span class="sh-then">then</span>');
}

export function renderShortcutHelpMarkup(config: ShortcutHelpConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--sh-accent: ${config.accentColor}`,
    `--sh-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--sh-on-accent: ${luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff"}`,
    ...Object.entries(palette).map(([key, value]) => `--sh-${key}: ${value}`),
  ].join("; ");

  const rows = config.shortcuts
    .filter((shortcut) => shortcut.action.trim() !== "")
    .map(
      (shortcut) => `          <div class="sh-row">
            <dt>${keys(shortcut.keys)}</dt>
            <dd>${escapeHtml(shortcut.action)}</dd>
          </div>`,
    )
    .join("\n");

  return `    <div class="sh sh--theme-${config.theme}" style="${vars}" data-shortcut-help data-open-key="${escapeHtml(config.openKey)}">
${
  config.showTrigger
    ? `      <button class="sh-trigger" type="button" aria-haspopup="dialog" data-trigger>${escapeHtml(config.triggerText)}<kbd class="sh-key">${escapeHtml(config.openKey)}</kbd></button>\n`
    : ""
}
      <dialog class="sh-dialog" aria-labelledby="sh-title" data-dialog>
        <div class="sh-head">
          <h2 class="sh-title" id="sh-title">${escapeHtml(config.title)}</h2>
          <button class="sh-close" type="button" data-close>
            <span class="sh-sr">Close the shortcut list</span>
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg>
          </button>
        </div>

        <!-- A description list: the keys are the term, what they do is the description. -->
        <dl class="sh-list">
${rows}
        </dl>

        <p class="sh-hint">${escapeHtml(config.hint)}</p>
      </dialog>
    </div>`;
}

export function renderShortcutHelpHtml(config: ShortcutHelpConfig) {
  return htmlPage({ title: "Keyboard shortcuts", slug: "shortcut-help", body: renderShortcutHelpMarkup(config), script: true });
}
