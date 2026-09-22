"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

export type LightboxConfig = {
  label: string;
  items: { src: string; alt: string; caption: string }[];
  columns: "2" | "3" | "4";
  showCaptions: boolean;
  loop: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: LightboxConfig = {
  label: "Gallery",
  items: [
    { src: "", alt: "Harbour at dawn", caption: "The harbour just after sunrise." },
    { src: "", alt: "Boats at the pier", caption: "Fishing boats tied up at the pier." },
    { src: "", alt: "Lighthouse on the cliff", caption: "The lighthouse on the north cliff." },
    { src: "", alt: "Market by the water", caption: "The Saturday market by the water." },
    { src: "", alt: "Storm over the bay", caption: "A storm rolling in over the bay." },
    { src: "", alt: "Evening on the beach", caption: "The beach on a still evening." },
  ],
  columns: "3",
  showCaptions: true,
  loop: true,
  theme: "light",
  accentColor: "#2563eb",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", text: "#16121f", muted: "#4d4a57", line: "#d9d5e4" },
  dark: { surface: "#141019", text: "#f6f5fa", muted: "#b6b3c2", line: "#3a3448" },
};
const grids = { "2": "grid-cols-2", "3": "grid-cols-2 sm:grid-cols-3", "4": "grid-cols-2 sm:grid-cols-4" };
/** Demo pictures when an item has no image: drawn, so nothing is loaded from anywhere. */
const placeholders = [
  "linear-gradient(160deg,#f6d365,#fda085 45%,#5b86e5)",
  "linear-gradient(160deg,#89f7fe,#66a6ff)",
  "linear-gradient(160deg,#c2e9fb,#a1c4fd 40%,#355c7d)",
  "linear-gradient(160deg,#fbc2eb,#a6c1ee)",
  "linear-gradient(160deg,#434343,#6b7a8f 50%,#1e3c72)",
  "linear-gradient(160deg,#ffecd2,#fcb69f 50%,#6a3093)",
];
/** How far a swipe has to travel, in pixels, to change picture. */
const SWIPE = 50;

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

/** Stops the page behind the viewer from scrolling; returns what to put back. */
function lockScroll() {
  const before = document.documentElement.style.overflow;
  document.documentElement.style.overflow = "hidden";
  return before;
}

function unlockScroll(before: string) {
  document.documentElement.style.overflow = before;
}

const safeSrc = (value: string) => (/^(\/|https?:\/\/)/i.test(value.trim()) ? value.trim() : "");

function Picture({ item, index, large }: { item: { src: string; alt: string }; index: number; large?: boolean }) {
  const src = safeSrc(item.src);
  const size = large ? "max-h-[70dvh] w-full object-contain" : "aspect-[4/3] w-full object-cover";
  // A plain <img>: the exported file has to work outside Next.js too.
  // eslint-disable-next-line @next/next/no-img-element
  if (src) return <img src={src} alt={item.alt} className={size} />;
  return (
    <span
      role="img"
      aria-label={item.alt}
      style={{ backgroundImage: placeholders[index % placeholders.length] }}
      className={`block ${large ? "aspect-[4/3] max-h-[70dvh] w-[min(100%,calc(70dvh*4/3))]" : "aspect-[4/3] w-full"}`}
    />
  );
}

const icons = {
  prev: "m15 6-6 6 6 6",
  next: "m9 6 6 6-6 6",
  close: "M6 6l12 12M18 6 6 18",
};

export function Lightbox({ config = defaultConfig }: { config?: LightboxConfig }) {
  const id = useId();
  const items = config.items.filter((item) => item.alt.trim() !== "" || item.src.trim() !== "");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openers = useRef(new Map<number, HTMLButtonElement>());
  const swipe = useRef<number | null>(null);
  const overflow = useRef("");
  const [current, setCurrent] = useState(0);

  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--lb-accent": config.accentColor,
    "--lb-accent-text": readableAccent(config.accentColor, dark),
    "--lb-surface": palette.surface,
    "--lb-text": palette.text,
    "--lb-muted": palette.muted,
    "--lb-line": palette.line,
  } as CSSProperties;
  const item = items[current];
  const atStart = !config.loop && current === 0;
  const atEnd = !config.loop && current === items.length - 1;

  // The pictures either side are fetched ahead, so stepping through never waits.
  useEffect(() => {
    for (const offset of [-1, 1]) {
      const src = safeSrc(items[(current + offset + items.length) % items.length]?.src ?? "");
      if (src) new Image().src = src;
    }
  }, [current, items]);

  function open(index: number) {
    setCurrent(index);
    dialogRef.current?.showModal();
    overflow.current = lockScroll();
    closeRef.current?.focus();
  }

  function go(step: number) {
    const next = current + step;
    if (config.loop) setCurrent((next + items.length) % items.length);
    else if (next >= 0 && next < items.length) setCurrent(next);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key === "ArrowLeft") go(-1);
    else if (event.key === "ArrowRight") go(1);
    else if (event.key === "Home") setCurrent(0);
    else if (event.key === "End") setCurrent(items.length - 1);
    else if (event.key === "Tab") {
      // Keep Tab inside the viewer (APG dialog pattern).
      const buttons = [...event.currentTarget.querySelectorAll<HTMLElement>("button")];
      const index = buttons.indexOf(document.activeElement as HTMLElement);
      if (event.shiftKey && index <= 0) {
        event.preventDefault();
        buttons[buttons.length - 1]?.focus();
      } else if (!event.shiftKey && index === buttons.length - 1) {
        event.preventDefault();
        buttons[0]?.focus();
      }
      return;
    } else return;
    event.preventDefault();
  }

  const round =
    "grid size-11 cursor-pointer place-items-center rounded-full bg-black/60 text-white hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white aria-disabled:cursor-default aria-disabled:opacity-40";

  return (
    <div style={style} className="bg-(--lb-surface) text-(--lb-text)">
      <p id={`${id}-label`} className="mb-3 font-medium">
        {config.label}
      </p>
      <ul aria-labelledby={`${id}-label`} className={`grid gap-2 ${grids[config.columns]}`}>
        {items.map((entry, index) => (
          <li key={index}>
            <button
              ref={(element) => {
                if (element) openers.current.set(index, element);
                else openers.current.delete(index);
              }}
              type="button"
              aria-haspopup="dialog"
              onClick={() => open(index)}
              className="block w-full cursor-zoom-in overflow-hidden rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--lb-accent-text)"
            >
              <Picture item={entry} index={index} />
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        aria-label={`${config.label}, picture viewer`}
        onKeyDown={onKeyDown}
        onClose={() => {
          unlockScroll(overflow.current);
          openers.current.get(current)?.focus();
        }}
        onClick={(event) => {
          // A click on the dark space around the picture closes it, like a click outside a dialog.
          if (event.target === event.currentTarget || (event.target as HTMLElement).hasAttribute("data-backdrop")) {
            dialogRef.current?.close();
          }
        }}
        onPointerDown={(event: PointerEvent<HTMLDialogElement>) => {
          if (event.pointerType === "touch") swipe.current = event.clientX;
        }}
        onPointerUp={(event: PointerEvent<HTMLDialogElement>) => {
          if (swipe.current === null) return;
          const distance = event.clientX - swipe.current;
          swipe.current = null;
          if (Math.abs(distance) > SWIPE) go(distance < 0 ? 1 : -1);
        }}
        className="m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-transparent p-0 text-white backdrop:bg-black/90"
      >
        {item && (
          <div data-backdrop className="flex h-full flex-col items-center justify-center gap-3 px-4 py-16 sm:px-20">
            <p aria-live="polite" className="absolute top-4 left-4 rounded-full bg-black/60 px-3 py-1 text-sm tabular-nums">
              {current + 1} of {items.length}
            </p>
            <button ref={closeRef} type="button" aria-label="Close" onClick={() => dialogRef.current?.close()} className={`${round} absolute top-3 right-3`}>
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-5">
                <path d={icons.close} />
              </svg>
            </button>
            <figure className="flex w-full flex-col items-center">
              <Picture item={item} index={current} large />
              {config.showCaptions && item.caption.trim() !== "" && (
                <figcaption className="mt-3 max-w-prose text-center text-sm text-white/90">{item.caption}</figcaption>
              )}
            </figure>
            {items.length > 1 &&
              ([-1, 1] as const).map((step) => (
                <button
                  key={step}
                  type="button"
                  aria-label={step < 0 ? "Previous picture" : "Next picture"}
                  aria-disabled={(step < 0 ? atStart : atEnd) || undefined}
                  onClick={() => go(step)}
                  className={`${round} absolute top-1/2 -translate-y-1/2 ${step < 0 ? "left-3" : "right-3"}`}
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-5">
                    <path d={step < 0 ? icons.prev : icons.next} />
                  </svg>
                </button>
              ))}
          </div>
        )}
      </dialog>
    </div>
  );
}
