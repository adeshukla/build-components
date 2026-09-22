"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";

export type TourConfig = {
  startText: string;
  steps: { target: string; title: string; body: string }[];
  showProgress: boolean;
  showDemo: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: TourConfig = {
  startText: "Take the tour",
  steps: [
    { target: "#tour-search", title: "Search everything", body: "Find pages, people and settings from here." },
    { target: "#tour-new", title: "Start something new", body: "Create a project. You can invite people once it exists." },
    { target: "#tour-filters", title: "Narrow the list", body: "Show only the projects you need right now." },
    { target: "#tour-help", title: "Help is here", body: "Guides and contact details, whenever you need them." },
  ],
  showProgress: true,
  showDemo: true,
  theme: "light",
  accentColor: "#2563eb",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", border: "#737373", line: "#d9d5e4", hover: "#eeecf5" },
  dark: { surface: "#1c1826", sunk: "#141019", text: "#f6f5fa", muted: "#b6b3c2", border: "#8e8a99", line: "#3a3448", hover: "#2a2438" },
};

const darkMedia = {
  subscribe: (onChange: () => void) => {
    const list = window.matchMedia("(prefers-color-scheme: dark)");
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  },
  get: () => window.matchMedia("(prefers-color-scheme: dark)").matches,
};

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
  const surface = onDark ? 0.08 : 1;
  for (let step = 0; step <= 20; step++) {
    const shifted = channels.map((c) => Math.round(onDark ? c + (255 - c) * (step / 20) : c * (1 - step / 20)));
    const value = `#${shifted.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
    const l = luminance(value);
    const contrast = (Math.max(l, surface) + 0.05) / (Math.min(l, surface) + 0.05);
    if (contrast >= 4.5) return value;
  }
  return onDark ? "#ffffff" : "#000000";
}

/** A step's target, or nothing if the selector is invalid or matches nothing on this page. */
function find(selector: string) {
  try {
    return document.querySelector<HTMLElement>(selector);
  } catch {
    return null;
  }
}

/** Puts the ring round the target and the step beside it: below if it fits, otherwise above. */
function place(target: HTMLElement, ring: HTMLElement, popup: HTMLElement) {
  const box = target.getBoundingClientRect();
  const gap = 12;
  const pad = 6;
  Object.assign(ring.style, {
    top: `${box.top - pad}px`,
    left: `${box.left - pad}px`,
    width: `${box.width + pad * 2}px`,
    height: `${box.height + pad * 2}px`,
  });
  const width = popup.offsetWidth;
  const height = popup.offsetHeight;
  let top = box.bottom + gap;
  if (top + height > window.innerHeight - 8) top = Math.max(8, box.top - gap - height);
  const left = Math.min(Math.max(8, box.left), window.innerWidth - width - 8);
  Object.assign(popup.style, { top: `${top}px`, left: `${left}px` });
}

export function Tour({ config = defaultConfig }: { config?: TourConfig }) {
  const id = useId();
  const [steps, setSteps] = useState<TourConfig["steps"]>([]);
  const [index, setIndex] = useState<number | null>(null);
  const startRef = useRef<HTMLButtonElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLParagraphElement>(null);

  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const accentLuminance = luminance(config.accentColor);
  const style = {
    "--to-accent": config.accentColor,
    "--to-accent-text": readableAccent(config.accentColor, dark),
    "--to-on-accent": accentLuminance > 0.179 ? "#000000" : "#ffffff",
    "--to-surface": palette.surface,
    "--to-sunk": palette.sunk,
    "--to-text": palette.text,
    "--to-muted": palette.muted,
    "--to-border": palette.border,
    "--to-line": palette.line,
    "--to-hover": palette.hover,
  } as CSSProperties;
  const step = index === null ? null : steps[index];

  function start() {
    // Only steps whose target is on the page, so the tour never points at nothing.
    const found = config.steps.filter((entry) => entry.title.trim() && find(entry.target));
    if (!found.length) return;
    setSteps(found);
    setIndex(0);
  }

  function end() {
    setIndex(null);
    startRef.current?.focus();
  }

  // Each step: bring the target into view, place the ring and the step, and move focus to the step
  // so a screen reader reads it.
  useLayoutEffect(() => {
    if (!step) return;
    const target = find(step.target);
    const ring = ringRef.current;
    const popup = popupRef.current;
    if (!target || !ring || !popup) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
    const update = () => place(target, ring, popup);
    update();
    titleRef.current?.focus({ preventScroll: true });
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [step]);

  // Escape ends the tour from anywhere on the page (listening on the document: Safari does not
  // focus buttons that are clicked).
  useEffect(() => {
    if (index === null) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") end();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  });

  const button = "min-h-10 cursor-pointer rounded-lg px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--to-accent-text)";
  const quiet = `${button} border border-(--to-border) bg-(--to-surface) text-(--to-text) hover:bg-(--to-hover)`;

  return (
    <div style={style} className="text-(--to-text)">
      {config.showDemo && (
        // Example page to point the tour at. Delete it and point each step's target at your own elements.
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-(--to-line) bg-(--to-sunk) p-3">
          <label htmlFor="tour-search" className="sr-only">
            Search
          </label>
          <input id="tour-search" type="search" placeholder="Search" className="h-10 min-w-40 flex-[1_1_10rem] rounded-lg border border-(--to-border) bg-(--to-surface) px-3 text-(--to-text) placeholder:text-(--to-muted) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--to-accent-text)" />
          <button id="tour-new" type="button" className={`${button} bg-(--to-accent) text-(--to-on-accent)`}>
            New project
          </button>
          <button id="tour-filters" type="button" className={quiet}>
            Filters
          </button>
          <a id="tour-help" href="#help" className={`${quiet} inline-flex items-center no-underline`}>
            Help
          </a>
        </div>
      )}
      <button ref={startRef} type="button" aria-haspopup="dialog" onClick={start} className={quiet}>
        {config.startText}
      </button>

      {step && index !== null && (
        <>
          <div
            ref={ringRef}
            aria-hidden="true"
            className="pointer-events-none fixed z-40 rounded-xl shadow-[0_0_0_3px_var(--to-accent),0_0_0_9999px_rgb(0_0_0/0.45)] transition-all duration-200 motion-reduce:transition-none"
          />
          <div
            ref={popupRef}
            role="dialog"
            aria-modal="false"
            aria-labelledby={`${id}-title`}
            aria-describedby={`${id}-body`}
            className="fixed z-50 w-[min(20rem,calc(100vw-1rem))] rounded-xl border border-(--to-line) bg-(--to-surface) p-4 text-(--to-text) shadow-2xl"
          >
            {config.showProgress && (
              <p className="text-xs font-medium tracking-wide text-(--to-muted) uppercase">
                Step {index + 1} of {steps.length}
              </p>
            )}
            <p ref={titleRef} id={`${id}-title`} tabIndex={-1} className="mt-1 font-semibold outline-none">
              {step.title}
            </p>
            <p id={`${id}-body`} className="mt-1 text-sm text-(--to-muted)">
              {step.body}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <button type="button" onClick={end} className={`${button} -ml-2 bg-transparent px-2 text-(--to-accent-text) underline underline-offset-2`}>
                Skip tour
              </button>
              <span className="flex gap-2">
                {index > 0 && (
                  <button type="button" onClick={() => setIndex(index - 1)} className={quiet}>
                    Back
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => (index === steps.length - 1 ? end() : setIndex(index + 1))}
                  className={`${button} bg-(--to-accent) text-(--to-on-accent)`}
                >
                  {index === steps.length - 1 ? "Finish" : "Next"}
                </button>
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
