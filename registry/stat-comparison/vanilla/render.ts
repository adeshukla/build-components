import { escapeHtml, htmlPage, luminance, themedColour } from "@/lib/html";
import type { StatComparisonConfig } from "../react/stat-comparison";

const palettes = {
  light: { surface: "#ffffff", sunk: "#f1f5f4", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#141019", sunk: "#1c2422", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
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

export function renderStatComparisonMarkup(config: StatComparisonConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--stc-accent: ${config.accentColor}`,
    `--stc-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...(config.theme === "system" ? [] : Object.entries(palette).map(([key, value]) => `--stc-${key}: ${themedColour(key, value, dark)}`)),
  ].join("; ");

  const cell = (side: "left" | "right", row: StatComparisonConfig["rows"][number]) => {
    const winner = config.showBetter && row.better === side;
    const value = side === "left" ? row.left : row.right;
    return `<td class="stc-value" data-side="${side}"${winner ? ' data-better="true"' : ""}>${escapeHtml(value)}${
      winner
        ? // Which one is better is said in words, not by a tint.
          `<span class="stc-better">${escapeHtml(config.betterWord)}</span>`
        : ""
    }</td>`;
  };

  const rows = config.rows
    .map(
      (row) => `          <tr class="stc-row">
            <!-- The measure is the row's header, so a reader says it alongside both values. -->
            <th class="stc-metric" scope="row">${escapeHtml(row.metric)}</th>
            ${cell("left", row)}
            ${cell("right", row)}
          </tr>`,
    )
    .join("\n");

  return `    <div class="stc stc--theme-${config.theme}" style="${vars}">
      <!--
        Three columns do not fit on a phone, and squeezing them breaks the words up a letter or two at
        a time. Below the width they fit in, the table keeps its columns and scrolls sideways — as a
        labelled region that takes focus, because a thing you can only reach by dragging is no use to
        a keyboard.
      -->
      <div class="stc-scroll" role="region" aria-label="${escapeHtml(config.caption)}" tabindex="0">
      <table class="stc-table">
        <caption class="stc-caption">${escapeHtml(config.caption)}</caption>
        <thead class="stc-head">
          <tr>
            <!--
              The first header can be empty to the eye but never to the markup: it is the corner of the
              table, and a blank th with no scope leaves the column headers unanchored.
            -->
            <th class="stc-corner" scope="col">${
              config.metricHeader.trim() === ""
                ? `<span class="stc-sr">${escapeHtml(config.measureHeader)}</span>`
                : escapeHtml(config.metricHeader)
            }</th>
            <th class="stc-option" scope="col">${escapeHtml(config.leftHeader)}</th>
            <th class="stc-option" scope="col">${escapeHtml(config.rightHeader)}</th>
          </tr>
        </thead>
        <tbody>
${rows}
        </tbody>
      </table>
      </div>

      ${config.note.trim() === "" ? "" : `<p class="stc-note">${escapeHtml(config.note)}</p>`}
    </div>`;
}

export function renderStatComparisonHtml(config: StatComparisonConfig) {
  return htmlPage({
    title: "Stat comparison",
    slug: "stat-comparison",
    body: renderStatComparisonMarkup(config),
    script: false,
  });
}
