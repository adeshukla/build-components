"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { REEL_HEIGHT, REEL_WIDTH, reelScenes, type ReelMessage } from "@/lib/reel-scenes";

/*
 * The home page hero (D79): real parts, played live by a script in a frame (/reel,
 * components/motion-reel.tsx), filmed by a camera that lives here.
 *
 * The frame is inert, and nothing inside it really takes focus (motion-reel.tsx says how), so the reel
 * never steals the keyboard from someone using the page. The camera moves the frame itself; the title
 * card and the key caption sit on top and never zoom.
 *
 * It moves on its own for more than five seconds, so it has a pause button (WCAG 2.2.2). With reduced
 * motion it shows a still of each part instead and never plays, unless asked to. It also pauses when it
 * is off screen or the tab is hidden: nobody is watching.
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

type Shot = Omit<Extract<ReelMessage, { type: "reel-camera" }>, "type">;
const wide: Shot = { x: 0, y: 0, width: REEL_WIDTH, height: REEL_HEIGHT, zoom: 1, duration: 0 };

/** Where the frame goes so the shot is centred, without ever showing past the frame's edge. */
function framing(shot: Shot, scale: number) {
  // On a phone the whole frame is a quarter size, so close-ups go further in.
  const zoom = shot.zoom > 1 && scale < 0.4 ? shot.zoom * 1.5 : shot.zoom;
  const size = scale * zoom;
  const clamp = (offset: number, frame: number) => Math.min(0, Math.max(scale * frame - size * frame, offset));
  const x = clamp((scale * REEL_WIDTH) / 2 - size * (shot.x + shot.width / 2), REEL_WIDTH);
  const y = clamp((scale * REEL_HEIGHT) / 2 - size * (shot.y + shot.height / 2), REEL_HEIGHT);
  return `translate(${x}px, ${y}px) scale(${size})`;
}

export function HeroReel() {
  const reduced = useSyncExternalStore(reducedMotion.subscribe, reducedMotion.get, () => false);
  const [at, setAt] = useState(0);
  const [choice, setChoice] = useState<"auto" | "play" | "pause">("auto");
  const [seen, setSeen] = useState(true);
  const [key, setKey] = useState<string | null>(null);
  /*
   * The page arrives with a still, and the frame is put in once the page has loaded, so the reel never
   * holds up the first paint. The still stays until the reel's first scene has started.
   */
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const shot = useRef(wide);
  // A chapter chosen before the reel is listening, played as soon as it is.
  const wanted = useRef<number | null>(null);

  const playing = choice === "play" || (choice === "auto" && !reduced);
  // Once playing, the frame stays: pausing freezes it where it is.
  const live = mounted && (choice !== "auto" || !reduced);
  const scene = reelScenes[at];

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

  // The camera: the frame is scaled to the screen, then moved to the shot the reel asks for.
  useEffect(() => {
    const screen = screenRef.current;
    const frame = frameRef.current;
    if (!live || !screen || !frame) return;
    const aim = (animate: boolean) => {
      frame.style.transition = animate
        ? `transform ${shot.current.duration}ms cubic-bezier(0.65, 0, 0.35, 1)`
        : "none";
      frame.style.transform = framing(shot.current, screen.clientWidth / REEL_WIDTH);
    };
    aim(false);
    const resize = new ResizeObserver(() => aim(false));
    resize.observe(screen);

    function onMessage(event: MessageEvent) {
      if (event.source !== frame?.contentWindow) return;
      const message = event.data as ReelMessage;
      if (message?.type === "reel-scene") {
        setReady(true);
        const index = wanted.current ?? message.index;
        wanted.current = null;
        if (index !== message.index) frame?.contentWindow?.postMessage({ type: "reel-goto", index }, "*");
        setAt(index);
      }
      if (message?.type === "reel-key") setKey(message.label);
      if (message?.type === "reel-camera") {
        shot.current = message;
        aim(true);
      }
    }
    window.addEventListener("message", onMessage);
    return () => {
      resize.disconnect();
      window.removeEventListener("message", onMessage);
    };
  }, [live]);

  useEffect(() => {
    frameRef.current?.contentWindow?.postMessage({ type: "reel-pause", paused: !(playing && seen) }, "*");
  }, [playing, seen, ready]);

  function choose(index: number) {
    if (index === at) return;
    setAt(index);
    setKey(null);
    if (ready) frameRef.current?.contentWindow?.postMessage({ type: "reel-goto", index }, "*");
    else wanted.current = index;
  }

  return (
    <div ref={rootRef}>
      <figure aria-label="Six parts in use, played live" className="glass m-0 rounded-[1.75rem] p-2.5">
        <div ref={screenRef} className="relative aspect-[16/10] overflow-hidden rounded-[1.25rem] bg-[#f5f2ec]">
          {/* eslint-disable-next-line @next/next/no-img-element -- a fixed-size still under the reel, not a layout image */}
          <img
            src={`/reels/${scene.slug}.jpg`}
            alt=""
            className={`absolute inset-0 size-full object-cover transition-opacity duration-500 ${live && ready ? "opacity-0" : ""}`}
          />
          {live && (
            <iframe
              ref={frameRef}
              src="/reel"
              title="Parts in use"
              inert
              tabIndex={-1}
              width={REEL_WIDTH}
              height={REEL_HEIGHT}
              className={`absolute top-0 left-0 origin-top-left border-0 transition-opacity duration-500 ${ready ? "" : "opacity-0"}`}
            />
          )}

          {/* The title card: what is playing, in words, never zoomed. */}
          <p
            key={scene.slug}
            className={`pointer-events-none absolute bottom-16 left-4 m-0 max-w-[70%] rounded-2xl bg-[#1c1a17e6] px-4 py-2.5 text-white shadow-lg ${live ? "reel-title" : ""}`}
          >
            <span className="block font-display text-xl leading-tight sm:text-2xl">{scene.title}</span>
            <span className="block text-sm text-white/80">{scene.line}</span>
          </p>
          {key && (
            <p
              key={key}
              aria-hidden="true"
              className="reel-enter pointer-events-none absolute top-4 left-1/2 m-0 -translate-x-1/2 rounded-xl border border-white/20 bg-[#1c1a17e6] px-3.5 py-1.5 font-mono text-sm whitespace-nowrap text-white shadow-lg"
            >
              {key}
            </p>
          )}

          {/* On the reel itself, so nothing else crowds the hero: the way into the part, and the pause. */}
          <Link
            href={`/${scene.slug}`}
            className="absolute bottom-3 left-3 inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[#1c1a17e6] px-3.5 text-sm font-semibold text-white transition-[scale] duration-300 ease-spring hover:bg-[#1c1a17] active:scale-95"
          >
            {`Open the ${scene.title.toLowerCase()}`}
            <span aria-hidden="true">→</span>
          </Link>
          <button
            type="button"
            onClick={() => setChoice(playing ? "pause" : "play")}
            aria-label={playing ? "Pause the reel" : "Play the reel"}
            className="absolute top-3 right-3 grid size-10 cursor-pointer place-items-center rounded-full bg-[#1c1a17e6] text-white transition-[scale] duration-300 ease-spring hover:bg-[#1c1a17] active:scale-90"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="size-4">
              {playing ? <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /> : <path d="M8 5.5v13l11-6.5z" />}
            </svg>
          </button>
        </div>
      </figure>

      <div role="group" aria-label="Choose a part to watch" className="mt-4 flex flex-wrap gap-1.5">
        {reelScenes.map((item, index) => (
          <button
            key={item.slug}
            type="button"
            aria-pressed={index === at}
            onClick={() => choose(index)}
            className="min-h-9 cursor-pointer rounded-full px-3.5 text-sm text-ink-muted transition-[scale,color,background-color] duration-300 ease-spring hover:text-ink active:scale-95 aria-pressed:bg-ink aria-pressed:text-paper"
          >
            {item.title}
          </button>
        ))}
      </div>
    </div>
  );
}

/** The headline beside the reel: what it shows, and what the site is for. */
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
        Real components, running live in the page. Set one up, test it, take the code.
      </p>
    </div>
  );
}
