import { escapeHtml, htmlPage, luminance, safeHref, themedColour } from "@/lib/html";
import type { TeamGridConfig } from "../react/team-grid";

const palettes = {
  light: { surface: "#ffffff", sunk: "#eef0f2", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#141019", sunk: "#272031", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
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

/** First letters of the first two words, the same way the React output does it. */
function initialsFor(name: string) {
  const words = name.replace(/\[|\]/g, "").split(/\s+/).filter(Boolean);
  const letters = words
    .filter((word) => /^[A-Za-z]/.test(word))
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
  return letters === "" ? "?" : letters;
}

export function renderTeamGridMarkup(config: TeamGridConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--tm-accent: ${config.accentColor}`,
    `--tm-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...(config.theme === "system" ? [] : Object.entries(palette).map(([key, value]) => `--tm-${key}: ${themedColour(key, value, dark)}`)),
  ].join("; ");

  const people = config.people
    .map((person) => {
      const name =
        person.href.trim() === ""
          ? escapeHtml(person.name)
          : `<a href="${safeHref(person.href)}">${escapeHtml(person.name)}</a>`;
      return `        <li class="tm-person">
          ${config.showInitials ? `<span class="tm-initials" aria-hidden="true">${escapeHtml(initialsFor(person.name))}</span>` : ""}
          <div class="tm-body">
            <p class="tm-name">${name}</p>
            <!-- The role is the same kind of thing for everyone, so it reads as a pair with the name. -->
            <p class="tm-role">${escapeHtml(person.role)}</p>
          </div>
        </li>`;
    })
    .join("\n");

  return `    <div class="tm tm--theme-${config.theme}" style="${vars}">
      <h2 class="tm-heading" id="tm-heading">${escapeHtml(config.heading)}</h2>
      ${config.intro.trim() === "" ? "" : `<p class="tm-intro">${escapeHtml(config.intro)}</p>`}

      <!--
        A list of people, not a grid of headings. Four names as h3s would put four entries in the page's
        outline that nobody wants to navigate by.
      -->
      <ul class="tm-list" aria-labelledby="tm-heading" style="--tm-columns: ${Math.max(config.columns, 1)}">
${people}
      </ul>

      <p class="tm-note">No names or photographs ship with this part. Put your own in, and ask each person before you do.</p>
    </div>`;
}

export function renderTeamGridHtml(config: TeamGridConfig) {
  return htmlPage({ title: "Team grid", slug: "team-grid", body: renderTeamGridMarkup(config), script: false });
}
