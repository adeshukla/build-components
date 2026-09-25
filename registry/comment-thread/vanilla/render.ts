import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { CommentThreadConfig } from "../react/comment-thread";

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

export function renderCommentThreadMarkup(config: CommentThreadConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--ct-accent: ${config.accentColor}`,
    `--ct-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--ct-on-accent: ${luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff"}`,
    ...Object.entries(palette).map(([key, value]) => `--ct-${key}: ${value}`),
  ].join("; ");

  const comments = config.comments.filter((comment) => comment.body.trim() !== "");

  const items = comments
    .map((comment) => {
      const reply = comment.reply === "yes";
      return `        <li class="ct-comment${reply ? " ct-comment--reply" : ""}" data-comment>
          <p class="ct-meta"><span class="ct-author">${escapeHtml(comment.author)}</span><span class="ct-when">${escapeHtml(comment.when)}</span>${reply ? `<span class="ct-tag">· reply</span>` : ""}</p>
          <p class="ct-body">${escapeHtml(comment.body)}</p>
        </li>`;
    })
    .join("\n");

  const form = config.allowReply
    ? `      <div class="ct-form">
        <label class="ct-label" for="ct-field">${escapeHtml(config.replyLabel)}</label>
        <textarea class="ct-field" id="ct-field" rows="3" data-field></textarea>
        <button class="ct-post" type="button" disabled data-post>${escapeHtml(config.postText)}</button>
      </div>\n`
    : "";

  return `    <div class="ct ct--theme-${config.theme}" style="${vars}" data-comment-thread data-you="${escapeHtml(config.yourName)}">
      <div class="ct-head">
        <h2 class="ct-heading">${escapeHtml(config.heading)}<span class="ct-count" data-count> (${comments.length})</span></h2>
${config.collapsible ? `        <button class="ct-toggle" type="button" aria-expanded="true" aria-controls="ct-list" data-toggle>Hide the thread</button>` : ""}
      </div>

      <!-- Replies are nested in their own list, so the shape of the conversation is in the markup. -->
      <ul class="ct-list" id="ct-list" data-list>
${items}
      </ul>

${form}      <!-- A comment appearing further up the page is silent otherwise. -->
      <p class="ct-status" role="status" data-status></p>
    </div>`;
}

export function renderCommentThreadHtml(config: CommentThreadConfig) {
  return htmlPage({ title: "Comment thread", slug: "comment-thread", body: renderCommentThreadMarkup(config), script: true });
}
