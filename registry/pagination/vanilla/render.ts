import { escapeHtml, htmlPage, luminance, safeHref } from "@/lib/html";
import { pagesFor, type PaginationConfig } from "../react/pagination";

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", muted: "#4d4a57", line: "#d9d5e4", hover: "#f4f3f8" },
  dark: { surface: "#141019", text: "#f6f5fa", muted: "#b6b3c2", line: "#3a3448", hover: "#221d2e" },
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

const icons = {
  previous: `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6l-6 6 6 6"/></svg>`,
  next: `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>`,
};

/**
 * The pages ship as real HTML around the starting page, so the set reads before the script
 * runs. With a link pattern set they are links and need no script at all.
 */
export function renderPaginationMarkup(config: PaginationConfig) {
  const total = Math.max(1, Math.round(config.totalPages));
  const current = Math.min(total, Math.max(1, Math.round(config.startPage)));
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const accentLuminance = luminance(config.accentColor);
  const vars = [
    `--pg-accent: ${config.accentColor}`,
    `--pg-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--pg-on-accent: ${accentLuminance > 0.179 ? "#000000" : "#ffffff"}`,
    `--pg-radius: ${config.radius}px`,
    `--pg-surface: ${palette.surface}`,
    `--pg-text: ${palette.text}`,
    `--pg-muted: ${palette.muted}`,
    `--pg-line: ${palette.line}`,
    `--pg-hover: ${palette.hover}`,
  ].join("; ");

  const pattern = config.hrefPattern.trim();
  const href = (page: number) => escapeHtml(safeHref(pattern.replace("{page}", String(page))));

  const pageItem = (page: number) => {
    const isCurrent = page === current;
    const attrs = `class="pg-step pg-page${isCurrent ? " pg-current" : ""}" aria-label="Page ${page}"${isCurrent ? ' aria-current="page"' : ""} data-page="${page}"`;
    return pattern === ""
      ? `          <li><button type="button" ${attrs}>${page}</button></li>`
      : `          <li><a href="${href(page)}" ${attrs}>${page}</a></li>`;
  };

  const numbers =
    config.look === "numbers"
      ? pagesFor(current, total, Math.max(0, Math.round(config.siblings)))
          .map((page) =>
            page === "gap"
              ? `          <li class="pg-gap" aria-hidden="true">…</li>`
              : pageItem(page),
          )
          .join("\n")
      : "";

  const arrow = (direction: "previous" | "next") => {
    const page = direction === "previous" ? current - 1 : current + 1;
    const disabled = direction === "previous" ? current === 1 : current === total;
    const text = escapeHtml(direction === "previous" ? config.prevText : config.nextText);
    const inner = direction === "previous" ? `${icons.previous}${text}` : `${text}${icons.next}`;
    if (pattern !== "" && !disabled) {
      return `          <li><a class="pg-step" href="${href(page)}" rel="${direction}" data-page="${page}">${inner}</a></li>`;
    }
    return `          <li><button class="pg-step" type="button" data-${direction}${disabled ? " disabled" : ""}>${inner}</button></li>`;
  };

  const firstLast =
    config.firstLast && config.look === "numbers"
      ? `        <div class="pg-ends">
          <button class="pg-step" type="button" data-first${current === 1 ? " disabled" : ""}>First</button>
          <button class="pg-step" type="button" data-last${current === total ? " disabled" : ""}>Last</button>
        </div>\n`
      : "";

  const summary = config.summary
    ? `        <p class="pg-summary" aria-live="polite" data-summary>Page ${current} of ${total}</p>\n`
    : "";

  return `    <nav class="pg pg--${config.look} pg--theme-${config.theme}" style="${vars}" aria-label="${escapeHtml(config.label)}" data-pagination data-total="${total}" data-current="${current}" data-siblings="${Math.max(0, Math.round(config.siblings))}" data-pattern="${escapeHtml(pattern)}">
      <div class="pg-row">
        <ul class="pg-list" data-list>
${arrow("previous")}
${numbers}
${arrow("next")}
        </ul>
${summary}${firstLast}      </div>
    </nav>`;
}

export function renderPaginationHtml(config: PaginationConfig) {
  return htmlPage({ title: "Pagination", slug: "pagination", body: renderPaginationMarkup(config), script: true });
}
