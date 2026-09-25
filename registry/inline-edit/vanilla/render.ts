import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { InlineEditConfig } from "../react/inline-edit";

const palettes = {
  light: { surface: "#ffffff", hover: "#eeecf5", text: "#16121f", muted: "#4d4a57", border: "#737373", error: "#b3261e" },
  dark: { surface: "#141019", hover: "#2a2438", text: "#f6f5fa", muted: "#b6b3c2", border: "#8e8a99", error: "#ff6b6b" },
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

export function renderInlineEditMarkup(config: InlineEditConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--ie-accent: ${config.accentColor}`,
    `--ie-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--ie-on-accent: ${luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff"}`,
    ...Object.entries(palette).map(([key, value]) => `--ie-${key}: ${value}`),
  ].join("; ");
  const hint = config.hint.trim();
  const value = config.value;
  const describedBy = [hint ? "inline-edit-hint" : "", "inline-edit-error"].filter(Boolean).join(" ");
  const field = config.multiline
    ? `<textarea class="ie-field" rows="3" aria-labelledby="inline-edit-label" aria-describedby="${describedBy}" data-field>${escapeHtml(value)}</textarea>`
    : `<input class="ie-field" type="text" value="${escapeHtml(value)}" aria-labelledby="inline-edit-label" aria-describedby="${describedBy}" data-field>`;

  return `    <div class="ie ie--theme-${config.theme}" style="${vars}" data-inline-edit data-required="${config.required}" data-multiline="${config.multiline}" data-label="${escapeHtml(config.label)}">
      <p class="ie-label" id="inline-edit-label">${escapeHtml(config.label)}</p>
      <button class="ie-show" type="button" data-show>
        <span class="ie-value" data-value>${escapeHtml(value || "Not set")}</span>
        <span class="ie-edit">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z"/></svg>
          Edit<span class="ie-sr" data-sr> ${escapeHtml(config.label)}, currently ${escapeHtml(value || "not set")}</span>
        </span>
      </button>
      <div class="ie-form" hidden data-form>
        ${field}
        <p class="ie-error" id="inline-edit-error" role="alert" data-error></p>
${hint ? `        <p class="ie-hint" id="inline-edit-hint">${escapeHtml(hint)}</p>\n` : ""}        <div class="ie-actions">
          <button class="ie-button ie-button--main" type="button" data-save>Save</button>
          <button class="ie-button ie-button--quiet" type="button" data-cancel>Cancel</button>
        </div>
      </div>
      <p class="ie-sr" role="status" data-status></p>
    </div>`;
}

export function renderInlineEditHtml(config: InlineEditConfig) {
  return htmlPage({ title: "Inline edit", slug: "inline-edit", body: renderInlineEditMarkup(config), script: true });
}
