import { escapeHtml, htmlPage, luminance } from "@/lib/html";
import type { CarouselConfig } from "../react/carousel";

const palettes = {
  light: { surface: "#ffffff", slide: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#d9d5e4" },
  dark: { surface: "#141019", slide: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#3a3448" },
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

/** Only http(s) images, or a path inside your own site. */
function safeImage(value: string) {
  return /^(\/|https?:\/\/)/i.test(value.trim()) ? value.trim() : "";
}

const icons = {
  previous: `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6l-6 6 6 6"/></svg>`,
  next: `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>`,
  pause: `<svg class="cr-icon-pause" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>`,
  play: `<svg class="cr-icon-play" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`,
};

/**
 * The carousel ships as real HTML: every slide is written into the page and the track scrolls,
 * so it still works (as a scrolling row) before the script runs.
 */
export function renderCarouselMarkup(config: CarouselConfig) {
  const slides = config.slides.filter((slide) => slide.title.trim() !== "" || slide.text.trim() !== "");
  if (slides.length === 0) return "";
  const dark = config.theme === "dark";
  const palette = dark ? palettes.dark : palettes.light;
  const perView = Number(config.perView);
  const lastIndex = Math.max(0, slides.length - perView);
  const vars = [
    `--cr-accent: ${config.accentColor}`,
    `--cr-accent-text: ${readableAccent(config.accentColor, dark)}`,
    `--cr-radius: ${config.radius}px`,
    `--cr-surface: ${palette.surface}`,
    `--cr-slide: ${palette.slide}`,
    `--cr-text: ${palette.text}`,
    `--cr-muted: ${palette.muted}`,
    `--cr-line: ${palette.line}`,
    `--cr-aspect: ${config.aspect}`,
    `--cr-width: calc((100% - ${perView - 1} * 1rem) / ${perView})`,
  ].join("; ");

  const items = slides
    .map((slide, index) => {
      const image = safeImage(slide.image);
      // No image means no picture area at all, rather than an empty box.
      const media = image !== "" ? `          <img class="cr-image" src="${escapeHtml(image)}" alt="${escapeHtml(slide.alt)}">
` : "";
      return `        <div class="cr-slide" role="group" aria-roledescription="slide" aria-label="${index + 1} of ${slides.length}">
${media}          <div class="cr-body">
${slide.title.trim() ? `            <p class="cr-title">${escapeHtml(slide.title)}</p>\n` : ""}${slide.text.trim() ? `            <p class="cr-text">${escapeHtml(slide.text)}</p>\n` : ""}          </div>
        </div>`;
    })
    .join("\n");

  const dots = Array.from({ length: lastIndex + 1 })
    .map(
      (_, index) =>
        `          <button class="cr-dot" type="button" data-dot="${index}"${index === 0 ? ' aria-current="true"' : ""}><span class="cr-sr">Slide ${index + 1}: ${escapeHtml(slides[index]?.title ?? "")}</span></button>`,
    )
    .join("\n");

  const play = config.autoRotate
    ? `        <button class="cr-control" type="button" data-play aria-pressed="true"><span class="cr-sr" data-play-label>Stop automatic slide changes</span>${icons.pause}${icons.play}</button>\n`
    : "";
  const arrows = config.arrows
    ? `        <button class="cr-control" type="button" data-previous${config.loop ? "" : " disabled"}><span class="cr-sr">Previous slide</span>${icons.previous}</button>
        <button class="cr-control" type="button" data-next><span class="cr-sr">Next slide</span>${icons.next}</button>\n`
    : "";
  const dotRow = config.dots ? `        <div class="cr-dots">\n${dots}\n        </div>\n` : "";
  const counter = config.counter
    ? `        <p class="cr-counter" aria-live="polite" data-counter>Slide 1 of ${lastIndex + 1}</p>\n`
    : "";

  return `    <section class="cr cr--theme-${config.theme}" style="${vars}" aria-roledescription="carousel" aria-label="${escapeHtml(config.label)}" data-carousel data-interval="${config.interval}" data-auto="${config.autoRotate}" data-per-view="${perView}" data-loop="${config.loop}">
      <div class="cr-track" role="group" aria-label="${escapeHtml(config.label)} slides" tabindex="0" data-track>
${items}
      </div>
      <div class="cr-controls">
${play}${arrows}${dotRow}${counter}      </div>
    </section>`;
}

export function renderCarouselHtml(config: CarouselConfig) {
  return htmlPage({ title: "Carousel", slug: "carousel", body: renderCarouselMarkup(config), script: true });
}
