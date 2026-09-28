import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { NotificationListConfig } from "../react/notification-list";

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

export function renderNotificationListMarkup(config: NotificationListConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--ntf-accent: ${config.accentColor}`,
    `--ntf-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--ntf-on-accent: ${luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff"}`,
    ...Object.entries(palette).map(([key, value]) => `--ntf-${key}: ${value}`),
  ].join("; ");

  const items = config.items
    .map((item) => {
      const unread = item.unread === "yes";
      return `        <li class="ntf-item" data-unread="${unread ? "true" : "false"}" data-item>
          <div class="ntf-body">
            <p class="ntf-title">${escapeHtml(item.title)}<!-- Unread is a word as well as a bar, never colour or a dot alone. --><span class="ntf-flag"${unread ? "" : " hidden"} data-flag>${escapeHtml(config.unreadWord)}</span></p>
            <p class="ntf-meta">${escapeHtml(item.meta)}</p>
          </div>
          <button class="ntf-mark-one" type="button" aria-label="${escapeHtml(`${config.markOneLabel}: ${item.title}`)}"${unread ? "" : " hidden"} data-mark-one>${escapeHtml(config.markOneLabel)}</button>
        </li>`;
    })
    .join("\n");

  return `    <div class="ntf ntf--theme-${config.theme}" style="${vars}" data-notification-list>
      <div class="ntf-top">
        <h2 class="ntf-heading" id="ntf-heading" data-heading>${escapeHtml(config.heading)}</h2>
        <button class="ntf-mark-all" type="button" data-mark-all>${escapeHtml(config.markAllLabel)}</button>
      </div>

      <ul class="ntf-list" aria-labelledby="ntf-heading">
${items}
      </ul>

      <p class="ntf-status" role="status" data-status></p>
    </div>`;
}

export function renderNotificationListHtml(config: NotificationListConfig) {
  return htmlPage({
    title: "Notification list",
    slug: "notification-list",
    body: renderNotificationListMarkup(config),
    script: true,
  });
}
