import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { ResizablePanelsConfig } from "../react/resizable-panels";

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#d9d5e4", handle: "#8e8a99" },
  dark: { surface: "#141019", sunk: "#1f1a29", text: "#f6f5fa", muted: "#b6b3c2", line: "#3a3448", handle: "#8e8a99" },
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

/** Both panels and the divider ship in the HTML at their starting size; the script moves the divider. */
export function renderResizablePanelsMarkup(config: ResizablePanelsConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const min = Math.min(config.minSize, config.maxSize);
  const max = Math.max(config.minSize, config.maxSize);
  const size = Math.min(max, Math.max(min, Math.round(config.startSize)));
  const vars = [
    `--rp-accent: ${config.accentColor}`,
    `--rp-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...Object.entries(palette).map(([key, value]) => `--rp-${key}: ${value}`),
  ].join("; ");
  const horizontal = config.orientation === "horizontal";

  return `    <div class="rp rp--${config.orientation} rp--theme-${config.theme}" style="${vars}" data-resizable-panels data-min="${min}" data-max="${max}" data-step="${config.step}" data-collapsible="${config.collapsible}" data-title="${escapeHtml(config.firstTitle)}">
      <section class="rp-pane rp-pane--first" id="resizable-first" aria-labelledby="resizable-first-title" style="flex-basis: ${size}%" data-first>
        <p class="rp-title" id="resizable-first-title">${escapeHtml(config.firstTitle)}</p>
        <p class="rp-body">${escapeHtml(config.firstBody)}</p>
      </section>
      <div class="rp-divider" role="separator" tabindex="0" aria-label="${escapeHtml(config.label)}" aria-controls="resizable-first" aria-orientation="${horizontal ? "vertical" : "horizontal"}" aria-valuenow="${size}" aria-valuemin="${config.collapsible ? 0 : min}" aria-valuemax="${max}" aria-valuetext="${escapeHtml(config.firstTitle)} ${size}%" data-divider>
        <span class="rp-grip" aria-hidden="true"></span>
        <span class="rp-handle" aria-hidden="true"></span>
      </div>
      <section class="rp-pane rp-pane--second" aria-labelledby="resizable-second-title">
        <p class="rp-title" id="resizable-second-title">${escapeHtml(config.secondTitle)}</p>
        <p class="rp-body">${escapeHtml(config.secondBody)}</p>
      </section>
    </div>`;
}

export function renderResizablePanelsHtml(config: ResizablePanelsConfig) {
  return htmlPage({ title: "Resizable panels", slug: "resizable-panels", body: renderResizablePanelsMarkup(config), script: true });
}
