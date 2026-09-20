import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import { fieldName, type FormConfig, type FormField } from "../react/form";

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", muted: "#4d4a57", line: "#8d8a99", sunk: "#f4f3f8", error: "#b4232b" },
  dark: { surface: "#141019", text: "#f6f5fa", muted: "#b6b3c2", line: "#8d8a99", sunk: "#221d2e", error: "#ff8f8f" },
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

const types = ["text", "email", "tel", "url", "number", "date", "textarea", "select", "checkbox"];
const fieldType = (field: FormField) =>
  types.includes(field.type.trim().toLowerCase()) ? field.type.trim().toLowerCase() : "text";
const isRequired = (field: FormField) => /^(yes|true|y|1)$/i.test(field.required.trim());
const choices = (field: FormField) => field.options.split(",").map((option) => option.trim()).filter(Boolean);

/**
 * The form ships as real HTML: every field, label and hint is in the page, so it works and
 * submits before the script runs. The script adds the messages, the summary and the counters.
 * Each field carries its rules as data attributes, which is what the script validates against.
 */
export function renderFormMarkup(config: FormConfig) {
  const fields = config.fields.filter((field) => field.label.trim() !== "");
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--fm-accent: ${config.accentColor}`,
    `--fm-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--fm-on-accent: ${luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff"}`,
    `--fm-radius: ${config.radius}px`,
    `--fm-surface: ${palette.surface}`,
    `--fm-sunk: ${palette.sunk}`,
    `--fm-text: ${palette.text}`,
    `--fm-muted: ${palette.muted}`,
    `--fm-line: ${palette.line}`,
    `--fm-error: ${palette.error}`,
  ].join("; ");

  const rows = fields
    .map((field) => {
      const name = fieldName(field.label);
      const type = fieldType(field);
      const required = isRequired(field);
      const wide = type === "textarea" || type === "checkbox";
      const rules = [
        `data-field="${name}"`,
        `data-type="${type}"`,
        `data-label="${escapeHtml(field.label.trim())}"`,
        `data-required="${required}"`,
        field.min.trim() ? `data-min="${escapeHtml(field.min.trim())}"` : "",
        field.max.trim() ? `data-max="${escapeHtml(field.max.trim())}"` : "",
        field.pattern.trim() ? `data-pattern="${escapeHtml(field.pattern.trim())}"` : "",
        field.help.trim() ? `data-help="${escapeHtml(field.help.trim())}"` : "",
        choices(field).length > 0 ? `data-options="${escapeHtml(choices(field).join("|"))}"` : "",
      ]
        .filter(Boolean)
        .join(" ");
      const describedBy = field.help.trim() ? ` aria-describedby="${name}-help"` : "";
      const hint = field.help.trim()
        ? `            <p class="fm-hint" id="${name}-help">${escapeHtml(field.help)}</p>\n`
        : "";
      const marker =
        config.marker === "optional" && !required
          ? ` <span class="fm-muted">(optional)</span>`
          : config.marker === "required" && required
            ? ` <span class="fm-muted">(required)</span>`
            : "";

      if (type === "checkbox") {
        return `          <div class="fm-row fm-row--wide" ${rules}>
            <div class="fm-check">
              <input class="fm-checkbox" id="${name}" name="${name}" type="checkbox"${describedBy}>
              <label for="${name}">${escapeHtml(field.label)}</label>
            </div>
            <div class="fm-message">
              <p class="fm-error" id="${name}-error" hidden><span class="fm-sr">Error: </span><span data-message></span></p>
            </div>
          </div>`;
      }

      const input =
        type === "textarea"
          ? `            <textarea class="fm-control" id="${name}" name="${name}" rows="5"${field.max.trim() ? ` maxlength="${escapeHtml(field.max.trim())}"` : ""}${describedBy}></textarea>`
          : type === "select"
            ? `            <select class="fm-control" id="${name}" name="${name}"${describedBy}>
              <option value="">Choose one</option>
${choices(field)
  .map((option) => `              <option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`)
  .join("\n")}
            </select>`
            : `            <input class="fm-control" id="${name}" name="${name}" type="${type === "number" ? "text" : type}"${type === "number" ? ' inputmode="numeric"' : ""}${type === "date" && field.min.trim() ? ` min="${escapeHtml(field.min.trim())}"` : ""}${type === "date" && field.max.trim() ? ` max="${escapeHtml(field.max.trim())}"` : ""}${type === "text" && field.max.trim() ? ` maxlength="${escapeHtml(field.max.trim())}"` : ""}${type === "email" ? ' autocomplete="email"' : type === "tel" ? ' autocomplete="tel"' : ""}${describedBy}>`;

      const counter =
        config.counter && field.max.trim() !== "" && (type === "text" || type === "textarea")
          ? `            <p class="fm-hint" aria-live="polite" data-counter>${escapeHtml(field.max.trim())} characters remaining</p>\n`
          : "";

      return `          <div class="fm-row${wide ? " fm-row--wide" : ""}" ${rules}>
            <div class="fm-top">
              <label class="fm-label" for="${name}">${escapeHtml(field.label)}${marker}</label>
${hint}            </div>
${input}
            <div class="fm-message">
              <p class="fm-error" id="${name}-error" hidden><span class="fm-sr">Error: </span><span data-message></span></p>
${counter}            </div>
          </div>`;
    })
    .join("\n");

  const summary = config.errorSummary
    ? `        <div class="fm-summary" role="alert" aria-labelledby="form-summary-title" tabindex="-1" data-summary hidden>
          <h3 class="fm-summary-title" id="form-summary-title">There is a problem</h3>
          <ul class="fm-summary-list" data-summary-list></ul>
        </div>\n`
    : "";

  return `    <section class="fm fm--${config.layout} fm--theme-${config.theme}" style="${vars}" data-form data-validate-on="${config.validateOn}" data-summary-on="${config.errorSummary}">
      <form novalidate data-form-element>
        <div class="fm-intro">
          <h2 class="fm-title">${escapeHtml(config.title)}</h2>
${config.intro.trim() ? `          <p class="fm-muted">${escapeHtml(config.intro)}</p>\n` : ""}        </div>
        <p class="fm-success" role="status" tabindex="-1" data-success hidden>${escapeHtml(config.successMessage)}</p>
${summary}        <div class="fm-fields">
${rows}
        </div>
        <div>
          <button class="fm-submit" type="submit">${escapeHtml(config.submitText)}</button>
        </div>
      </form>
    </section>`;
}

export function renderFormHtml(config: FormConfig) {
  return htmlPage({ title: "Form with validation", slug: "form", body: renderFormMarkup(config), script: true });
}
