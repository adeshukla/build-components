import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { MultiSelectConfig } from "../react/multi-select";

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#8d8a99", hover: "#f0eff6" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#8d8a99", hover: "#2a2438" },
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

const tick = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg>`;

/**
 * The label, the box and every option ship as real HTML. The script adds the filtering, the
 * chosen list and the keyboard behaviour.
 */
export function renderMultiSelectMarkup(config: MultiSelectConfig) {
  const options = config.options.map((option) => option.label).filter((label) => label.trim() !== "");
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const accentLuminance = luminance(config.accentColor);
  const vars = [
    `--ms-accent: ${config.accentColor}`,
    `--ms-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--ms-on-accent: ${accentLuminance > 0.179 ? "#000000" : "#ffffff"}`,
    `--ms-radius: ${config.radius}px`,
    `--ms-surface: ${palette.surface}`,
    `--ms-sunk: ${palette.sunk}`,
    `--ms-text: ${palette.text}`,
    `--ms-muted: ${palette.muted}`,
    `--ms-line: ${palette.line}`,
    `--ms-hover: ${palette.hover}`,
  ].join("; ");

  const list = options
    .map(
      (label, index) =>
        `        <li class="ms-option" id="multi-select-option-${index}" role="option" aria-selected="false" data-option="${escapeHtml(label)}">
          <span class="ms-box" aria-hidden="true">${tick}</span>${escapeHtml(label)}
        </li>`,
    )
    .join("\n");

  const hint = config.hint.trim()
    ? `      <p class="ms-hint" id="multi-select-hint">${escapeHtml(config.hint)}</p>\n`
    : "";

  return `    <div class="ms ms--theme-${config.theme}" style="${vars}" data-multi-select data-filter="${config.filter}" data-max="${config.maxSelected}" data-clear-all="${config.clearAll}" data-label="${escapeHtml(config.label)}">
      <label class="ms-label" for="multi-select-input">${escapeHtml(config.label)}</label>
${hint}      <ul class="ms-chosen" aria-label="${escapeHtml(config.label)}, selected" data-chosen hidden></ul>
      <input class="ms-input" id="multi-select-input" type="text" role="combobox" aria-expanded="false" aria-controls="multi-select-list" aria-autocomplete="list"${config.hint.trim() ? ' aria-describedby="multi-select-hint"' : ""} placeholder="${escapeHtml(config.placeholder)}" data-input>
      <p class="ms-sr" aria-live="polite" data-announce></p>
      <ul class="ms-list" id="multi-select-list" role="listbox" aria-label="${escapeHtml(config.label)}" aria-multiselectable="true" hidden data-list>
${list}
        <li class="ms-empty" data-empty hidden></li>
      </ul>
    </div>`;
}

export function renderMultiSelectHtml(config: MultiSelectConfig) {
  return htmlPage({
    title: "Multi-select",
    slug: "multi-select",
    body: renderMultiSelectMarkup(config),
    script: true,
  });
}
