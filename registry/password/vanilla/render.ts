import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { PasswordConfig } from "../react/password";

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#8d8a99", good: "#1a7f52", bad: "#b4232b" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#8d8a99", good: "#6ddba4", bad: "#ff8f8f" },
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
 * The field, the label and the rules ship as real HTML, so the requirements are known before
 * the script runs. The script adds the show button, the strength and the met/unmet marks.
 */
export function renderPasswordMarkup(config: PasswordConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--pw-accent: ${config.accentColor}`,
    `--pw-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--pw-radius: ${config.radius}px`,
    `--pw-surface: ${palette.surface}`,
    `--pw-sunk: ${palette.sunk}`,
    `--pw-text: ${palette.text}`,
    `--pw-muted: ${palette.muted}`,
    `--pw-line: ${palette.line}`,
    `--pw-good: ${palette.good}`,
    `--pw-bad: ${palette.bad}`,
  ].join("; ");

  const rules = [`At least ${config.minLength} characters|length`];
  if (config.requireNumber) rules.push("A number|number");
  if (config.requireUpper) rules.push("A capital letter|upper");
  if (config.requireSymbol) rules.push("A symbol, such as ! or ?|symbol");

  const ruleList = config.showRules
    ? `      <ul class="pw-rules" id="password-rules" data-rules>
${rules
  .map((rule) => {
    const [text, kind] = rule.split("|");
    return `        <li class="pw-rule" data-rule="${kind}"><span class="pw-mark" aria-hidden="true">•</span><span>${escapeHtml(text)}<span class="pw-sr" data-state> (not met yet)</span></span></li>`;
  })
  .join("\n")}
      </ul>\n`
    : "";

  const meter = config.showMeter
    ? `      <div class="pw-meter">
        <div class="pw-bars" aria-hidden="true">
          <span class="pw-bar" data-bar="1"></span><span class="pw-bar" data-bar="2"></span><span class="pw-bar" data-bar="3"></span><span class="pw-bar" data-bar="4"></span>
        </div>
        <p class="pw-strength" aria-live="polite" data-strength>Password strength: Enter a password</p>
      </div>\n`
    : "";

  const describedBy = [config.hint.trim() ? "password-hint" : "", config.showRules ? "password-rules" : ""]
    .filter(Boolean)
    .join(" ");

  const settings = [
    "data-password",
    `data-min="${config.minLength}"`,
    `data-number="${config.requireNumber}"`,
    `data-upper="${config.requireUpper}"`,
    `data-symbol="${config.requireSymbol}"`,
    `data-caps="${config.capsWarning}"`,
  ].join(" ");

  return `    <div class="pw pw--theme-${config.theme}" style="${vars}" ${settings}>
      <label class="pw-label" for="password-input">${escapeHtml(config.label)}</label>
${config.hint.trim() ? `      <p class="pw-hint" id="password-hint">${escapeHtml(config.hint)}</p>\n` : ""}      <div class="pw-row">
        <input class="pw-input" id="password-input" type="password" autocomplete="new-password"${describedBy ? ` aria-describedby="${describedBy}"` : ""} data-input>
${config.showToggle ? `        <button class="pw-toggle" type="button" aria-pressed="false" data-toggle>Show<span class="pw-sr"> password</span></button>\n` : ""}      </div>
${config.capsWarning ? `      <p class="pw-caps" role="status" data-caps hidden>Caps Lock is on.</p>\n` : ""}${meter}${ruleList}    </div>`;
}

export function renderPasswordHtml(config: PasswordConfig) {
  return htmlPage({ title: "Password field", slug: "password", body: renderPasswordMarkup(config), script: true });
}
