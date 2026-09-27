import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { ComparisonTableConfig } from "../react/comparison-table";

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

export function renderComparisonTableMarkup(config: ComparisonTableConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--cp-accent: ${config.accentColor}`,
    `--cp-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...Object.entries(palette).map(([key, value]) => `--cp-${key}: ${value}`),
  ].join("; ");

  const plans = config.plans.filter((plan) => plan.name.trim() !== "").slice(0, 3);
  const rows = config.rows.filter((row) => row.feature.trim() !== "");

  /** "yes" and "no" become words, so the table reads the same out loud as it looks. */
  function cell(value: string) {
    const said = value.trim().toLowerCase();
    if (said === "yes") return { text: config.yesText, mark: "✓", tone: "yes" };
    if (said === "no") return { text: config.noText, mark: "✕", tone: "no" };
    return { text: value, mark: "", tone: "text" };
  }

  const head = plans
    .map((plan) => {
      const featured = plan.name === config.highlight;
      return `            <th class="cp-plan${featured ? " cp-plan--featured" : ""}" scope="col">
              <span class="cp-name">${escapeHtml(plan.name)}</span>
${plan.note.trim() === "" ? "" : `              <span class="cp-note">${escapeHtml(plan.note)}</span>\n`}${featured ? `              <span class="cp-badge">Most picked</span>\n` : ""}            </th>`;
    })
    .join("\n");

  const body = rows
    .map((row) => {
      const cells = [row.a, row.b, row.c]
        .slice(0, plans.length)
        .map((value, index) => {
          const shown = cell(value);
          const featured = plans[index].name === config.highlight;
          const mark = shown.mark === "" ? "" : `<span class="cp-mark--${shown.tone}" aria-hidden="true">${shown.mark}</span>`;
          return `              <td class="cp-cell${featured ? " cp-cell--featured" : ""}">${mark}<span class="${shown.tone === "no" ? "cp-value--no" : ""}">${escapeHtml(shown.text)}</span></td>`;
        })
        .join("\n");
      return `            <tr class="cp-row">
              <th class="cp-feature" scope="row">${escapeHtml(row.feature)}</th>
${cells}
            </tr>`;
    })
    .join("\n");

  return `    <div class="cp cp--theme-${config.theme}" style="${vars}" data-comparison-table>
      <div class="cp-scroll">
        <table class="cp-table">
          <caption class="cp-caption">${escapeHtml(config.caption)}</caption>
          <thead>
            <tr>
            <th class="cp-col" scope="col">Feature</th>
${head}
            </tr>
          </thead>
          <tbody>
${body}
          </tbody>
        </table>
      </div>
    </div>`;
}

export function renderComparisonTableHtml(config: ComparisonTableConfig) {
  return htmlPage({ title: "Comparison table", slug: "comparison-table", body: renderComparisonTableMarkup(config), script: false });
}
