import { escapeHtml, htmlPage, luminance, themedColour } from "@/lib/html";
import type { ChangelogConfig } from "../react/changelog";

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
  if (!year || !month || !day) return iso;
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

function toReleases(entries: ChangelogConfig["entries"]) {
  const releases: { version: string; date: string; kinds: { kind: string; items: string[] }[] }[] = [];
  for (const entry of entries) {
    let release = releases[releases.length - 1];
    if (release === undefined || release.version !== entry.version) {
      release = { version: entry.version, date: entry.date, kinds: [] };
      releases.push(release);
    }
    const group = release.kinds.find((one) => one.kind === entry.kind);
    if (group === undefined) release.kinds.push({ kind: entry.kind, items: [entry.text] });
    else group.items.push(entry.text);
  }
  return releases;
}

export function renderChangelogMarkup(config: ChangelogConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--chg-accent: ${config.accentColor}`,
    `--chg-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--chg-on-accent: ${luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff"}`,
    ...(config.theme === "system" ? [] : Object.entries(palette).map(([key, value]) => `--chg-${key}: ${themedColour(key, value, dark)}`)),
  ].join("; ");

  const sub = config.headingLevel === "h2" ? "h3" : "h4";
  const releases = toReleases(config.entries)
    .map((release, index) => {
      const groups = release.kinds
        .map(
          (group) => `            <div class="chg-group">
              <!--
                The kind is a word, not a coloured dot. A legend of colours is no use to anyone who
                cannot tell them apart, and none at all to a screen reader.
              -->
              <p class="chg-kind">${escapeHtml(group.kind)}</p>
              <ul class="chg-items">${group.items.map((text) => `<li>${escapeHtml(text)}</li>`).join("")}</ul>
            </div>`,
        )
        .join("\n");
      return `        <li class="chg-release">
            <div class="chg-top">
              <${sub} class="chg-version">${escapeHtml(release.version)}</${sub}>
              <!-- A real time element, written out in full: 2026-09-18 is not a date most people read. -->
              <time class="chg-date" datetime="${escapeHtml(release.date)}">${escapeHtml(sayDate(release.date))}</time>
              ${config.showLatest && index === 0 ? `<span class="chg-latest">${escapeHtml(config.latestLabel)}</span>` : ""}
            </div>
${groups}
          </li>`;
    })
    .join("\n");

  return `    <div class="chg chg--theme-${config.theme}" style="${vars}">
      <${config.headingLevel} class="chg-heading">${escapeHtml(config.heading)}</${config.headingLevel}>

      <ol class="chg-list">
${releases}
      </ol>
    </div>`;
}

export function renderChangelogHtml(config: ChangelogConfig) {
  return htmlPage({ title: "Changelog", slug: "changelog", body: renderChangelogMarkup(config), script: false });
}
