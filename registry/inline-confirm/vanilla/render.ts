import { escapeHtml, htmlPage, luminance, themedColour } from "@/lib/html";
import type { InlineConfirmConfig } from "../react/inline-confirm";

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

export function renderInlineConfirmMarkup(config: InlineConfirmConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--icf-accent: ${config.accentColor}`,
    `--icf-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--icf-on-accent: ${luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff"}`,
    ...(config.theme === "system" ? [] : Object.entries(palette).map(([key, value]) => `--icf-${key}: ${themedColour(key, value, dark)}`)),
  ].join("; ");

  return `    <div class="icf icf--theme-${config.theme}" style="${vars}" data-inline-confirm>
      <ul class="icf-list">
        <!-- The row keeps its height whichever state it is in, so nothing moves out from under a pointer. -->
        <li class="icf-row" tabindex="-1" data-row>
          <span class="icf-name" data-name>${escapeHtml(config.itemLabel)}</span>

          <button class="icf-button icf-start" type="button" data-start>${escapeHtml(config.actionLabel)}</button>

          <!--
            A named group: the focus move into it announces the question, so nothing has to be shouted
            through a live region.
          -->
          <div class="icf-ask" role="group" aria-labelledby="icf-question" hidden data-ask>
            <span class="icf-question" id="icf-question">${escapeHtml(config.question)}</span>
            <button class="icf-button icf-confirm" type="button" data-confirm>${escapeHtml(config.confirmLabel)}</button>
            <button class="icf-button" type="button" data-cancel>${escapeHtml(config.cancelLabel)}</button>
          </div>

          <span class="icf-done" hidden data-done>${escapeHtml(config.doneText)}</span>
        </li>
      </ul>

      <p class="icf-result" role="status" data-result></p>
    </div>`;
}

export function renderInlineConfirmHtml(config: InlineConfirmConfig) {
  return htmlPage({ title: "Inline confirm", slug: "inline-confirm", body: renderInlineConfirmMarkup(config), script: true });
}
