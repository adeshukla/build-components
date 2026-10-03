import { escapeHtml, htmlPage, luminance, themedColour } from "@/lib/html";
import type { BottomSheetConfig } from "../react/bottom-sheet";

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#1b1624", sunk: "#272031", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
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

export function renderBottomSheetMarkup(config: BottomSheetConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--bsh-accent: ${config.accentColor}`,
    `--bsh-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--bsh-on-accent: ${luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff"}`,
    ...(config.theme === "system" ? [] : Object.entries(palette).map(([key, value]) => `--bsh-${key}: ${themedColour(key, value, dark)}`)),
  ].join("; ");

  const steps = config.detents === "full" ? ["full"] : config.detents === "half-full" ? ["half", "full"] : ["peek", "half", "full"];
  const at = Math.max(steps.indexOf(config.startAt), 0);

  return `    <div class="bsh bsh--theme-${config.theme}${config.centreOnWide ? " bsh--centre" : ""}" style="${vars}" data-bottom-sheet>
      <button class="bsh-trigger" type="button" data-trigger>${escapeHtml(config.triggerLabel)}</button>

      <p class="bsh-result" role="status" data-result></p>

      <dialog class="bsh-sheet" aria-labelledby="bsh-title" data-detent="${steps[at]}" data-sheet>
        <div class="bsh-frame">
        <div class="bsh-grip">
          <!--
            The handle is a real button, not a decorative bar: the heights have to be reachable without
            dragging, which nobody on a keyboard and few people with a tremor can do.
          -->
          <button class="bsh-handle" type="button" aria-label="${escapeHtml(config.expandLabel)}" data-handle><span aria-hidden="true"></span></button>
        </div>

        <div class="bsh-body">
          <h2 class="bsh-title" id="bsh-title">${escapeHtml(config.title)}</h2>
          <p class="bsh-text">${escapeHtml(config.body)}</p>
          <!-- Which height it is at, in words: a bar that has moved is not a message. -->
          <p class="bsh-height" role="status" data-height></p>
        </div>

        <div class="bsh-actions">
          <button class="bsh-confirm" type="button" data-confirm>${escapeHtml(config.confirmLabel)}</button>
          <button class="bsh-cancel" type="button" data-cancel>${escapeHtml(config.cancelLabel)}</button>
        </div>
        </div>
      </dialog>
    </div>`;
}

export function renderBottomSheetHtml(config: BottomSheetConfig) {
  return htmlPage({ title: "Bottom sheet", slug: "bottom-sheet", body: renderBottomSheetMarkup(config), script: true });
}
