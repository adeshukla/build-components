"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export type CarouselSlide = { title: string; text: string; image: string; alt: string };

export type CarouselConfig = {
  label: string;
  slides: CarouselSlide[];
  perView: "1" | "2" | "3";
  autoRotate: boolean;
  interval: number;
  arrows: boolean;
  dots: boolean;
  counter: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
  radius: number;
  aspect: "16/9" | "4/3" | "1/1";
};

// @config-start
const defaultConfig: CarouselConfig = {
  label: "Customer stories",
  slides: [
    { title: "Harbour Studio", text: "Shipped a booking flow in a week, with the keyboard tests already written.", image: "", alt: "" },
    { title: "Northwind", text: "Replaced three half-finished component libraries with files their team owns.", image: "", alt: "" },
    { title: "Pilot Labs", text: "Passed an accessibility audit with no changes to the parts they took.", image: "", alt: "" },
    { title: "Meridian", text: "Handed the code to a client who has no design system of their own.", image: "", alt: "" },
  ],
  perView: "1",
  autoRotate: false,
  interval: 6,
  arrows: true,
  dots: true,
  counter: false,
  theme: "light",
  accentColor: "#2563eb",
  radius: 12,
  aspect: "16/9",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", slide: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#d9d5e4" },
  dark: { surface: "#141019", slide: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#3a3448" },
};

const darkMedia = {
  subscribe: (onChange: () => void) => {
    const list = window.matchMedia("(prefers-color-scheme: dark)");
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  },
  get: () => window.matchMedia("(prefers-color-scheme: dark)").matches,
};

const motionMedia = {
  subscribe: (onChange: () => void) => {
    const list = window.matchMedia("(prefers-reduced-motion: reduce)");
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  },
  get: () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
};

// WCAG relative luminance, used to keep text on the accent readable.
function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

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

export function Carousel({ config = defaultConfig }: { config?: CarouselConfig }) {
  const slides = config.slides.filter((slide) => slide.title.trim() !== "" || slide.text.trim() !== "");
  const trackRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(config.autoRotate);
  const [held, setHeld] = useState(false);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const reduceMotion = useSyncExternalStore(motionMedia.subscribe, motionMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const accentLuminance = luminance(config.accentColor);
  const perView = Number(config.perView);
  const lastIndex = Math.max(0, slides.length - perView);

  /** Scrolls the track so that `index` is the first slide on show. */
  function goTo(index: number) {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.min(lastIndex, Math.max(0, index));
    track.scrollTo({ left: (track.scrollWidth / Math.max(1, slides.length)) * clamped, behavior: reduceMotion ? "auto" : "smooth" });
    setCurrent(clamped);
  }

  // The scroll position is the source of truth: swiping keeps the dots and buttons honest.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;
    function onScroll() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!track) return;
        const width = track.scrollWidth / Math.max(1, slides.length);
        setCurrent(Math.min(lastIndex, Math.round(track.scrollLeft / Math.max(1, width))));
      });
    }
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      track.removeEventListener("scroll", onScroll);
    };
  }, [slides.length, lastIndex]);

  // Auto-rotation stops while the pointer or the keyboard is inside, and never runs for a
  // visitor who has asked for reduced motion.
  useEffect(() => {
    if (!playing || held || reduceMotion || slides.length <= perView) return;
    const timer = setInterval(() => {
      const track = trackRef.current;
      if (!track) return;
      const width = track.scrollWidth / Math.max(1, slides.length);
      const next = Math.round(track.scrollLeft / Math.max(1, width)) + 1;
      track.scrollTo({ left: next > lastIndex ? 0 : width * next, behavior: "smooth" });
    }, Math.max(2, config.interval) * 1000);
    return () => clearInterval(timer);
  }, [playing, held, reduceMotion, slides.length, perView, lastIndex, config.interval]);

  const style = {
    "--cr-accent": config.accentColor,
    "--cr-accent-text": readableAccent(config.accentColor, dark),
    "--cr-on-accent": accentLuminance > 0.179 ? "#000000" : "#ffffff",
    "--cr-radius": `${config.radius}px`,
    "--cr-surface": palette.surface,
    "--cr-slide": palette.slide,
    "--cr-text": palette.text,
    "--cr-muted": palette.muted,
    "--cr-line": palette.line,
  } as CSSProperties;
  const control =
    "inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-(--cr-line) bg-(--cr-surface) text-(--cr-text) disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--cr-accent-text)";

  if (slides.length === 0) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label={config.label}
      style={style}
      className="bg-(--cr-surface) text-(--cr-text)"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocusCapture={() => setHeld(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHeld(false);
      }}
    >
      <div
        ref={trackRef}
        // A scrollable region has to be reachable by keyboard, so the track itself takes focus.
        tabIndex={0}
        role="group"
        aria-label={`${config.label} slides`}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--cr-accent-text) motion-reduce:scroll-auto [scrollbar-width:thin]"
      >
        {slides.map((slide, index) => {
          const image = safeImage(slide.image);
          return (
            <div
              key={index}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${slides.length}`}
              // Each slide is a fraction of the track, minus its share of the gaps.
              style={{ width: `calc((100% - ${perView - 1} * 1rem) / ${perView})` }}
              className="shrink-0 snap-start overflow-hidden rounded-(--cr-radius) bg-(--cr-slide)"
            >
              {/* No image means no picture area at all, rather than an empty box. */}
              {image !== "" && (
                // Exported code must not depend on next/image: this file runs in any React project.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt={slide.alt} className="w-full object-cover" style={{ aspectRatio: config.aspect }} />
              )}
              <div className="p-5">
                {slide.title.trim() !== "" && <p className="text-lg font-semibold">{slide.title}</p>}
                {slide.text.trim() !== "" && <p className="mt-1 text-pretty text-(--cr-muted)">{slide.text}</p>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {config.autoRotate && (
          <button type="button" onClick={() => setPlaying(!playing)} className={control}>
            <span className="sr-only">{playing ? "Stop automatic slide changes" : "Start automatic slide changes"}</span>
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="size-4">
              {playing ? <path d="M7 5h4v14H7zM13 5h4v14h-4z" /> : <path d="M8 5v14l11-7z" />}
            </svg>
          </button>
        )}

        {config.arrows && (
          <>
            <button type="button" onClick={() => goTo(current - 1)} disabled={current === 0} className={control}>
              <span className="sr-only">Previous slide</span>
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4">
                <path d="M15 6l-6 6 6 6" />
              </svg>
            </button>
            <button type="button" onClick={() => goTo(current + 1)} disabled={current >= lastIndex} className={control}>
              <span className="sr-only">Next slide</span>
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          </>
        )}

        {config.dots && (
          <div className="flex flex-wrap items-center gap-2">
            {slides.slice(0, lastIndex + 1).map((slide, index) => (
              <button
                key={index}
                type="button"
                onClick={() => goTo(index)}
                aria-current={index === current ? "true" : undefined}
                // The button is 24px square (the minimum target size); only the dot inside is small.
                className="grid size-6 cursor-pointer place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--cr-accent-text)"
              >
                <span
                  aria-hidden="true"
                  className={`block size-3 rounded-full border border-(--cr-line) ${
                    index === current ? "bg-(--cr-accent)" : "bg-transparent"
                  }`}
                />
                <span className="sr-only">
                  Slide {index + 1}: {slide.title}
                </span>
              </button>
            ))}
          </div>
        )}

        {config.counter && (
          <p aria-live="polite" className="ml-auto text-sm text-(--cr-muted)">
            Slide {current + 1} of {lastIndex + 1}
          </p>
        )}
      </div>
    </section>
  );
}
