"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export type BottomSheetConfig = {
  triggerLabel: string;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  detents: "peek-half-full" | "half-full" | "full";
  startAt: "peek" | "half" | "full";
  expandLabel: string;
  collapseLabel: string;
  centreOnWide: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
  peekText: string;
  halfText: string;
  fullText: string;
  heightText: string;
  shortestText: string;
};

// @config-start
const defaultConfig: BottomSheetConfig = {
  triggerLabel: "Choose a delivery slot",
  title: "Delivery slot",
  body: "Sheets come up from the bottom because that is where the thumb is. This one has three heights, and the handle is a real button so the heights are reachable without dragging.",
  confirmLabel: "Use this slot",
  cancelLabel: "Close",
  detents: "peek-half-full",
  startAt: "half",
  expandLabel: "Make the sheet taller",
  collapseLabel: "Make the sheet shorter",
  centreOnWide: true,
  theme: "light",
  accentColor: "#0f766e",
  peekText: "a third of the screen",
  halfText: "half the screen",
  fullText: "nearly the whole screen",
  heightText: "Sheet height: {height}.",
  shortestText: "Already at its shortest.",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#1b1624", sunk: "#272031", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
};

// Follows the system, unless the page has a light/dark choice of its own: <html data-bc-scheme> (D87).
const darkMedia = {
  subscribe: (onChange: () => void) => {
    const list = window.matchMedia("(prefers-color-scheme: dark)");
    const chosen = new MutationObserver(onChange);
    list.addEventListener("change", onChange);
    chosen.observe(document.documentElement, { attributes: true, attributeFilter: ["data-bc-scheme"] });
    return () => {
      list.removeEventListener("change", onChange);
      chosen.disconnect();
    };
  },
  get: () => {
    const chosen = document.documentElement.dataset.bcScheme;
    return chosen ? chosen === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  },
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

export type Detent = "peek" | "half" | "full";

/** The heights this sheet offers, smallest first. */
export function detentsFor(setting: BottomSheetConfig["detents"]): Detent[] {
  if (setting === "full") return ["full"];
  return setting === "half-full" ? ["half", "full"] : ["peek", "half", "full"];
}

const heights: Record<Detent, string> = { peek: "30%", half: "55%", full: "92%" };

/** Words with something put in them: "{count} left" (D94). */
const fill = (words: string, values: Record<string, string | number>) => words.replace(/\{(\w+)\}/g, (match, name) => String(values[name] ?? match));

export function BottomSheet({ config = defaultConfig }: { config?: BottomSheetConfig }) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const steps = detentsFor(config.detents);
  const [at, setAt] = useState(Math.max(steps.indexOf(config.startAt), 0));
  const [result, setResult] = useState("");
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--bsh-accent": config.accentColor,
    "--bsh-accent-text": readableAccent(config.accentColor, dark),
    "--bsh-on-accent": luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff",
    "--bsh-surface": `var(--bc-${dark ? "dark" : "light"}-surface, ${palette.surface})`,
    "--bsh-sunk": `var(--bc-${dark ? "dark" : "light"}-sunk, ${palette.sunk})`,
    "--bsh-text": `var(--bc-${dark ? "dark" : "light"}-text, ${palette.text})`,
    "--bsh-muted": `var(--bc-${dark ? "dark" : "light"}-muted, ${palette.muted})`,
    "--bsh-line": `var(--bc-${dark ? "dark" : "light"}-line, ${palette.line})`,
  } as CSSProperties;

  const detent = steps[Math.min(at, steps.length - 1)] ?? "full";
  const canGrow = at < steps.length - 1;
  const canShrink = at > 0;

  const open = (from: HTMLElement | null) => {
    opener.current = from;
    setAt(Math.max(steps.indexOf(config.startAt), 0));
    setResult("");
    dialog.current?.showModal();
  };

  const close = (why: string) => {
    // Focus cannot leave a modal dialog that is still open, so it closes first.
    dialog.current?.close();
    setResult(why);
    opener.current?.focus();
  };

  // Swipe down to close, which is what the handle is for on a touch screen. It is never the only way.
  const dragFrom = useRef<number | null>(null);
  useEffect(() => {
    const node = dialog.current;
    if (node === null) return;
    function onPointerDown(event: PointerEvent) {
      if ((event.target as HTMLElement).closest("[data-handle]") === null) return;
      dragFrom.current = event.clientY;
    }
    function onPointerUp(event: PointerEvent) {
      const from = dragFrom.current;
      dragFrom.current = null;
      if (from === null) return;
      const moved = event.clientY - from;
      if (moved > 60) setAt((current) => (current === 0 ? 0 : current - 1));
      else if (moved < -60) setAt((current) => Math.min(current + 1, steps.length - 1));
    }
    node.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      node.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [steps.length]);

  const handleKeys = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setAt((current) => Math.min(current + 1, steps.length - 1));
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setAt((current) => Math.max(current - 1, 0));
    } else if (event.key === "Home") {
      event.preventDefault();
      setAt(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setAt(steps.length - 1);
    }
  };

  return (
    <div style={style} className="bg-(--bsh-surface) text-(--bsh-text)">
      <button
        type="button"
        onClick={(event) => open(event.currentTarget)}
        className="inline-flex min-h-11 items-center rounded-[var(--bc-radius-button,0.375rem)] bg-(--bsh-accent) px-4 font-medium text-(--bsh-on-accent) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bsh-accent-text)"
      >
        {config.triggerLabel}
      </button>

      <p role="status" className="mt-3 text-sm text-(--bsh-muted)">
        {result === "" ? "" : result}
      </p>

      <dialog
        ref={dialog}
        aria-labelledby={`${id}-title`}
        data-detent={detent}
        onCancel={(event) => {
          event.preventDefault();
          close(`${config.title} closed.`);
        }}
        // No display class on the dialog itself: display:flex would beat the browser's own
        // dialog:not([open]) { display: none }, and a closed sheet would stay on the page.
        className={`m-0 w-full max-w-none overflow-hidden border border-(--bsh-line) bg-(--bsh-surface) p-0 text-(--bsh-text) backdrop:bg-black/40 ${
          config.centreOnWide ? "sm:mx-auto sm:my-[8vh] sm:max-w-lg sm:rounded-[var(--bc-radius-lg,0.75rem)]" : ""
        } max-sm:mt-auto max-sm:mb-0 max-sm:rounded-t-[var(--bc-radius-xl,1rem)]`}
        style={{ height: heights[detent], marginTop: "auto", marginBottom: 0 }}
      >
        <div className="flex h-full flex-col">
        <div className="flex items-center justify-center border-b border-(--bsh-line) px-3 py-2">
          {/*
            The handle is a real button, not a decorative bar: the heights have to be reachable without
            dragging, which nobody on a keyboard and few people with a tremor can do.
          */}
          <button
            type="button"
            data-handle
            aria-label={canGrow ? config.expandLabel : config.collapseLabel}
            onClick={() => setAt(canGrow ? at + 1 : 0)}
            onKeyDown={handleKeys}
            className="flex min-h-11 w-24 items-center justify-center rounded-[var(--bc-radius-sm,0.375rem)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bsh-accent-text)"
          >
            <span aria-hidden="true" className="block h-1.5 w-10 rounded-full bg-(--bsh-line)" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <h2 id={`${id}-title`} className="text-xl font-semibold">
            {config.title}
          </h2>
          <p className="mt-2 text-(--bsh-muted)">{config.body}</p>
          {/* Which height it is at, in words: a bar that has moved is not a message. */}
          <p role="status" className="mt-3 text-sm text-(--bsh-muted)">
            {`${fill(config.heightText, { height: { peek: config.peekText, half: config.halfText, full: config.fullText }[detent] })}${canShrink ? "" : ` ${config.shortestText}`}`}
          </p>
        </div>

        <div className="flex flex-wrap gap-3 border-t border-(--bsh-line) p-4">
          <button
            type="button"
            onClick={() => close(`${config.confirmLabel} chosen.`)}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-[var(--bc-radius-button,0.375rem)] bg-(--bsh-accent) px-4 font-medium text-(--bsh-on-accent) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bsh-accent-text)"
          >
            {config.confirmLabel}
          </button>
          <button
            type="button"
            onClick={() => close(`${config.title} closed.`)}
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--bc-radius-sm,0.375rem)] border border-(--bsh-line) bg-(--bsh-sunk) px-4 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bsh-accent-text)"
          >
            {config.cancelLabel}
          </button>
        </div>
        </div>
      </dialog>
    </div>
  );
}
