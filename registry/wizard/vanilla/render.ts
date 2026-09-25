import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { WizardConfig } from "../react/wizard";

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6", error: "#b42318" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459", error: "#ff9d95" },
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

export function renderWizardMarkup(config: WizardConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--wz-accent: ${config.accentColor}`,
    `--wz-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--wz-on-accent: ${luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff"}`,
    ...Object.entries(palette).map(([key, value]) => `--wz-${key}: ${value}`),
  ].join("; ");

  const steps = config.steps.filter((step) => step.title.trim() !== "");
  const first = steps[0];

  const list = steps
    .map(
      (step, index) =>
        // The step list is also where the script reads each step's field from, so it works with the
        // progress list turned off.
        `          <li class="wz-step"${index === 0 ? ' aria-current="step"' : ""} data-step-name data-step-title="${escapeHtml(step.title)}" data-step-label="${escapeHtml(step.label)}" data-step-required="${step.required === "yes" ? "yes" : "no"}">${index === 0 ? `<span class="wz-sr">Current step: </span>` : ""}${index + 1}. ${escapeHtml(step.title)}</li>`,
    )
    .join("\n");

  const rows = steps
    .map(
      (step) => `          <div class="wz-row">
            <dt>${escapeHtml(step.label)}</dt>
            <dd data-answer>Not given</dd>
          </div>`,
    )
    .join("\n");

  return `    <div class="wz wz--theme-${config.theme}" style="${vars}" data-wizard data-finish="${escapeHtml(config.finishText)}" data-next="${escapeHtml(config.nextText)}" data-heading="${escapeHtml(config.heading)}">
      <div class="wz-form" data-form>
        <p class="wz-heading">${escapeHtml(config.heading)}</p>

        <!-- The steps as a list, with the one you are on marked for everyone, not just in colour. -->
        <ol class="wz-steps"${config.showProgress ? "" : " hidden"} data-steps>
${list}
        </ol>

        <h2 class="wz-title" tabindex="-1" data-title>${escapeHtml(first ? first.title : "")}<span class="wz-of" data-of>Step 1 of ${steps.length}</span></h2>

        <div class="wz-group">
          <label class="wz-label" for="wz-field" data-label>${escapeHtml(first ? first.label : "")}${first && first.required === "yes" ? `<span class="wz-needed" data-needed>(needed)</span>` : ""}</label>
          <input class="wz-field" id="wz-field" type="text" data-field>
          <p class="wz-error" id="wz-error" role="alert" hidden data-error></p>
        </div>

        <div class="wz-actions">
          <button class="wz-back" type="button" hidden data-back>${escapeHtml(config.backText)}</button>
          <button class="wz-next" type="button" data-next>${escapeHtml(steps.length === 1 ? config.finishText : config.nextText)}</button>
        </div>
      </div>

      <div class="wz-done" hidden data-done>
        <h2 class="wz-title" tabindex="-1" data-done-title>${escapeHtml(config.heading)}: sent</h2>
        <dl class="wz-summary">
${rows}
        </dl>
        <p class="wz-status" role="status" data-status></p>
      </div>
    </div>`;
}

export function renderWizardHtml(config: WizardConfig) {
  return htmlPage({ title: "Multi-step wizard", slug: "wizard", body: renderWizardMarkup(config), script: true });
}
