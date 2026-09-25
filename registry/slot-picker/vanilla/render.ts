import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { SlotPickerConfig } from "../react/slot-picker";

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

export function renderSlotPickerMarkup(config: SlotPickerConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--sl-accent: ${config.accentColor}`,
    `--sl-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--sl-on-accent: ${luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff"}`,
    ...Object.entries(palette).map(([key, value]) => `--sl-${key}: ${value}`),
  ].join("; ");

  const slots = config.slots.filter((slot) => slot.time.trim() !== "");
  const days = [...new Set(slots.map((slot) => slot.day))];
  const free = slots.filter((slot) => slot.state !== "taken");

  const groups = days
    .map((day) => {
      const times = slots
        .filter((slot) => slot.day === day)
        .map((slot) => {
          const taken = slot.state === "taken";
          const value = `${day} at ${slot.time}`;
          return `            <label class="sl-slot"><input class="sl-sr" type="radio" name="sl-slot" value="${escapeHtml(value)}"${taken ? " disabled" : ""} data-slot>${escapeHtml(slot.time)}${taken ? `<span class="sl-taken">(taken)</span>` : ""}</label>`;
        })
        .join("\n");
      return `        <div class="sl-day" role="group" aria-label="${escapeHtml(day)}">
          <p class="sl-day-name">${escapeHtml(day)}</p>
          <div class="sl-times">
${times}
          </div>
        </div>`;
    })
    .join("\n");

  return `    <div class="sl sl--theme-${config.theme}" style="${vars}" data-slot-picker>
      <fieldset class="sl-set" aria-describedby="sl-note">
        <legend class="sl-legend">${escapeHtml(config.heading)}</legend>
        <p class="sl-note" id="sl-note">${escapeHtml(config.timezoneNote)} ${free.length} of ${slots.length} times are free.</p>
${groups}
      </fieldset>

      <button class="sl-confirm" type="button" disabled data-confirm>${escapeHtml(config.confirmText)}</button>

      <!-- The time on its own ("10:30") means little: the announcement carries the day as well. -->
      <p class="sl-status" role="status" data-status>No time picked yet</p>
    </div>`;
}

export function renderSlotPickerHtml(config: SlotPickerConfig) {
  return htmlPage({ title: "Booking slot picker", slug: "slot-picker", body: renderSlotPickerMarkup(config), script: true });
}
