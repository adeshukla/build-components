import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { TabsConfig } from "../react/tabs";

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", muted: "#4d4a57", line: "#d9d5e4", hover: "#f4f3f8" },
  dark: { surface: "#141019", text: "#f6f5fa", muted: "#b6b3c2", line: "#3a3448", hover: "#221d2e" },
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

/**
 * Tabs ship as real HTML with the first panel already open, so the markup is generated from the
 * options. The script only adds the keyboard behaviour. "system" theme is handled in CSS.
 */
export function renderTabsMarkup(config: TabsConfig) {
  const items = config.items.filter((item) => item.label.trim() !== "");
  if (items.length === 0) return "";
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const accentLuminance = luminance(config.accentColor);
  const vars = [
    `--tb-accent: ${config.accentColor}`,
    `--tb-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--tb-on-accent: ${accentLuminance > 0.179 ? "#000000" : "#ffffff"}`,
    `--tb-radius: ${config.radius}px`,
    `--tb-surface: ${palette.surface}`,
    `--tb-text: ${palette.text}`,
    `--tb-muted: ${palette.muted}`,
    `--tb-line: ${palette.line}`,
    `--tb-hover: ${palette.hover}`,
  ].join("; ");
  const classes = [
    "tb",
    `tb--${config.orientation}`,
    `tb--${config.look}`,
    `tb--${config.size}`,
    `tb--theme-${config.theme}`,
    config.stretch ? "tb--stretch" : "",
    config.panelBox ? "tb--boxed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const tabs = items
    .map(
      (item, index) =>
        `          <button class="tb-tab" type="button" role="tab" id="tabs-tab-${index}" aria-selected="${index === 0}" aria-controls="tabs-panel-${index}" tabindex="${index === 0 ? 0 : -1}">${escapeHtml(item.label)}</button>`,
    )
    .join("\n");

  // Each panel takes focus itself, because its content may hold nothing focusable.
  const panels = items
    .map(
      (item, index) =>
        `      <div class="tb-panel" role="tabpanel" id="tabs-panel-${index}" aria-labelledby="tabs-tab-${index}" tabindex="0"${index === 0 ? "" : " hidden"}>${escapeHtml(item.content)}</div>`,
    )
    .join("\n");

  return `    <div class="${classes}" style="${vars}" data-tabs data-activation="${config.activation}">
      <div class="tb-list" role="tablist" aria-label="${escapeHtml(config.label)}"${config.orientation === "vertical" ? ' aria-orientation="vertical"' : ""}>
${tabs}
      </div>
${panels}
    </div>`;
}

export function renderTabsHtml(config: TabsConfig) {
  return htmlPage({ title: "Tabs", slug: "tabs", body: renderTabsMarkup(config), script: true });
}
