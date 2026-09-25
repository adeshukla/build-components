import { escapeHtml, htmlPage } from "@/lib/html";
import type { BadgeConfig } from "../react/badge";

type Tone = "neutral" | "info" | "success" | "warning" | "error";
const toneNames: Tone[] = ["neutral", "info", "success", "warning", "error"];
/** Every tone carries its own text and dot, so colour is never the only thing saying what it is. */
const colours = {
  light: {
    neutral: { soft: "#eeecf5", ink: "#3b3747", strong: "#4d4a57" },
    info: { soft: "#eff4ff", ink: "#1b4ab0", strong: "#2563eb" },
    success: { soft: "#ecf7ef", ink: "#14632c", strong: "#146c2e" },
    warning: { soft: "#fdf4e3", ink: "#7a4a00", strong: "#8a5300" },
    error: { soft: "#fdeceb", ink: "#a01b14", strong: "#b3261e" },
  },
  dark: {
    neutral: { soft: "#2a2438", ink: "#d7d3e2", strong: "#b6b3c2" },
    info: { soft: "#161f36", ink: "#9db8ff", strong: "#6d93ff" },
    success: { soft: "#132a1c", ink: "#7fd79b", strong: "#4dbb74" },
    warning: { soft: "#2c2110", ink: "#f0c069", strong: "#d9a03f" },
    error: { soft: "#2e1615", ink: "#ff9d95", strong: "#ff6b6b" },
  },
};

const toneOf = (value: string): Tone => (toneNames.includes(value as Tone) ? (value as Tone) : "neutral");

export function renderBadgeMarkup(config: BadgeConfig) {
  const dark = config.theme === "dark";
  const palette = colours[dark ? "dark" : "light"];
  const items = config.items.filter((item) => item.text.trim() !== "");

  const badges = items
    .map((item) => {
      const tone = palette[toneOf(item.tone)];
      const vars = [
        `--bd-soft: ${tone.soft}`,
        `--bd-ink: ${tone.ink}`,
        `--bd-strong: ${tone.strong}`,
        `--bd-on-strong: ${dark ? "#141019" : "#ffffff"}`,
      ].join("; ");
      return `        <li><span class="bd-badge" style="${vars}">${config.showDot ? '<span class="bd-dot" aria-hidden="true"></span>' : ""}${escapeHtml(item.text)}</span></li>`;
    })
    .join("\n");

  return `    <ul class="bd bd--${config.variant} bd--${config.size} bd--theme-${config.theme}" data-badge>
${badges}
    </ul>`;
}

export function renderBadgeHtml(config: BadgeConfig) {
  return htmlPage({ title: "Badges", slug: "badge", body: renderBadgeMarkup(config), script: false });
}
