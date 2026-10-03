import { escapeHtml, htmlPage, luminance, themedColour } from "@/lib/html";
import type { OrderTrackerConfig } from "../react/order-tracker";

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

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Written out by hand, the same way the React output does it. Duplicated: that file is a client one. */
function sayDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return "";
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

export function renderOrderTrackerMarkup(config: OrderTrackerConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--ord-accent: ${config.accentColor}`,
    `--ord-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--ord-on-accent: ${luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff"}`,
    ...(config.theme === "system" ? [] : Object.entries(palette).map(([key, value]) => `--ord-${key}: ${themedColour(key, value, dark)}`)),
  ].join("; ");

  const at = Math.min(Math.max(config.currentStep, 1), config.steps.length);
  const now = config.steps[at - 1];

  const steps = config.steps
    .map((step, index) => {
      const state = index + 1 < at ? "done" : index + 1 === at ? "current" : "todo";
      const word = state === "done" ? config.doneWord : state === "current" ? config.currentWord : config.todoWord;
      return `        <li class="ord-step" data-state="${state}"${state === "current" ? ' aria-current="step"' : ""}>
          <!-- The marker is a picture of the state the words already give, so it is hidden. -->
          <span class="ord-mark" aria-hidden="true">${state === "done" ? "✓" : ""}</span>
          <div class="ord-body">
            <p class="ord-label">${escapeHtml(step.label)}</p>
            <!-- The state is a word next to the step, never the tick or the colour alone. -->
            <p class="ord-state">${escapeHtml(word)}</p>
            ${step.detail === "" ? "" : `<p class="ord-detail">${escapeHtml(step.detail)}</p>`}
            ${step.date === "" ? "" : `<p class="ord-date"><time datetime="${escapeHtml(step.date)}">${escapeHtml(sayDate(step.date))}</time></p>`}
          </div>
        </li>`;
    })
    .join("\n");

  return `    <div class="ord ord--theme-${config.theme}" style="${vars}">
      <h2 class="ord-heading">${escapeHtml(config.heading)}</h2>
      <p class="ord-reference">${escapeHtml(config.reference)}</p>

      <!--
        Where the order is, in one sentence, before the list. It is the answer most people came for, and
        it is the only part a screen reader has to hear to get it.
      -->
      <p class="ord-now">${now === undefined ? "" : escapeHtml(`${config.currentWord}: ${now.label}.${now.detail === "" ? "" : ` ${now.detail}`}`)}</p>

      <ol class="ord-list" data-layout="${config.layout}">
${steps}
      </ol>
    </div>`;
}

export function renderOrderTrackerHtml(config: OrderTrackerConfig) {
  return htmlPage({ title: "Order tracker", slug: "order-tracker", body: renderOrderTrackerMarkup(config), script: false });
}
