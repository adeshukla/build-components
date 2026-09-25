"use client";

import { useId, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export type CommentThreadConfig = {
  heading: string;
  comments: { author: string; when: string; body: string; reply: string }[];
  allowReply: boolean;
  replyLabel: string;
  postText: string;
  yourName: string;
  collapsible: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: CommentThreadConfig = {
  heading: "Comments",
  comments: [
    { author: "Priya", when: "4 March, 9:12", body: "The hull drawings are a revision behind — worth a check before Friday.", reply: "no" },
    { author: "Sam", when: "4 March, 9:40", body: "Good spot. I have asked the yard for the current set.", reply: "yes" },
    { author: "Marta", when: "4 March, 11:02", body: "Do we need the survey signed before the refit starts?", reply: "no" },
  ],
  allowReply: true,
  replyLabel: "Add a comment",
  postText: "Post",
  yourName: "You",
  collapsible: true,
  theme: "light",
  accentColor: "#1d4ed8",
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

type Comment = { author: string; when: string; body: string; reply: boolean };

export function CommentThread({ config = defaultConfig }: { config?: CommentThreadConfig }) {
  const id = useId();
  const [extra, setExtra] = useState<Comment[]>([]);
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(true);
  const [said, setSaid] = useState("");
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const style = {
    "--ct-accent": config.accentColor,
    "--ct-accent-text": readableAccent(config.accentColor, dark),
    "--ct-on-accent": luminance(config.accentColor) > 0.179 ? "#000000" : "#ffffff",
    "--ct-surface": palette.surface,
    "--ct-sunk": palette.sunk,
    "--ct-text": palette.text,
    "--ct-muted": palette.muted,
    "--ct-line": palette.line,
  } as CSSProperties;

  const comments: Comment[] = [
    ...config.comments
      .filter((comment) => comment.body.trim() !== "")
      .map((comment) => ({ ...comment, reply: comment.reply === "yes" })),
    ...extra,
  ];

  function post() {
    const body = draft.trim();
    if (body === "") return;
    // "Just now" rather than a clock reading: a time formatted here would differ from the server's.
    setExtra((current) => [...current, { author: config.yourName, when: "Just now", body, reply: false }]);
    setDraft("");
    setSaid(`Comment posted. ${comments.length + 1} comments in this thread.`);
    fieldRef.current?.focus();
  }

  return (
    <div style={style} className="bg-(--ct-surface) text-(--ct-text)">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-semibold">
          {config.heading}
          <span className="text-base font-normal text-(--ct-muted)">{` (${comments.length})`}</span>
        </h2>
        {config.collapsible && (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={`${id}-list`}
            onClick={() => setOpen((current) => !current)}
            className="min-h-11 cursor-pointer rounded px-2 text-sm text-(--ct-accent-text) underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ct-accent-text)"
          >
            {open ? "Hide the thread" : "Show the thread"}
          </button>
        )}
      </div>

      {/* Replies are nested in their own list, so the shape of the conversation is in the markup. */}
      <ul id={`${id}-list`} hidden={config.collapsible && !open} className="mt-3 grid list-none gap-3 p-0">
        {comments.map((comment, index) => (
          <li
            key={`${comment.author}-${index}`}
            className={`rounded-lg border border-(--ct-line) p-3 ${comment.reply ? "ml-6 bg-(--ct-sunk)" : ""}`}
          >
            <p className="flex flex-wrap items-baseline gap-2 text-sm">
              <span className="font-medium">{comment.author}</span>
              <span className="text-(--ct-muted)">{comment.when}</span>
              {comment.reply && <span className="text-(--ct-muted)">· reply</span>}
            </p>
            <p className="mt-1 text-sm">{comment.body}</p>
          </li>
        ))}
      </ul>

      {config.allowReply && (
        <div className="mt-4">
          <label htmlFor={`${id}-field`} className="block text-sm font-medium">
            {config.replyLabel}
          </label>
          <textarea
            ref={fieldRef}
            id={`${id}-field`}
            rows={3}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="mt-1 w-full rounded-md border border-(--ct-line) bg-(--ct-sunk) p-3 text-(--ct-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ct-accent-text)"
          />
          <button
            type="button"
            disabled={draft.trim() === ""}
            onClick={post}
            className="mt-2 min-h-11 cursor-pointer rounded-md bg-(--ct-accent) px-4 font-medium text-(--ct-on-accent) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ct-accent-text) disabled:cursor-not-allowed disabled:opacity-50"
          >
            {config.postText}
          </button>
        </div>
      )}

      {/* A comment appearing further up the page is silent otherwise. */}
      <p role="status" className="mt-2 text-sm text-(--ct-muted)">
        {said}
      </p>
    </div>
  );
}
