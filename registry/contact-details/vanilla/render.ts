import { escapeHtml, htmlPage, luminance, safeHref, themedColour } from "@/lib/html";
import type { ContactDetailsConfig } from "../react/contact-details";

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", muted: "#4d4a57", line: "#d9d5e4" },
  dark: { surface: "#141019", text: "#f6f5fa", muted: "#b6b3c2", line: "#3a3448" },
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

/** The same as the React file's (a copy: that file is a client module). */
const telOf = (phone: string) => `tel:${phone.trim().startsWith("+") ? "+" : ""}${phone.replace(/\D/g, "")}`;

/** Plain HTML, no JavaScript: the markup is generated from the options. "system" theme is handled in CSS. */
export function renderContactDetailsMarkup(config: ContactDetailsConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--cd-accent-text: ${readableAccent(config.accentColor, dark)}`,
    ...(config.theme === "system" ? [] : Object.entries(palette).map(([key, value]) => `--cd-${key}: ${themedColour(key, value, dark)}`)),
  ].join("; ");
  const heading = config.headingLevel;
  const rows = [
    config.email.trim() && [escapeHtml(config.emailTerm), `<a class="cd-link" href="mailto:${escapeHtml(config.email.trim())}">${escapeHtml(config.email)}</a>`],
    config.phone.trim() && [escapeHtml(config.phoneTerm), `<a class="cd-link" href="${escapeHtml(telOf(config.phone))}">${escapeHtml(config.phone)}</a>`],
    config.address.trim() && [escapeHtml(config.addressTerm), escapeHtml(config.address).replace(/\n/g, "<br>")],
    config.hours.trim() && [escapeHtml(config.hoursTerm), escapeHtml(config.hours)],
  ]
    .filter(Boolean)
    .map((row) => `          <div class="cd-row"><dt>${(row as string[])[0]}</dt><dd>${(row as string[])[1]}</dd></div>`)
    .join("\n");
  const map =
    config.mapHref.trim() && config.mapText.trim()
      ? `        <p class="cd-map"><a class="cd-link" href="${escapeHtml(safeHref(config.mapHref))}">${escapeHtml(config.mapText)}</a></p>\n`
      : "";
  return `    <section class="cd cd--theme-${config.theme}" style="${vars}" aria-labelledby="cd-heading">
      <${heading} class="cd-heading" id="cd-heading">${escapeHtml(config.heading)}</${heading}>
${config.intro.trim() ? `      <p class="cd-intro">${escapeHtml(config.intro)}</p>\n` : ""}      <address class="cd-address">
        <dl class="cd-list">
${rows}
        </dl>
${map}      </address>
    </section>`;
}

export function renderContactDetailsHtml(config: ContactDetailsConfig) {
  return htmlPage({ title: "Contact details", slug: "contact-details", body: renderContactDetailsMarkup(config), script: false });
}
