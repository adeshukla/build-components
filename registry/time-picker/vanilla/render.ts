import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { TimePickerConfig } from "../react/time-picker";

// The same two helpers as the React file (which is a client module, so its functions can't be
// imported here) and the plain JS.
function parseTime(raw: string): number | null {
  const match = raw.trim().toLowerCase().replace(/[\s.]/g, "").match(/^(\d{1,2})(?::?(\d{2}))?(am|pm|a|p)?$/);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2] ?? 0);
  const half = match[3]?.[0];
  if (minutes > 59) return null;
  if (half) {
    if (hours < 1 || hours > 12) return null;
    hours = (hours % 12) + (half === "p" ? 12 : 0);
  } else if (hours > 23) {
    return null;
  }
  return hours * 60 + minutes;
}

function formatTime(total: number, format: "24h" | "12h") {
  const hours = Math.floor(total / 60);
  const minutes = String(total % 60).padStart(2, "0");
  if (format === "24h") return `${String(hours).padStart(2, "0")}:${minutes}`;
  return `${hours % 12 || 12}:${minutes} ${hours < 12 ? "am" : "pm"}`;
}

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", muted: "#4d4a57", border: "#737373", line: "#d9d5e4", hover: "#eeecf5", error: "#b3261e" },
  dark: { surface: "#141019", text: "#f6f5fa", muted: "#b6b3c2", border: "#8e8a99", line: "#3a3448", hover: "#2a2438", error: "#ff6b6b" },
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

/** The field ships in the HTML, so it can be typed into before the script runs. */
export function renderTimePickerMarkup(config: TimePickerConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const earliest = parseTime(config.earliest) ?? 0;
  const latest = Math.max(earliest, parseTime(config.latest) ?? 23 * 60 + 59);
  const start = parseTime(config.startValue);
  const startValue = start !== null && start >= earliest && start <= latest ? start : null;
  const vars = [
    `--tp-accent: ${config.accentColor}`,
    `--tp-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--tp-on-accent: ${luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff"}`,
    ...Object.entries(palette).map(([key, value]) => `--tp-${key}: ${value}`),
  ].join("; ");
  const hasHint = config.hint.trim() !== "";
  const describedBy = ["time-picker-format", hasHint && "time-picker-hint", "time-picker-error"].filter(Boolean).join(" ");
  const noun = config.label.toLowerCase() || "time";

  return `    <div class="tp tp--theme-${config.theme}" style="${vars}" data-time-picker data-format="${config.format}" data-interval="${Number(config.interval) || 30}" data-earliest="${earliest}" data-latest="${latest}">
      <label class="tp-label" id="time-picker-label" for="time-picker-input">${escapeHtml(config.label)}</label>
${hasHint ? `      <p class="tp-hint" id="time-picker-hint">${escapeHtml(config.hint)}</p>\n` : ""}      <div class="tp-control">
        <div class="tp-field">
          <input class="tp-input" id="time-picker-input" type="text" role="combobox" autocomplete="off" aria-autocomplete="list" aria-expanded="false" aria-controls="time-picker-listbox" aria-describedby="${describedBy}" placeholder="${config.format === "24h" ? "hh:mm" : "h:mm am"}" value="${startValue === null ? "" : formatTime(startValue, config.format)}" data-input>
          <button class="tp-toggle" type="button" tabindex="-1" aria-label="Show ${escapeHtml(noun)} options" aria-expanded="false" aria-controls="time-picker-listbox" data-toggle>
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
          </button>
        </div>
        <span class="tp-sr" id="time-picker-format">Format: ${config.format === "24h" ? "24-hour, for example 14:30" : "12-hour, for example 2:30 pm"}.</span>
        <ul class="tp-list" id="time-picker-listbox" role="listbox" aria-labelledby="time-picker-label" hidden data-list></ul>
      </div>
      <p class="tp-error" id="time-picker-error" role="alert" data-error></p>
      <p class="tp-sr" aria-live="polite" data-status></p>
${config.name ? `      <input type="hidden" name="${escapeHtml(config.name)}" value="${startValue === null ? "" : formatTime(startValue, "24h")}" data-value>\n` : ""}    </div>`;
}

export function renderTimePickerHtml(config: TimePickerConfig) {
  return htmlPage({ title: "Time picker", slug: "time-picker", body: renderTimePickerMarkup(config), script: true });
}
