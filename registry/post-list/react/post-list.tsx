"use client";

import { useId, useSyncExternalStore, type CSSProperties } from "react";

export type PostItem = { title: string; date: string; excerpt: string; href: string };
export type PostListConfig = {
  heading: string;
  headingLevel: "h2" | "h3";
  intro: string;
  posts: PostItem[];
  layout: "cards" | "list";
  showExcerpts: boolean;
  theme: "light" | "dark" | "system";
  accentColor: string;
};

// @config-start
const defaultConfig: PostListConfig = {
  heading: "From the blog",
  headingLevel: "h2",
  intro: "",
  posts: [
    { title: "How we plan a week in one board", date: "2026-09-14", excerpt: "The three columns we use, and why nothing else made the cut.", href: "/blog/plan-a-week" },
    { title: "Writing decisions down, once", date: "2026-08-30", excerpt: "A short template for the decisions people keep asking about.", href: "/blog/writing-decisions-down" },
    { title: "Keyboard shortcuts worth learning first", date: "2026-08-02", excerpt: "Five keys that save the most time in a working day.", href: "/blog/shortcuts" },
  ],
  layout: "cards",
  showExcerpts: true,
  theme: "light",
  accentColor: "#2563eb",
};
// @config-end

const palettes = {
  light: { surface: "#ffffff", sunk: "#f4f3f8", text: "#16121f", muted: "#4d4a57", line: "#d9d5e4" },
  dark: { surface: "#141019", sunk: "#1c1726", text: "#f6f5fa", muted: "#b6b3c2", line: "#3a3448" },
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

/** Relative, fragment, http(s), mailto and tel links only. */
function safeHref(value: string) {
  return /^(\/|#|https?:\/\/|mailto:|tel:)/i.test(value.trim()) ? value.trim() : "#";
}

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "2026-09-14" as "14 September 2026", by hand: Intl differs between the server and the browser. */
export function sayDate(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return "";
  const month = months[Number(match[2]) - 1];
  return month ? `${Number(match[3])} ${month} ${match[1]}` : "";
}

export function PostList({ config = defaultConfig }: { config?: PostListConfig }) {
  const id = useId();
  const systemDark = useSyncExternalStore(darkMedia.subscribe, darkMedia.get, () => false);
  const dark = config.theme === "dark" || (config.theme === "system" && systemDark);
  const palette = dark ? palettes.dark : palettes.light;
  const Heading = config.headingLevel;
  // Each post's title sits one level under the section's heading.
  const Title = config.headingLevel === "h2" ? "h3" : "h4";
  const cards = config.layout === "cards";
  const posts = config.posts.filter((post) => post.title.trim() !== "");
  const style = {
    "--pl-accent-text": readableAccent(config.accentColor, dark),
    "--pl-surface": `var(--bc-${dark ? "dark" : "light"}-surface, ${palette.surface})`,
    "--pl-sunk": `var(--bc-${dark ? "dark" : "light"}-sunk, ${palette.sunk})`,
    "--pl-text": `var(--bc-${dark ? "dark" : "light"}-text, ${palette.text})`,
    "--pl-muted": `var(--bc-${dark ? "dark" : "light"}-muted, ${palette.muted})`,
    "--pl-line": `var(--bc-${dark ? "dark" : "light"}-line, ${palette.line})`,
  } as CSSProperties;

  return (
    <section aria-labelledby={`${id}-heading`} style={style} className="bg-(--pl-surface) text-(--pl-text)">
      <Heading id={`${id}-heading`} className="text-3xl font-bold tracking-tight text-balance">
        {config.heading}
      </Heading>
      {config.intro.trim() !== "" && <p className="mt-3 max-w-2xl text-lg text-(--pl-muted)">{config.intro}</p>}
      <ul className={`mt-8 list-none p-0 ${cards ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "grid"}`}>
        {posts.map((post, index) => (
          <li key={index} className="min-w-0">
            <article
              className={`relative flex h-full flex-col ${cards ? "rounded-[var(--bc-radius-lg,0.75rem)] border border-(--pl-line) bg-(--pl-sunk) p-6" : "border-t border-(--pl-line) py-5"}`}
            >
              <Title className="m-0 text-xl leading-snug font-semibold text-pretty">
                {/* The whole card is the link's target, through a stretched ::after; the title is its name. */}
                <a
                  href={safeHref(post.href)}
                  className="text-(--pl-text) no-underline after:absolute after:inset-0 hover:text-(--pl-accent-text) hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--pl-accent-text)"
                >
                  {post.title}
                </a>
              </Title>
              {sayDate(post.date) && (
                <p className="m-0 mt-1 text-sm text-(--pl-muted)">
                  <time dateTime={post.date.trim()}>{sayDate(post.date)}</time>
                </p>
              )}
              {config.showExcerpts && post.excerpt.trim() !== "" && <p className="m-0 mt-3 text-(--pl-muted)">{post.excerpt}</p>}
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
