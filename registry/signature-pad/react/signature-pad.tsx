"use client";

import { useId, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export type SignaturePadConfig = {
  label: string;
  hint: string;
  typedAlternative: boolean;
  typedLabel: string;
  clearText: string;
  confirmText: string;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: SignaturePadConfig = {
  label: "Sign here",
  hint: "Draw with a finger, a mouse or a stylus.",
  typedAlternative: true,
  typedLabel: "Or type your full name instead",
  clearText: "Clear",
  confirmText: "Confirm signature",
  theme: "light",
  accentColor: "#1d4ed8",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6", ink: "#16121f" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459", ink: "#f6f5fa" },
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

const WIDTH = 600;
const HEIGHT = 180;

export function SignaturePad({ config = defaultConfig }: { config?: SignaturePadConfig }) {
  const id = useId();
  const [drawn, setDrawn] = useState(false);
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--sp-accent": config.accentColor,
    "--sp-accent-text": readableAccent(config.accentColor, dark),
    "--sp-on-accent": luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff",
    "--sp-surface": palette.surface,
    "--sp-sunk": palette.sunk,
    "--sp-text": palette.text,
    "--sp-muted": palette.muted,
    "--sp-line": palette.line,
  } as CSSProperties;

  const signed = drawn || typed.trim() !== "";

  /** Canvas pixels from a pointer position, whatever size the canvas is drawn at. */
  function at(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = event.currentTarget;
    const box = canvas.getBoundingClientRect();
    return { x: ((event.clientX - box.left) / box.width) * WIDTH, y: ((event.clientY - box.top) / box.height) * HEIGHT };
  }

  function start(event: React.PointerEvent<HTMLCanvasElement>) {
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    drawing.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    const { x, y } = at(event);
    context.strokeStyle = palette.ink;
    context.lineWidth = 2.5;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    context.moveTo(x, y);
  }

  function move(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    const { x, y } = at(event);
    context.lineTo(x, y);
    context.stroke();
    if (!drawn) setDrawn(true);
  }

  function clear() {
    const canvas = canvasRef.current;
    canvas?.getContext("2d")?.clearRect(0, 0, WIDTH, HEIGHT);
    setDrawn(false);
    setTyped("");
    setResult("Signature cleared");
  }

  return (
    <div style={style} className="bg-(--sp-surface) text-(--sp-text)">
      <p id={`${id}-label`} className="text-sm font-medium">
        {config.label}
      </p>
      <p id={`${id}-hint`} className="text-sm text-(--sp-muted)">
        {config.hint}
        {config.typedAlternative && " A drawing needs a pointer, so you can type your name instead."}
      </p>

      {/* The drawing is a picture of a name, so it carries a label and its state in words. */}
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        role="img"
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-hint`}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={() => {
          drawing.current = false;
        }}
        onPointerCancel={() => {
          drawing.current = false;
        }}
        className="mt-2 w-full touch-none rounded-lg border border-(--sp-line) bg-(--sp-sunk)"
        style={{ aspectRatio: `${WIDTH} / ${HEIGHT}` }}
      />

      {config.typedAlternative && (
        <div className="mt-3">
          <label htmlFor={`${id}-typed`} className="block text-sm font-medium">
            {config.typedLabel}
          </label>
          <input
            id={`${id}-typed`}
            type="text"
            value={typed}
            autoComplete="name"
            onChange={(event) => setTyped(event.target.value)}
            className="mt-1 min-h-11 w-full rounded-md border border-(--sp-line) bg-(--sp-sunk) px-3 text-(--sp-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--sp-accent-text)"
          />
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={clear}
          className="min-h-11 cursor-pointer rounded-md border border-(--sp-line) px-4 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--sp-accent-text)"
        >
          {config.clearText}
        </button>
        <button
          type="button"
          disabled={!signed}
          onClick={() => setResult(drawn ? "Signed by drawing" : `Signed as ${typed.trim()}`)}
          className="min-h-11 cursor-pointer rounded-md bg-(--sp-accent) px-4 font-medium text-(--sp-on-accent) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--sp-accent-text) disabled:cursor-not-allowed disabled:opacity-50"
        >
          {config.confirmText}
        </button>
      </div>

      {/* Whether there is a signature at all is invisible to anyone not looking at the box. */}
      <p role="status" className="mt-2 text-sm text-(--sp-muted)">
        {result || (signed ? "There is a signature" : "Nothing signed yet")}
      </p>
    </div>
  );
}
