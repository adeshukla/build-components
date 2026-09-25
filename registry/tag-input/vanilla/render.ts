import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { TagInputConfig } from "../react/tag-input";

const palettes = {
  light: { surface: "#ffffff", sunk: "#eeecf5", text: "#16121f", muted: "#4d4a57", border: "#737373", line: "#d9d5e4" },
  dark: { surface: "#141019", sunk: "#2a2438", text: "#f6f5fa", muted: "#b6b3c2", border: "#8e8a99", line: "#3a3448" },
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

const CROSS =
  '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg>';

export function renderTagInputMarkup(config: TagInputConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--ti-accent: ${config.accentColor}`,
    `--ti-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...Object.entries(palette).map(([key, value]) => `--ti-${key}: ${value}`),
  ].join("; ");
  const max = Math.max(1, Math.min(30, Math.round(config.maxTags)));
  const tags = config.startTags.map((tag) => tag.text).filter((text) => text.trim() !== "");
  const hint = config.hint.trim();

  const chips = tags
    .map(
      (tag) => `          <li><span class="ti-chip">${escapeHtml(tag)}<button class="ti-remove" type="button" aria-label="Remove ${escapeHtml(tag)}" data-remove>${CROSS}</button></span></li>`,
    )
    .join("\n");

  return `    <div class="ti ti--theme-${config.theme}" style="${vars}" data-tag-input data-max="${max}" data-duplicates="${config.allowDuplicates}"${config.name ? ` data-name="${escapeHtml(config.name)}"` : ""}>
      <label class="ti-label" for="tag-input-field">${escapeHtml(config.label)}</label>
${hint ? `      <p class="ti-hint" id="tag-input-hint">${escapeHtml(hint)}</p>\n` : ""}      <ul class="ti-chips" aria-label="${escapeHtml(config.label)} added" data-chips>
${chips}
      </ul>
      <input class="ti-field" id="tag-input-field" type="text" autocomplete="off" placeholder="${escapeHtml(config.placeholder)}" aria-describedby="${hint ? "tag-input-hint " : ""}tag-input-count" data-field>
      <p class="ti-count" id="tag-input-count" data-count>${tags.length} of ${max} added</p>
      <p class="ti-sr" role="status" data-status></p>
      <span data-values></span>
    </div>`;
}

export function renderTagInputHtml(config: TagInputConfig) {
  return htmlPage({ title: "Tag input", slug: "tag-input", body: renderTagInputMarkup(config), script: true });
}
