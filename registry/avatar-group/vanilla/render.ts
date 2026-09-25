import { escapeHtml, htmlPage } from "@/lib/html";
import type { AvatarGroupConfig } from "../react/avatar-group";

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", muted: "#4d4a57", ring: "#ffffff" },
  dark: { surface: "#141019", text: "#f6f5fa", muted: "#b6b3c2", ring: "#141019" },
};
/** Tints picked to keep dark text on them above 4.5:1, so initials stay readable. */
const tints = ["#d9e4ff", "#d8f0e0", "#fce4d6", "#e7ddfb", "#fbe3ef", "#d7eef5"];

/** The first letter of the first two words: "Ada Okafor" becomes AO. */
function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

/** Same name, same tint, every time. */
function tintOf(name: string) {
  const sum = [...name].reduce((total, letter) => total + letter.charCodeAt(0), 0);
  return tints[sum % tints.length];
}

const safeSrc = (value: string) => (/^(\/|https?:\/\/)/i.test(value.trim()) ? value.trim() : "");

export function renderAvatarGroupMarkup(config: AvatarGroupConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = Object.entries(palette).map(([key, value]) => `--ag-${key}: ${value}`).join("; ");
  const people = config.people.filter((person) => person.name.trim() !== "");
  const max = Math.max(1, Math.min(8, Math.round(config.max)));
  const shown = people.slice(0, max);
  const rest = people.slice(max);

  const items = shown
    .map((person) => {
      const src = safeSrc(person.src);
      const inner = src
        ? `<img class="ag-avatar ag-photo" src="${escapeHtml(src)}" alt="${escapeHtml(person.name)}">`
        : `<span class="ag-avatar ag-initials" role="img" aria-label="${escapeHtml(person.name)}" style="background-color: ${tintOf(person.name)}"><span aria-hidden="true">${escapeHtml(initialsOf(person.name))}</span></span>`;
      return `        <li>${inner}</li>`;
    })
    .join("\n");

  const more = rest.length
    ? `\n        <li><span class="ag-avatar ag-more" role="img" aria-label="${rest.length} more: ${escapeHtml(rest.map((person) => person.name).join(", "))}"><span aria-hidden="true">+${rest.length}</span></span></li>`
    : "";

  return `    <div class="ag ag--${config.size}${config.overlap ? " ag--overlap" : ""} ag--theme-${config.theme}" style="${vars}" data-avatar-group>
      <ul class="ag-list" aria-label="${escapeHtml(config.label)}">
${items}${more}
      </ul>
    </div>`;
}

export function renderAvatarGroupHtml(config: AvatarGroupConfig) {
  return htmlPage({ title: "Avatar group", slug: "avatar-group", body: renderAvatarGroupMarkup(config), script: false });
}
