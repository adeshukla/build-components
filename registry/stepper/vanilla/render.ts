import { escapeHtml, htmlPage, luminance, safeHref } from "@/lib/html";
import type { StepperConfig } from "../react/stepper";

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", muted: "#4d4a57", line: "#d9d5e4", done: "#1a7f52" },
  dark: { surface: "#141019", text: "#f6f5fa", muted: "#b6b3c2", line: "#3a3448", done: "#6ddba4" },
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

/** The steps ship as real HTML and need no JavaScript at all. */
export function renderStepperMarkup(config: StepperConfig) {
  const steps = config.steps.filter((step) => step.label.trim() !== "");
  if (steps.length === 0) return "";
  const current = Math.min(Math.max(1, Math.round(config.current)), steps.length);
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const accentLuminance = luminance(config.accentColor);
  const vars = [
    `--st-accent: ${config.accentColor}`,
    `--st-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--st-on-accent: ${accentLuminance > 0.179 ? "#000000" : "#ffffff"}`,
    `--st-surface: ${palette.surface}`,
    `--st-text: ${palette.text}`,
    `--st-muted: ${palette.muted}`,
    `--st-line: ${palette.line}`,
    `--st-done: ${palette.done}`,
  ].join("; ");

  const items = steps
    .map((step, index) => {
      const position = index + 1;
      const done = position < current;
      const isCurrent = position === current;
      const state = done ? "done" : isCurrent ? "current" : "todo";
      const said = done ? " (completed)" : isCurrent ? " (current step)" : " (not started)";
      const marker = done ? tick : config.marker === "number" ? String(position) : `<span class="st-dot"></span>`;
      const detail =
        config.details && step.detail.trim() !== ""
          ? `            <span class="st-detail">${escapeHtml(step.detail)}</span>\n`
          : "";
      const body = `          <span class="st-marker st-marker--${state}" aria-hidden="true">${marker}</span>
          <span class="st-words">
            <span class="st-label">${escapeHtml(step.label)}<span class="st-sr">${said}</span></span>
${detail}          </span>`;
      const inner =
        done && config.linkDone && step.href.trim() !== ""
          ? `        <a class="st-link" href="${escapeHtml(safeHref(step.href))}">
${body}
        </a>`
          : `        <span class="st-static">
${body}
        </span>`;
      return `      <li class="st-step st-step--${state}"${isCurrent ? ' aria-current="step"' : ""}>
${inner}
      </li>`;
    })
    .join("\n");

  const summary = config.summary
    ? `    <p class="st-summary">Step ${current} of ${steps.length}: ${escapeHtml(steps[current - 1].label)}</p>\n`
    : "";

  return `    <nav class="st st--${config.orientation} st--theme-${config.theme}" style="${vars}" aria-label="${escapeHtml(config.label)}">
${summary}    <ol class="st-list">
${items}
    </ol>
    </nav>`;
}

export function renderStepperHtml(config: StepperConfig) {
  return htmlPage({ title: "Stepper", slug: "stepper", body: renderStepperMarkup(config), script: false });
}
