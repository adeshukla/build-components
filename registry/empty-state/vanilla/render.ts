import { escapeHtml, htmlPage, luminance, safeHref } from "@/lib/html";
import type { EmptyStateConfig } from "../react/empty-state";

const icons = {
  box: "M3 8 12 3l9 5v8l-9 5-9-5V8Zm0 0 9 5m0 0 9-5m-9 5v8",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm5.5-1.5L21 21",
  inbox: "M4 13h4l1.5 3h5L16 13h4M4 13V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7m-16 0v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5",
  warning: "M12 9v5M12 17h.01M10.3 3.9 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
};
const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", border: "#737373" },
  dark: { surface: "#141019", sunk: "#1f1a29", text: "#f6f5fa", muted: "#b6b3c2", border: "#8e8a99" },
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

export function renderEmptyStateMarkup(config: EmptyStateConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--es-accent: ${config.accentColor}`,
    `--es-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--es-on-accent: ${luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff"}`,
    ...Object.entries(palette).map(([key, value]) => `--es-${key}: ${value}`),
  ].join("; ");
  const actions = [
    config.actionText.trim() &&
      `          <a class="es-button es-button--main" href="${escapeHtml(safeHref(config.actionUrl))}">${escapeHtml(config.actionText)}</a>`,
    config.secondaryText.trim() &&
      `          <a class="es-button es-button--quiet" href="${escapeHtml(safeHref(config.secondaryUrl))}">${escapeHtml(config.secondaryText)}</a>`,
  ].filter(Boolean);

  return `    <div class="es es--${config.align} es--theme-${config.theme}" style="${vars}" data-empty-state>
      <div class="es-inner">
        <span class="es-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="${icons[config.icon]}"/></svg>
        </span>
        <${config.headingLevel} class="es-title">${escapeHtml(config.title)}</${config.headingLevel}>
${config.body.trim() ? `        <p class="es-body">${escapeHtml(config.body)}</p>\n` : ""}${
    actions.length ? `        <div class="es-actions">\n${actions.join("\n")}\n        </div>\n` : ""
  }      </div>
    </div>`;
}

export function renderEmptyStateHtml(config: EmptyStateConfig) {
  return htmlPage({ title: "Empty state", slug: "empty-state", body: renderEmptyStateMarkup(config), script: false });
}
