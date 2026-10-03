import { escapeHtml, htmlPage, luminance, themedColour } from "@/lib/html";
import type { HelpHintConfig } from "../react/help-hint";

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
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

export function renderHelpHintMarkup(config: HelpHintConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--hlp-accent: ${config.accentColor}`,
    `--hlp-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...(config.theme === "system" ? [] : Object.entries(palette).map(([key, value]) => `--hlp-${key}: ${themedColour(key, value, dark)}`)),
  ].join("; ");

  const hasExample = config.exampleText.trim() !== "";
  // The help joins the field's description while it is open, so it is read as part of the question.
  const described = ["hlp-hint", hasExample ? "hlp-example" : "", config.startOpen ? "hlp-help" : ""]
    .filter(Boolean)
    .join(" ");

  return `    <div class="hlp hlp--theme-${config.theme}" style="${vars}" data-help-hint>
      <label class="hlp-label" for="hlp-field">${escapeHtml(config.label)}</label>

      <p class="hlp-hint" id="hlp-hint">${escapeHtml(config.shortHint)}</p>

      <!--
        A disclosure, not a tooltip. Help that has to be hovered cannot be read twice, cannot be copied
        from, and vanishes the moment the pointer moves — and on a touch screen it barely exists.
      -->
      <button class="hlp-toggle" type="button" aria-expanded="${config.startOpen ? "true" : "false"}" aria-controls="hlp-help" data-toggle>
        <span class="hlp-mark" aria-hidden="true">?</span>${escapeHtml(config.buttonLabel)}
      </button>

      <div class="hlp-help" id="hlp-help"${config.startOpen ? "" : " hidden"} data-help>
        <p class="hlp-help-title">${escapeHtml(config.helpTitle)}</p>
        <p class="hlp-help-text">${escapeHtml(config.helpText)}</p>
      </div>

      ${hasExample ? `<p class="hlp-example" id="hlp-example">${escapeHtml(config.exampleText)}</p>` : ""}

      <input class="hlp-field" id="hlp-field" name="${escapeHtml(config.name)}" type="text"${
        config.placeholder === "" ? "" : ` placeholder="${escapeHtml(config.placeholder)}"`
      } aria-describedby="${described}" data-field>
    </div>`;
}

export function renderHelpHintHtml(config: HelpHintConfig) {
  return htmlPage({ title: "Help hint", slug: "help-hint", body: renderHelpHintMarkup(config), script: true });
}
