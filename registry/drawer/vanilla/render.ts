import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { DrawerConfig } from "../react/drawer";

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", muted: "#4d4a57", border: "#737373", line: "#d9d5e4", hover: "#eeecf5" },
  dark: { surface: "#1c1826", text: "#f6f5fa", muted: "#b6b3c2", border: "#8e8a99", line: "#3a3448", hover: "#2a2438" },
};
const widths = { sm: "20rem", md: "24rem", lg: "32rem" };
const heights = { sm: "40dvh", md: "60dvh", lg: "85dvh" };

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

/** The drawer is a native modal dialog; the script opens it, keeps focus in and handles swipes. */
export function renderDrawerMarkup(config: DrawerConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--dr-accent: ${config.accentColor}`,
    `--dr-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--dr-on-accent: ${luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff"}`,
    `--dr-width: ${widths[config.size]}`,
    `--dr-height: ${heights[config.size]}`,
    ...Object.entries(palette).map(([key, value]) => `--dr-${key}: ${value}`),
  ].join("; ");
  const options = config.options.filter((option) => option.label.trim() !== "");
  const hasBody = config.body.trim() !== "";

  const choices = options.length
    ? `
            <fieldset class="dr-choices">
              <legend class="dr-sr">${escapeHtml(config.title)}</legend>
${options.map((option) => `              <label class="dr-choice"><input type="checkbox" value="${escapeHtml(option.label)}" data-choice> ${escapeHtml(option.label)}</label>`).join("\n")}
            </fieldset>`
    : "";

  return `    <div class="dr dr--${config.side} dr--theme-${config.theme}" style="${vars}" data-drawer data-backdrop-close="${config.closeOnBackdrop}" data-swipe="${config.swipeToClose}">
      <button class="dr-button dr-trigger" type="button" aria-haspopup="dialog" data-trigger>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M7 12h10M10 18h4"/></svg>
        ${escapeHtml(config.triggerText)}
      </button>
      <p class="dr-status" role="status" data-status></p>
      <dialog class="dr-dialog" aria-labelledby="drawer-title"${hasBody ? ' aria-describedby="drawer-body"' : ""}>
        <div class="dr-inner">
${config.side === "bottom" ? '          <span class="dr-grabber" aria-hidden="true"></span>\n' : ""}          <div class="dr-header">
            <h2 class="dr-title" id="drawer-title" tabindex="-1">${escapeHtml(config.title)}</h2>
            <button class="dr-close" type="button" aria-label="Close" data-close>
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg>
            </button>
          </div>
          <div class="dr-body">
${hasBody ? `            <p class="dr-intro" id="drawer-body">${escapeHtml(config.body)}</p>` : ""}${choices}
          </div>
          <div class="dr-footer">
${config.secondaryButton ? `            <button class="dr-button dr-secondary" type="button" data-clear>${escapeHtml(config.secondaryText)}</button>\n` : ""}            <button class="dr-button dr-primary" type="button" data-apply>${escapeHtml(config.primaryText)}</button>
          </div>
        </div>
      </dialog>
    </div>`;
}

export function renderDrawerHtml(config: DrawerConfig) {
  return htmlPage({ title: "Drawer", slug: "drawer", body: renderDrawerMarkup(config), script: true });
}
