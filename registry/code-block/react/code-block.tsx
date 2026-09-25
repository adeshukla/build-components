"use client";

import { useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export type CodeBlockConfig = {
  title: string;
  lines: { text: string }[];
  showLineNumbers: boolean;
  wrapToggle: boolean;
  copyText: string;
  copiedText: string;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: CodeBlockConfig = {
  title: "install.sh",
  lines: [
    { text: "# Copy the component into your project" },
    { text: "pnpm dlx shadcn@latest add https://build-components.devstash.me/r/tabs.json" },
    { text: "" },
    { text: "# Or take the file by hand and drop it in components/" },
    { text: "curl -O https://build-components.devstash.me/r/tabs.json" },
  ],
  showLineNumbers: true,
  wrapToggle: true,
  copyText: "Copy",
  copiedText: "Copied",
  theme: "dark",
  accentColor: "#0f766e",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#c9c4d6" },
  dark: { surface: "#141019", sunk: "#1c1826", text: "#f6f5fa", muted: "#b6b3c2", line: "#4a4459" },
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

export function CodeBlock({ config = defaultConfig }: { config?: CodeBlockConfig }) {
  const [wrap, setWrap] = useState(false);
  const [said, setSaid] = useState("");
  const codeRef = useRef<HTMLElement>(null);
  const timer = useRef<number | null>(null);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--cb-accent": config.accentColor,
    "--cb-accent-text": readableAccent(config.accentColor, dark),
    "--cb-surface": palette.surface,
    "--cb-sunk": palette.sunk,
    "--cb-text": palette.text,
    "--cb-muted": palette.muted,
    "--cb-line": palette.line,
  } as CSSProperties;

  const code = config.lines.map((line) => line.text).join("\n");

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setSaid(config.copiedText);
    } catch {
      // Clipboard access can be refused — in a sandboxed frame, or without permission. Select the
      // code so the keyboard shortcut still works rather than pretending it copied.
      const node = codeRef.current;
      if (node) {
        const range = document.createRange();
        range.selectNodeContents(node);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      setSaid("Selected. Press Ctrl+C (Cmd+C on a Mac) to copy.");
    }
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setSaid(""), 4000);
  }

  return (
    <div style={style} className="rounded-xl border border-(--cb-line) bg-(--cb-surface) text-(--cb-text)">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-(--cb-line) px-3 py-2">
        <p className="font-mono text-sm">{config.title}</p>
        <div className="flex flex-wrap gap-2">
          {config.wrapToggle && (
            <button
              type="button"
              aria-pressed={wrap}
              onClick={() => setWrap((current) => !current)}
              className="min-h-11 cursor-pointer rounded-md border border-(--cb-line) px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--cb-accent-text)"
            >
              Wrap lines
            </button>
          )}
          <button
            type="button"
            onClick={copy}
            className="min-h-11 cursor-pointer rounded-md border border-(--cb-line) px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--cb-accent-text)"
          >
            {config.copyText}
          </button>
        </div>
      </div>

      {/* A scrolling region takes focus, so it can be scrolled without a pointer. */}
      <div
        role="region"
        aria-label={`${config.title} code`}
        tabIndex={0}
        className="overflow-auto p-3 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--cb-accent-text)"
      >
        <pre className={`m-0 font-mono text-sm ${wrap ? "whitespace-pre-wrap" : "whitespace-pre"}`}>
          <code ref={codeRef}>
            {config.lines.map((line, index) => (
              <span key={index} className="block">
                {config.showLineNumbers && (
                  // Numbers are decoration: copying must not drag them along.
                  <span aria-hidden="true" className="mr-3 inline-block w-6 text-right text-(--cb-muted) select-none">
                    {index + 1}
                  </span>
                )}
                {line.text === "" ? " " : line.text}
              </span>
            ))}
          </code>
        </pre>
      </div>

      <p role="status" className="px-3 pb-2 text-sm text-(--cb-muted)">
        {said}
      </p>
    </div>
  );
}
