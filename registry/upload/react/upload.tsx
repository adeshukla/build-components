"use client";

import { useRef, useState, useSyncExternalStore, type CSSProperties, type DragEvent } from "react";

export type UploadConfig = {
  label: string;
  hint: string;
  buttonText: string;
  dropText: string;
  accept: string;
  maxSizeMb: number;
  maxFiles: number;
  multiple: boolean;
  showSize: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
  radius: number;
};

// @config-start
const defaultConfig: UploadConfig = {
  label: "Attach your brief",
  hint: "PDF, Word or an image, up to 5 MB each.",
  buttonText: "Choose files",
  dropText: "or drop them here",
  accept: ".pdf,.doc,.docx,.png,.jpg,.jpeg",
  maxSizeMb: 5,
  maxFiles: 5,
  multiple: true,
  showSize: true,
  theme: "light",
  accentColor: "#2563eb",
  radius: 12,
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#8d8a99", error: "#b4232b" },
  dark: { surface: "#141019", sunk: "#221d2e", text: "#f6f5fa", muted: "#b6b3c2", line: "#8d8a99", error: "#ff8f8f" },
};

const darkMedia = {
  subscribe: (onChange: () => void) => {
    const list = window.matchMedia("(prefers-color-scheme: dark)");
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  },
  get: () => window.matchMedia("(prefers-color-scheme: dark)").matches,
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

/** Written by hand, not by locale, so the server and the browser always agree. */
export function fileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** The same checks for both outputs: type first, then size, then how many. */
export function fileProblem(file: { name: string; size: number }, accept: string, maxSizeMb: number) {
  const kinds = accept
    .split(",")
    .map((kind) => kind.trim().toLowerCase())
    .filter(Boolean);
  const name = file.name.toLowerCase();
  if (kinds.length > 0 && !kinds.some((kind) => (kind.startsWith(".") ? name.endsWith(kind) : name.includes(kind)))) {
    return `${file.name} is not a kind of file we accept. Accepted: ${accept}.`;
  }
  if (maxSizeMb > 0 && file.size > maxSizeMb * 1024 * 1024) {
    return `${file.name} is ${fileSize(file.size)}. The largest we can take is ${maxSizeMb} MB.`;
  }
  return "";
}

type Chosen = { name: string; size: number };

export function Upload({ config = defaultConfig }: { config?: UploadConfig }) {
  const [files, setFiles] = useState<Chosen[]>([]);
  const [problems, setProblems] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const accentLuminance = luminance(config.accentColor);

  function add(incoming: Chosen[]) {
    const found: string[] = [];
    const kept: Chosen[] = [];
    for (const file of incoming) {
      const problem = fileProblem(file, config.accept, config.maxSizeMb);
      if (problem !== "") found.push(problem);
      // One at a time means the new file replaces the old one, so the count starts from zero.
      else if ((config.multiple ? files.length : 0) + kept.length >= config.maxFiles) {
        found.push(`You can attach ${config.maxFiles} file${config.maxFiles === 1 ? "" : "s"} at most.`);
        break;
      } else kept.push(file);
    }
    const all = config.multiple ? [...files, ...kept] : kept.slice(-1);
    setFiles(all);
    setProblems(found);
    if (kept.length > 0) {
      setMessage(`${kept.map((file) => file.name).join(", ")} attached. ${all.length} file${all.length === 1 ? "" : "s"} in all.`);
    }
  }

  function remove(index: number) {
    const gone = files[index];
    const rest = files.filter((_, entry) => entry !== index);
    setFiles(rest);
    setMessage(`${gone.name} removed. ${rest.length === 0 ? "No files attached." : `${rest.length} left.`}`);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setOver(false);
    add(Array.from(event.dataTransfer.files).map((file) => ({ name: file.name, size: file.size })));
  }

  const style = {
    "--up-accent": config.accentColor,
    "--up-accent-text": readableAccent(config.accentColor, dark),
    "--up-on-accent": accentLuminance > 0.179 ? "#000000" : "#ffffff",
    "--up-radius": `${config.radius}px`,
    "--up-surface": palette.surface,
    "--up-sunk": palette.sunk,
    "--up-text": palette.text,
    "--up-muted": palette.muted,
    "--up-line": palette.line,
    "--up-error": palette.error,
  } as CSSProperties;
  const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--up-accent-text)";

  return (
    <div style={style} className="bg-(--up-surface) text-(--up-text)">
      <p id="upload-label" className="font-medium">
        {config.label}
      </p>
      {config.hint.trim() !== "" && (
        <p id="upload-hint" className="mt-0.5 text-sm text-(--up-muted)">
          {config.hint}
        </p>
      )}

      {/* Dropping is a shortcut, never the only way in: the file input underneath does the work. */}
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={`mt-2 flex flex-wrap items-center justify-center gap-2 rounded-(--up-radius) border-2 border-dashed p-6 text-center ${
          over ? "border-(--up-accent) bg-(--up-sunk)" : "border-(--up-line)"
        }`}
      >
        <label
          className={`inline-flex min-h-10 cursor-pointer items-center rounded-(--up-radius) bg-(--up-accent) px-4 py-2 font-semibold text-(--up-on-accent) focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-(--up-accent-text)`}
        >
          {config.buttonText}
          <input
            ref={inputRef}
            type="file"
            multiple={config.multiple}
            accept={config.accept}
            aria-describedby={config.hint.trim() !== "" ? "upload-hint" : undefined}
            onChange={(event) => {
              add(Array.from(event.target.files ?? []).map((file) => ({ name: file.name, size: file.size })));
              event.target.value = "";
            }}
            // Off-screen, not display:none: a hidden input cannot be focused or read out.
            className="sr-only"
          />
        </label>
        <span aria-hidden="true" className="text-sm text-(--up-muted)">
          {config.dropText}
        </span>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {message}
      </p>

      {problems.length > 0 && (
        <ul role="alert" className="mt-3 flex list-none flex-col gap-1 p-0 text-sm font-medium text-(--up-error)">
          {problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      )}

      {files.length > 0 && (
        <ul aria-labelledby="upload-label" className="mt-3 flex list-none flex-col gap-2 p-0">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center justify-between gap-3 rounded-(--up-radius) border border-(--up-line) px-3 py-2"
            >
              <span className="min-w-0 truncate">
                {file.name}
                {config.showSize && <span className="ml-2 text-sm text-(--up-muted)">{fileSize(file.size)}</span>}
              </span>
              <button
                type="button"
                onClick={() => remove(index)}
                className={`grid size-8 shrink-0 cursor-pointer place-items-center rounded-full hover:bg-(--up-sunk) ${focus}`}
              >
                <span className="sr-only">Remove {file.name}</span>
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
