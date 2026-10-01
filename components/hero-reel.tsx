"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { partBySlug } from "@/lib/parts";
import reels from "@/lib/reels.json";

/*
 * The home page hero (D74): real parts, filmed on their own preview pages and driven by the keyboard
 * (scripts/record-reels.mjs), played one at a time on a screen with chapters.
 *
 * It moves on its own for more than five seconds, so it has a pause button (WCAG 2.2.2). With reduced
 * motion it shows the still of each part instead and never plays, unless asked to. It also pauses when
 * it is off screen or the tab is hidden: nobody is watching.
 */

const motionQuery = "(prefers-reduced-motion: reduce)";
const reducedMotion = {
  subscribe: (onChange: () => void) => {
    const list = window.matchMedia(motionQuery);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  },
  get: () => window.matchMedia(motionQuery).matches,
};

// The first second or so of each clip is its preview page loading.
const LEAD_IN = 0.3;

export function HeroReel() {
  const reduced = useSyncExternalStore(reducedMotion.subscribe, reducedMotion.get, () => false);
  const [at, setAt] = useState(0);
  const [choice, setChoice] = useState<"auto" | "play" | "pause">("auto");
  const [seen, setSeen] = useState(true);
  /*
   * The page arrives with the still, and the clip is put in once the page has loaded. A <video> in the
   * first HTML holds up the load event while it fetches (WebKit waited for ever), and the still is the
   * faster first paint anyway.
   */
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const playing = choice === "play" || (choice === "auto" && !reduced);
  const reel = reels[at];
  const part = partBySlug(reel.slug);
  const label = `${part.name}, used with the keyboard only: ${reel.keys}`;

  // Watching means on screen and in a visible tab.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let onScreen = true;
    const update = () => setSeen(onScreen && document.visibilityState === "visible");
    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      update();
    });
    observer.observe(root);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  useEffect(() => {
    const mount = () => setMounted(true);
    if (document.readyState === "complete") {
      const timer = window.setTimeout(mount, 0);
      return () => window.clearTimeout(timer);
    }
    window.addEventListener("load", mount, { once: true });
    return () => window.removeEventListener("load", mount);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (playing && seen) video.play().catch(() => {});
    else video.pause();
  }, [playing, seen, at]);

  function choose(index: number) {
    barRefs.current.forEach((bar) => bar && (bar.style.width = "0%"));
    setAt(index);
  }

  return (
    <div ref={rootRef}>
      <figure className="glass m-0 rounded-[1.75rem] p-2.5">
        <div className="relative aspect-[16/10] overflow-hidden rounded-[1.25rem] bg-white">
          {playing && mounted ? (
            <video
              key={reel.slug}
              ref={videoRef}
              src={`/reels/${reel.slug}.webm`}
              poster={`/reels/${reel.slug}.jpg`}
              muted
              playsInline
              preload="auto"
              aria-label={label}
              className="size-full object-cover"
              onLoadedMetadata={(event) => {
                event.currentTarget.currentTime = reel.start + LEAD_IN;
                if (seen) event.currentTarget.play().catch(() => {});
              }}
              onTimeUpdate={(event) => {
                const video = event.currentTarget;
                const bar = barRefs.current[at];
                if (bar && video.duration) {
                  const share = (video.currentTime - reel.start) / (video.duration - reel.start);
                  bar.style.width = `${Math.max(0, Math.min(1, share)) * 100}%`;
                }
              }}
              onEnded={() => choose((at + 1) % reels.length)}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- a fixed-size still beside a video, not a layout image
            <img src={`/reels/${reel.slug}.jpg`} alt={label} className="size-full object-cover" />
          )}
          {/* On the clip itself, so nothing else crowds the hero: the way into the part, and the pause. */}
          <Link
            href={`/${reel.slug}`}
            className="absolute bottom-3 left-3 inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[#1c1a17e6] px-3.5 text-sm font-semibold text-white transition-[scale] duration-300 ease-spring hover:bg-[#1c1a17] active:scale-95"
          >
            {`Open the ${part.name.toLowerCase()}`}
            <span aria-hidden="true">→</span>
          </Link>
          <button
            type="button"
            onClick={() => setChoice(playing ? "pause" : "play")}
            aria-label={playing ? "Pause the clips" : "Play the clips"}
            className="absolute top-3 right-3 grid size-10 cursor-pointer place-items-center rounded-full bg-[#1c1a17e6] text-white transition-[scale] duration-300 ease-spring hover:bg-[#1c1a17] active:scale-90"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="size-4">
              {playing ? <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /> : <path d="M8 5.5v13l11-6.5z" />}
            </svg>
          </button>
        </div>
      </figure>

      <div role="group" aria-label="Choose a part to watch" className="mt-4 flex flex-wrap gap-1.5">
        {reels.map((item, index) => (
          <button
            key={item.slug}
            type="button"
            aria-pressed={index === at}
            onClick={() => choose(index)}
            className="relative min-h-9 cursor-pointer overflow-hidden rounded-full px-3.5 text-sm text-ink-muted transition-[scale,color,background-color] duration-300 ease-spring hover:text-ink active:scale-95 aria-pressed:bg-ink aria-pressed:text-paper"
          >
            {partBySlug(item.slug).name}
            <span
              aria-hidden="true"
              ref={(node) => {
                barRefs.current[index] = node;
              }}
              className="absolute bottom-0 left-0 h-0.5 w-0 bg-accent"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

/** The headline beside the reel: what the clips are, and what the site is for. */
export function HeroIntro({ count }: { count: number }) {
  return (
    <div>
      <p className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 font-mono text-xs text-ink-muted">
        <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-accent" />
        <span>{`${count} parts · 2 outputs each · 0 runtime dependencies`}</span>
      </p>
      <h1 id="hero-heading" className="mt-6 font-display text-[clamp(2.75rem,6.5vw,5rem)] leading-[1.02] text-balance">
        <span className="slab-line">{`${count} accessible parts.`}</span>
        <em className="slab-line text-accent" style={{ animationDelay: "140ms" }}>
          Watch them work.
        </em>
      </h1>
      <p className="mt-6 max-w-md text-lg text-pretty text-ink-muted">
        Real components, filmed using only the keyboard. Set one up, test it, take the code.
      </p>
    </div>
  );
}
