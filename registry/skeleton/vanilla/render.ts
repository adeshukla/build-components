import { escapeHtml, htmlPage } from "@/lib/html";
import type { SkeletonConfig } from "../react/skeleton";

const palettes = {
  light: { surface: "#ffffff", block: "#e6e3ee", line: "#d9d5e4" },
  dark: { surface: "#141019", block: "#2a2438", line: "#3a3448" },
};

/** Line widths that look like text instead of a solid block; the last line is always shorter. */
const widths = ["100%", "92%", "96%", "85%"];

export function renderSkeletonMarkup(config: SkeletonConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = Object.entries(palette).map(([key, value]) => `--sk-${key}: ${value}`).join("; ");
  const lines = Math.max(1, Math.min(8, Math.round(config.lines)));
  const rows = Math.max(1, Math.min(8, Math.round(config.variant === "lines" ? 1 : config.rows)));

  const bars = Array.from({ length: lines }, (_, line) => {
    const width = line === lines - 1 && lines > 1 ? "60%" : widths[line % widths.length];
    return `              <span class="sk-block sk-line" style="width: ${width}"></span>`;
  }).join("\n");

  const body = Array.from({ length: rows }, () => `        <div class="sk-row">
${config.variant === "card" ? '          <span class="sk-block sk-media"></span>\n' : ""}          <div class="sk-text-row">
${config.showAvatar ? '            <span class="sk-block sk-avatar"></span>\n' : ""}            <div class="sk-lines">
${bars}
            </div>
          </div>
        </div>`).join("\n");

  // One polite status for the whole block: a screen reader hears it once, instead of reading a
  // wall of empty boxes.
  return `    <div class="sk sk--${config.variant}${config.animate ? " sk--animate" : ""} sk--theme-${config.theme}" style="${vars}" role="status" aria-live="polite" data-skeleton>
      <span class="sk-sr">${escapeHtml(config.loadingText)}…</span>
      <div class="sk-body" aria-hidden="true">
${body}
      </div>
    </div>`;
}

export function renderSkeletonHtml(config: SkeletonConfig) {
  return htmlPage({ title: "Skeleton", slug: "skeleton", body: renderSkeletonMarkup(config), script: false });
}
