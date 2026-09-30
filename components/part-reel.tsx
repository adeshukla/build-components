"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { MountedPart } from "@/components/mounted-part";
import { DatePicker } from "@/registry/date-picker/react/date-picker";
import { Rating } from "@/registry/rating/react/rating";
import { SearchableSelect } from "@/registry/searchable-select/react/searchable-select";
import { Switch } from "@/registry/switch/react/switch";

/** How long a part holds the socket before the reel moves on. Long enough to actually try it. */
const HOLD = 9000;

const reduceMotion = {
  subscribe: (onChange: () => void) => {
    const list = window.matchMedia("(prefers-reduced-motion: reduce)");
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  },
  get: () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
};

type Slide = { slug: string; name: string; line: string; node: ReactNode };

const slides: Slide[] = [
  {
    slug: "date-picker",
    name: "Date picker",
    line: "Type a date or pick one. Arrow keys move day by day, and the month is announced as it changes.",
    node: <DatePicker />,
  },
  {
    slug: "searchable-select",
    name: "Searchable select",
    line: "A combobox that filters as you type, with the number of matches said out loud.",
    node: <SearchableSelect />,
  },
  {
    slug: "switch",
    name: "Switch",
    line: "A real checkbox with role=switch, so Space works and the state is written in words.",
    node: <Switch />,
  },
  {
    slug: "rating",
    name: "Rating",
    line: "Stars as radio buttons: one tab stop, arrow keys to choose, read as “4 stars, 4 of 5”.",
    node: <Rating />,
  },
];

/**
 * The socket: four real components, one at a time, with the marker travelling to whichever is in it.
 * The reel advances on its own, and stops the moment anyone is using it, it leaves the screen, or the
 * visitor asks for less motion. The tabs are the WAI-ARIA tabs pattern, so it works with the keyboard
 * whether or not it is moving.
 */
export function PartReel() {
  const id = useId();
  const [at, setAt] = useState(0);
  const [paused, setPaused] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const still = useSyncExternalStore(reduceMotion.subscribe, reduceMotion.get, () => true);

  // A loop nobody can see is a waste of a main thread.
  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const watcher = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.35 });
    watcher.observe(node);
    return () => watcher.disconnect();
  }, []);

  /*
   * A touch screen cannot hover, and Safari does not focus a button when it is tapped — so on a phone
   * neither of the two holds below ever happens, and the reel would swap the part out from under
   * someone in the middle of trying it. The first touch or click holds it for good.
   */
  const [held, setHeld] = useState(false);
  const running = onScreen && !paused && !still && !held;
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setAt((current) => (current + 1) % slides.length), HOLD);
    return () => window.clearInterval(timer);
  }, [running]);

  function go(to: number) {
    const next = (to + slides.length) % slides.length;
    setAt(next);
    tabsRef.current[next]?.focus();
  }

  function onKeyDown(event: React.KeyboardEvent) {
    // The strip is vertical on a wide screen and stacked on a phone, so both pairs move it.
    if (event.key === "ArrowRight" || event.key === "ArrowDown") go(at + 1);
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") go(at - 1);
    else if (event.key === "Home") go(0);
    else if (event.key === "End") go(slides.length - 1);
    else return;
    event.preventDefault();
  }

  const current = slides[at];

  return (
    <div
      ref={rootRef}
      onPointerDown={() => setHeld(true)}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setPaused(false);
      }}
      className="grid grid-cols-[minmax(0,1fr)] items-center gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16"
    >
      <div>
        {/* Automatic activation: arrowing along the strip swaps the part, as in the APG tabs pattern. */}
        <div role="tablist" aria-label="Parts you can try here" aria-orientation="vertical" onKeyDown={onKeyDown} className="grid gap-1">
          {slides.map((slide, index) => {
            const on = index === at;
            return (
              <button
                key={slide.slug}
                ref={(node) => {
                  tabsRef.current[index] = node;
                }}
                role="tab"
                type="button"
                id={`${id}-tab-${index}`}
                aria-selected={on}
                aria-controls={`${id}-panel`}
                tabIndex={on ? 0 : -1}
                onClick={() => setAt(index)}
                className={`group relative grid min-h-14 cursor-pointer grid-cols-[auto_1fr] items-center gap-4 rounded-md px-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  on ? "glass" : "border border-transparent hover:bg-wash"
                }`}
              >
                {/* The pad is the one that is live: filled, hollow when waiting. */}
                <span
                  aria-hidden="true"
                  className={`size-2.5 shrink-0 rounded-full border-2 transition-colors ${on ? "border-accent bg-accent" : "border-rule-strong bg-transparent"}`}
                />
                <span>
                  <span className={`block font-display text-xl leading-[1.05] ${on ? "text-ink" : "text-ink-muted"}`}>
                    {slide.name}
                  </span>
                  {on && <span className="mt-1 block max-w-sm text-sm text-pretty text-ink-muted">{slide.line}</span>}
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-xs text-ink-muted">
          <span>{running ? "Moving on its own — touch it, hover it or focus it to hold" : "Held. Arrow keys move between parts"}</span>
          <Link
            href={`/${current.slug}`}
            className="inline-flex min-h-6 items-center rounded text-ink underline decoration-accent decoration-2 underline-offset-4 hover:text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {`Open ${current.name.toLowerCase()}`}
          </Link>
        </p>
      </div>

      {/* One socket, whichever part is in it. The wipe says "swapped", not "appeared". */}
      <div
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-tab-${at}`}
        tabIndex={-1}
        className="min-h-[20rem]"
      >
        <div key={at} className="swap-in">
          <MountedPart caption={`${current.name} · live, try it`}>{current.node}</MountedPart>
        </div>
      </div>
    </div>
  );
}
