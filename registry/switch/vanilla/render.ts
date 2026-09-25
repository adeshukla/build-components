import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { SwitchConfig } from "../react/switch";

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", muted: "#4d4a57", track: "#8e8a99" },
  dark: { surface: "#141019", text: "#f6f5fa", muted: "#b6b3c2", track: "#6f6a7d" },
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

/** A real checkbox with role="switch": keyboard, label and form submission come from the browser. */
export function renderSwitchMarkup(config: SwitchConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--sw-accent: ${config.accentColor}`,
    `--sw-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...Object.entries(palette).map(([key, value]) => `--sw-${key}: ${value}`),
  ].join("; ");
  const hint = config.hint.trim();

  return `    <div class="sw sw--${config.size}${config.labelFirst ? "" : " sw--switch-first"} sw--theme-${config.theme}" style="${vars}" data-switch>
      <label class="sw-row" for="switch-control">
        <span class="sw-text">
          <span class="sw-label">${escapeHtml(config.label)}</span>
${hint ? `          <span class="sw-hint" id="switch-hint">${escapeHtml(hint)}</span>\n` : ""}        </span>
        <span class="sw-controls">
${config.showState ? `          <span class="sw-state" aria-hidden="true" data-state>${config.startOn ? "On" : "Off"}</span>\n` : ""}          <span class="sw-switch">
            <input class="sw-input" id="switch-control" type="checkbox" role="switch"${config.name ? ` name="${escapeHtml(config.name)}"` : ""}${config.startOn ? " checked" : ""}${hint ? ' aria-describedby="switch-hint"' : ""}>
            <span class="sw-track" aria-hidden="true"><span class="sw-thumb"></span></span>
          </span>
        </span>
      </label>
    </div>`;
}

export function renderSwitchHtml(config: SwitchConfig) {
  return htmlPage({ title: "Switch", slug: "switch", body: renderSwitchMarkup(config), script: true });
}
