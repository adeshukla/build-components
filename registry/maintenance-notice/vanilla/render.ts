import { escapeHtml, htmlPage, luminance, safeHref } from "@/lib/html";
import type { MaintenanceNoticeConfig } from "../react/maintenance-notice";

const palettes = {
  light: { surface: "#fffaf0", text: "#16121f", muted: "#4d4a57", line: "#e8d9b5" },
  dark: { surface: "#211b10", text: "#f6f5fa", muted: "#c8c0ad", line: "#5a4a28" },
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

/**
 * Written out by hand, the same way the React output does it. Duplicated rather than imported: this is
 * a server module and the React file is a client one.
 */
function sayWindow(startsAt: string, endsAt: string) {
  const parse = (value: string) => {
    const [date, time] = value.split("T");
    const [year, month, day] = (date ?? "").split("-").map(Number);
    return { year, month, day, time: (time ?? "").slice(0, 5) };
  };
  const from = parse(startsAt);
  const to = parse(endsAt);
  if (!from.year || !to.year) return "";
  const sameDay = from.year === to.year && from.month === to.month && from.day === to.day;
  const start = `${from.day} ${MONTHS[from.month - 1]} at ${from.time}`;
  const end = sameDay ? to.time : `${to.day} ${MONTHS[to.month - 1]} at ${to.time}`;
  return `${start} until ${end}`;
}

export function renderMaintenanceNoticeMarkup(config: MaintenanceNoticeConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--mnt-accent: ${config.accentColor}`,
    `--mnt-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...Object.entries(palette).map(([key, value]) => `--mnt-${key}: ${value}`),
  ].join("; ");

  const when = sayWindow(config.startsAt, config.endsAt);
  const glyph =
    config.tone === "warning"
      ? "M12 2 1.5 20.5h21L12 2Zm0 5.5 1 7h-2l1-7Zm0 9.25a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3Z"
      : "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1 5h2v2h-2V7Zm0 4h2v6h-2v-6Z";

  return `    <div class="mnt mnt--theme-${config.theme}" style="${vars}" data-maintenance-notice>
      <!--
        A region landmark, not a live region. The notice is already there when the page loads, so a live
        region would announce nothing; a landmark is findable at any point afterwards.
      -->
      <section class="mnt-notice" aria-labelledby="mnt-heading" data-notice>
        <div class="mnt-inner">
          <svg class="mnt-mark" viewBox="0 0 24 24" aria-hidden="true"><path d="${glyph}"></path></svg>
          <div class="mnt-body">
            <p class="mnt-heading" id="mnt-heading">${escapeHtml(config.heading)}</p>
            ${
              when === ""
                ? ""
                : `<p class="mnt-when"><time datetime="${escapeHtml(config.startsAt)}">${escapeHtml(when)}</time></p>`
            }
            <p class="mnt-message">${escapeHtml(config.message)}</p>
            ${
              config.linkLabel.trim() === ""
                ? ""
                : `<p class="mnt-link-row"><a class="mnt-link" href="${safeHref(config.linkHref)}">${escapeHtml(config.linkLabel)}</a></p>`
            }
          </div>
          ${
            config.dismissible
              ? `<button class="mnt-dismiss" type="button" aria-label="${escapeHtml(config.dismissLabel)}" data-dismiss><span aria-hidden="true">×</span></button>`
              : ""
          }
        </div>
      </section>

      <!-- Something under the notice, so its stickiness can be seen. Delete it in your own page. -->
      <div class="mnt-page">
        <p class="mnt-said" role="status" data-said></p>
        <span aria-hidden="true"></span><span aria-hidden="true"></span><span aria-hidden="true"></span><span aria-hidden="true"></span><span aria-hidden="true"></span><span aria-hidden="true"></span>
      </div>
    </div>`;
}

export function renderMaintenanceNoticeHtml(config: MaintenanceNoticeConfig) {
  return htmlPage({
    title: "Maintenance notice",
    slug: "maintenance-notice",
    body: renderMaintenanceNoticeMarkup(config),
    script: true,
  });
}
