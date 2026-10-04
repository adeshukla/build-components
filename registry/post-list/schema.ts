import type { ConfigOf, Schema } from "@/lib/schema";
import type { PostListConfig } from "./react/post-list";

export const postListSchema = [
  { key: "heading", label: "Heading", group: "Content", type: "text", default: "From the blog", maxLength: 120 },
  { key: "headingLevel", label: "Heading level", description: "Each post's title sits one level under it.", group: "Content", type: "select", default: "h2", options: ["h2", "h3"] },
  { key: "intro", label: "Intro", description: "Leave it empty for none.", group: "Content", type: "text", default: "", maxLength: 300 },
  {
    key: "posts",
    label: "Posts",
    description: "Newest first. Dates as YYYY-MM-DD; a post with no title is not shown.",
    group: "Content",
    type: "list",
    default: [
      { title: "How we plan a week in one board", date: "2026-09-14", excerpt: "The three columns we use, and why nothing else made the cut.", href: "/blog/plan-a-week" },
      { title: "Writing decisions down, once", date: "2026-08-30", excerpt: "A short template for the decisions people keep asking about.", href: "/blog/writing-decisions-down" },
      { title: "Keyboard shortcuts worth learning first", date: "2026-08-02", excerpt: "Five keys that save the most time in a working day.", href: "/blog/shortcuts" },
    ],
    fields: [
      { key: "title", label: "Title", maxLength: 140 },
      { key: "date", label: "Date (YYYY-MM-DD)", maxLength: 10 },
      { key: "excerpt", label: "Summary", maxLength: 280 },
      { key: "href", label: "Link", maxLength: 300, format: "url" },
    ],
    maxItems: 12,
    itemLabel: "Post",
  },
  { key: "layout", label: "Layout", group: "Style", type: "select", default: "cards", options: ["cards", "list"] },
  { key: "showExcerpts", label: "Show summaries", group: "Add-ons", type: "boolean", default: true },
  { key: "theme", label: "Theme", group: "Style", type: "select", default: "light", options: ["light", "dark", "system"] },
  { key: "accentColor", label: "Accent colour", description: "Titles as they are pointed at, and focus rings.", group: "Style", type: "color", default: "#2563eb" },
  {
    key: "monthNames",
    label: "Month names",
    description: "The twelve months, January first, with commas between.",
    group: "Words",
    type: "text",
    default: "January,February,March,April,May,June,July,August,September,October,November,December",
    maxLength: 240,
  },
  {
    key: "dateText",
    label: "Date",
    description: "How a date is written. {day}, {month} and {year} are filled in.",
    group: "Words",
    type: "text",
    default: "{day} {month} {year}",
    maxLength: 40,
  },
] as const satisfies Schema;

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

// Compile error if the schema and the component's config type drift apart.
export const schemaMatchesComponent: Same<ConfigOf<typeof postListSchema>, PostListConfig> = true;
