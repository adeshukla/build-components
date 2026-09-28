"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export type InlineConfirmConfig = {
  itemLabel: string;
  actionLabel: string;
  question: string;
  confirmLabel: string;
  cancelLabel: string;
  doneText: string;
  cancelledText: string;
  focusOn: "cancel" | "confirm";
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: InlineConfirmConfig = {
  itemLabel: "Quarterly report.pdf",
  actionLabel: "Delete",
  question: "Delete this file?",
  confirmLabel: "Yes, delete",
  cancelLabel: "Keep it",
  doneText: "Quarterly report.pdf deleted.",
  cancelledText: "Nothing was deleted.",
  focusOn: "cancel",
  theme: "light",
  accentColor: "#b42318",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
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

export function InlineConfirm({ config = defaultConfig }: { config?: InlineConfirmConfig }) {
  const id = useId();
  const [asking, setAsking] = useState(false);
  const [result, setResult] = useState("");
  const [gone, setGone] = useState(false);
  const wanted = useRef<"ask" | "back" | "row" | null>(null);
  const isAsking = useRef(false);
  const root = useRef<HTMLDivElement | null>(null);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--icf-accent": config.accentColor,
    "--icf-accent-text": readableAccent(config.accentColor, dark),
    "--icf-on-accent": luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff",
    "--icf-surface": palette.surface,
    "--icf-sunk": palette.sunk,
    "--icf-text": palette.text,
    "--icf-muted": palette.muted,
    "--icf-line": palette.line,
  } as CSSProperties;

  // Focus moves after React has rendered, not a frame later: the buttons do not exist until then.
  useEffect(() => {
    const want = wanted.current;
    if (want === null) return;
    wanted.current = null;
    const selector = want === "ask" ? `[data-${config.focusOn}]` : want === "row" ? "[data-row]" : "[data-start]";
    root.current?.querySelector<HTMLElement>(selector)?.focus();
  });

  // Escape is the way out of a question nobody meant to ask. Heard on the document, because Safari
  // does not focus a button when it is clicked.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || !isAsking.current) return;
      isAsking.current = false;
      wanted.current = "back";
      setAsking(false);
      setResult(config.cancelledText);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [config.cancelledText]);

  const button =
    "inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--icf-accent-text)";

  return (
    <div ref={root} style={style} className="bg-(--icf-surface) text-(--icf-text)">
      <ul className="m-0 list-none p-0">
        {/*
          The name and the delete button keep their exact position when the question appears: the row
          only ever grows downwards. content-start matters — without it the spare height of a one-line
          row is shared out, and the first line rises the moment a second one wraps under it.
        */}
        <li
          data-row
          tabIndex={-1}
          className="flex min-h-16 flex-wrap content-start items-center justify-between gap-3 border-y border-(--icf-line) px-1 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--icf-accent-text)"
        >
          {/* As tall as the buttons beside it: the delete button leaves the line when the question
              appears, and without this the name would rise to meet the shorter line. */}
          <span
            data-name
            className={`inline-flex min-h-11 items-center ${gone ? "text-(--icf-muted) line-through" : ""}`}
          >
            {config.itemLabel}
          </span>

          {!asking && !gone && (
            <button
              type="button"
              data-start
              onClick={() => {
                setResult("");
                wanted.current = "ask";
                isAsking.current = true;
                setAsking(true);
              }}
              className={`${button} border border-(--icf-line) bg-(--icf-sunk) text-(--icf-accent-text)`}
            >
              {config.actionLabel}
            </button>
          )}

          {asking && (
            // A named group: the focus move into it announces the question, so nothing has to be
            // shouted through a live region.
            <div role="group" aria-labelledby={`${id}-question`} className="flex flex-wrap items-center gap-2">
              <span id={`${id}-question`} className="text-sm font-medium">
                {config.question}
              </span>
              <button
                type="button"
                data-confirm
                onClick={() => {
                  isAsking.current = false;
                  setAsking(false);
                  setGone(true);
                  setResult(config.doneText);
                  // The button that was pressed has gone, so focus lands on the row it was in rather
                  // than on the page body.
                  wanted.current = "row";
                }}
                className={`${button} bg-(--icf-accent) text-(--icf-on-accent)`}
              >
                {config.confirmLabel}
              </button>
              <button
                type="button"
                data-cancel
                onClick={() => {
                  isAsking.current = false;
                  setAsking(false);
                  setResult(config.cancelledText);
                  wanted.current = "back";
                }}
                className={`${button} border border-(--icf-line) bg-(--icf-sunk)`}
              >
                {config.cancelLabel}
              </button>
            </div>
          )}

          {gone && <span className="text-sm text-(--icf-muted)">{config.doneText}</span>}
        </li>
      </ul>

      <p role="status" className="mt-3 text-sm text-(--icf-muted)">
        {result}
      </p>
    </div>
  );
}
