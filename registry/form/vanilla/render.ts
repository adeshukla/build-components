import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { FormConfig } from "../react/form";

const palettes = {
  light: { surface: "#ffffff", sunk: "#f5f4f9", text: "#16121f", muted: "#4d4a57", border: "#6f6b7a", error: "#b3261e", errorBg: "#fdf2f2", success: "#0f6b45", successBg: "#eaf6f0" },
  dark: { surface: "#141019", sunk: "#1d1826", text: "#f6f5fa", muted: "#b6b3c2", border: "#8d8a99", error: "#ff8a8a", errorBg: "#2a1414", success: "#6ee7a8", successBg: "#10251c" },
};

type Field = { name: string; label: string; type: "text" | "email" | "tel" | "textarea"; optional: boolean; wide: boolean };

function fields(config: FormConfig): Field[] {
  const list: Field[] = [
    { name: "name", label: config.nameLabel, type: "text", optional: false, wide: false },
    { name: "email", label: config.emailLabel, type: "email", optional: false, wide: false },
  ];
  if (config.phoneField) {
    list.push({ name: "phone", label: config.phoneLabel, type: "tel", optional: !config.phoneRequired, wide: false });
  }
  if (config.messageField) {
    list.push({
      name: "message",
      label: config.messageLabel,
      type: "textarea",
      optional: config.messageMinLength === 0,
      wide: true,
    });
  }
  return list;
}

/** The form ships as real HTML; form.js adds the validation. Markup is generated from the options. */
export function renderFormMarkup(config: FormConfig) {
  const palette = config.theme === "dark" ? palettes.dark : palettes.light;
  const accentLuminance = luminance(config.accentColor);
  const vars = [
    `--fm-accent: ${config.accentColor}`,
    `--fm-on-accent: ${accentLuminance > 0.179 ? "#000000" : "#ffffff"}`,
    `--fm-ring: ${accentLuminance <= 0.35 || config.theme === "dark" ? config.accentColor : palette.text}`,
    `--fm-radius: ${config.radius}px`,
    `--fm-surface: ${palette.surface}`,
    `--fm-sunk: ${palette.sunk}`,
    `--fm-text: ${palette.text}`,
    `--fm-muted: ${palette.muted}`,
    `--fm-border: ${palette.border}`,
    `--fm-error: ${palette.error}`,
    `--fm-error-bg: ${palette.errorBg}`,
    `--fm-success: ${palette.success}`,
    `--fm-success-bg: ${palette.successBg}`,
  ].join("; ");

  const optionalMark = (field: Field) =>
    config.optionalMarker && field.optional ? ` <span class="fm-optional">(optional)</span>` : "";

  const inputs = fields(config)
    .map((field) => {
      const control =
        field.type === "textarea"
          ? `          <textarea class="fm-control" id="fm-${field.name}" name="${field.name}" rows="5"></textarea>`
          : `          <input class="fm-control" id="fm-${field.name}" name="${field.name}" type="${field.type}" autocomplete="${field.name === "name" ? "name" : field.name === "email" ? "email" : "tel"}">`;
      return `        <div class="fm-field${field.wide ? " fm-field--wide" : ""}">
          <label class="fm-label" for="fm-${field.name}">${escapeHtml(field.label)}${optionalMark(field)}</label>
          <p class="fm-error" id="fm-${field.name}-error" hidden></p>
${control}
        </div>`;
    })
    .join("\n");

  const consent = config.consentField
    ? `      <div class="fm-consent">
        <p class="fm-error" id="fm-consent-error" hidden></p>
        <label class="fm-checkbox">
          <input id="fm-consent" name="consent" type="checkbox">
          ${escapeHtml(config.consentLabel)}
        </label>
      </div>\n`
    : "";

  return `    <div class="fm fm--${config.layout} fm--theme-${config.theme}" style="${vars}" data-form
      data-validate-on="${config.validateOn}" data-summary="${config.errorSummary}">
      <form class="fm-form" novalidate>
        <h2 class="fm-title">${escapeHtml(config.title)}</h2>
        <p class="fm-success" id="fm-success" tabindex="-1" role="status" hidden>${escapeHtml(config.successMessage)}</p>
        <div class="fm-summary" id="fm-summary" tabindex="-1" role="alert" aria-labelledby="fm-summary-title" hidden>
          <h3 class="fm-summary-title" id="fm-summary-title">There is a problem</h3>
          <ul class="fm-summary-list"></ul>
        </div>
        <div class="fm-grid">
${inputs}
        </div>
${consent}        <button class="fm-submit" type="submit">${escapeHtml(config.submitText)}</button>
      </form>
    </div>`;
}

export function renderFormHtml(config: FormConfig) {
  return htmlPage({ title: "Form with validation", slug: "form", body: renderFormMarkup(config), script: true });
}
