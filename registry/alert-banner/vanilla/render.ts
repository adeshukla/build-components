import { escapeHtml, htmlPage, safeHref } from "@/lib/html";
import type { AlertBannerConfig } from "../react/alert-banner";

/** Each tone has its own word, icon and colour: colour is never the only sign of what this is. */
const tones = {
  info: { word: "Information", path: "M12 8h.01M11 12h1v5h1" },
  success: { word: "Success", path: "m5 12 5 5L20 7" },
  warning: { word: "Warning", path: "M12 9v5M12 17h.01M10.3 3.9 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" },
  error: { word: "Error", path: "M12 8v5M12 16h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" },
};
const palettes = {
  light: {
    surface: { info: "#eff4ff", success: "#ecf7ef", warning: "#fdf4e3", error: "#fdeceb" },
    text: "#16121f",
    muted: "#4d4a57",
    tone: { info: "#1b4ab0", success: "#14632c", warning: "#7a4a00", error: "#a01b14" },
  },
  dark: {
    surface: { info: "#161f36", success: "#132a1c", warning: "#2c2110", error: "#2e1615" },
    text: "#f6f5fa",
    muted: "#b6b3c2",
    tone: { info: "#9db8ff", success: "#7fd79b", warning: "#f0c069", error: "#ff9d95" },
  },
};

export function renderAlertBannerMarkup(config: AlertBannerConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const tone = tones[config.tone];
  const vars = [
    `--ab-surface: ${palette.surface[config.tone]}`,
    `--ab-tone: ${palette.tone[config.tone]}`,
    `--ab-text: ${palette.text}`,
    `--ab-muted: ${palette.muted}`,
  ].join("; ");

  return `    <div class="ab ab--theme-${config.theme}" style="${vars}" role="${config.tone === "error" ? "alert" : "status"}" data-alert-banner>
      <svg class="ab-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="${tone.path}"/></svg>
      <div class="ab-body">
        <p class="ab-title"><span class="ab-sr">${tone.word}: </span>${escapeHtml(config.title)}</p>
${config.body.trim() ? `        <p class="ab-text">${escapeHtml(config.body)}</p>\n` : ""}${
    config.actionText.trim()
      ? `        <p class="ab-actions"><a class="ab-action" href="${escapeHtml(safeHref(config.actionUrl))}">${escapeHtml(config.actionText)}</a></p>\n`
      : ""
  }      </div>
${config.dismissible ? `      <button class="ab-dismiss" type="button" aria-label="Dismiss: ${escapeHtml(config.title)}" data-dismiss>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg>
      </button>\n` : ""}    </div>`;
}

export function renderAlertBannerHtml(config: AlertBannerConfig) {
  return htmlPage({ title: "Alert banner", slug: "alert-banner", body: renderAlertBannerMarkup(config), script: config.dismissible });
}
