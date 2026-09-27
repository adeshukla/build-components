import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { SelectFieldConfig } from "../react/select-field";

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

export function renderSelectFieldMarkup(config: SelectFieldConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--sf-accent: ${config.accentColor}`,
    `--sf-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...Object.entries(palette).map(([key, value]) => `--sf-${key}: ${value}`),
  ].join("; ");

  const options = config.options.filter((option) => option.label.trim() !== "");
  // Options carrying a group name are wrapped in optgroups; the rest sit at the top level.
  const groups = [...new Set(options.map((option) => option.group.trim()))];

  const body = groups
    .map((group) => {
      const inGroup = options
        .filter((option) => option.group.trim() === group)
        .map((option) => `          <option value="${escapeHtml(option.label)}">${escapeHtml(option.label)}</option>`)
        .join("\n");
      return group === ""
        ? inGroup
        : `        <optgroup label="${escapeHtml(group)}">\n${inGroup}\n        </optgroup>`;
    })
    .join("\n");

  return `    <div class="sf sf--theme-${config.theme} sf--${config.width} sf--${config.size}" style="${vars}" data-select-field data-required="${config.required}">
      <label class="sf-label" for="sf-field">${escapeHtml(config.label)}${config.required ? `<span class="sf-needed">(needed)</span>` : ""}</label>
${config.hint.trim() === "" ? "" : `      <p class="sf-hint" id="sf-hint">${escapeHtml(config.hint)}</p>\n`}      <!-- A native select: the phone shows its own picker, the keyboard works, and type-ahead is free. -->
      <select class="sf-field" id="sf-field" name="${escapeHtml(config.name)}"${config.required ? " required" : ""}${config.hint.trim() === "" ? "" : ' aria-describedby="sf-hint"'} data-field>
        <option value="">${escapeHtml(config.placeholder)}</option>
${body}
      </select>

      <p class="sf-error" id="sf-error" role="alert" hidden data-error>${escapeHtml(config.errorText)}</p>
      <button class="sf-go" type="button" data-go>Carry on</button>
      <p class="sf-status" role="status" data-status></p>
    </div>`;
}

export function renderSelectFieldHtml(config: SelectFieldConfig) {
  return htmlPage({ title: "Select field", slug: "select-field", body: renderSelectFieldMarkup(config), script: true });
}
