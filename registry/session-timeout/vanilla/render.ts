import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { SessionTimeoutConfig } from "../react/session-timeout";

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#1c1826", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
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

/** m:ss by hand, so the markup the server writes matches what the script writes later. */
function clock(seconds: number) {
  const whole = Math.max(0, Math.round(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

export function renderSessionTimeoutMarkup(config: SessionTimeoutConfig) {
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const vars = [
    `--st-accent: ${config.accentColor}`,
    `--st-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--st-on-accent: ${luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff"}`,
    ...Object.entries(palette).map(([key, value]) => `--st-${key}: ${value}`),
  ].join("; ");

  const countdown = Math.max(5, config.countdownSeconds);

  return `    <div class="st st--theme-${config.theme}" style="${vars}" data-session-timeout data-idle="${Math.max(5, config.idleSeconds)}" data-countdown="${countdown}" data-watch="${config.watchActivity}">
${config.showTrigger ? `      <!-- Nobody wants to wait out the idle timer to see this: the button starts the warning now. -->
      <button class="st-trigger" type="button" data-trigger>Show the warning now</button>\n` : ""}
      <dialog class="st-dialog" aria-labelledby="st-title" aria-describedby="st-message" data-dialog>
        <h2 class="st-title" id="st-title">${escapeHtml(config.title)}</h2>
        <p class="st-message" id="st-message">${escapeHtml(config.message)}</p>
        <!-- The ticking number is not a live region: it would be read every second. -->
        <p class="st-clock" aria-hidden="true" data-clock>${clock(countdown)}</p>
        <div class="st-actions">
          <button class="st-out" type="button" data-out>${escapeHtml(config.signOutText)}</button>
          <button class="st-stay" type="button" data-stay>${escapeHtml(config.stayText)}</button>
        </div>
      </dialog>

      <!-- The countdown marks while it runs, the outcome once it stops. -->
      <p class="st-status" role="status" data-status></p>
    </div>`;
}

export function renderSessionTimeoutHtml(config: SessionTimeoutConfig) {
  return htmlPage({ title: "Session timeout", slug: "session-timeout", body: renderSessionTimeoutMarkup(config), script: true });
}
